import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import parkingLotApi from "../api/parkingLotApi";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { showInfo, showSuccess, showError } from "../utils/toastUtils.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import EditParkingLotModal from "../components/EditParkingLotModal.jsx"; // ✅ thêm import popup edit

export default function AdminParkingLots() {
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(11);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmingLot, setConfirmingLot] = useState(null);

  // ✅ state mới cho popup Edit
  const [editingLot, setEditingLot] = useState(null);

  // ✅ Fetch parking lots
  const fetchLots = async () => {
    try {
      setLoading(true);
      const res = await parkingLotApi.getAll({
        page,
        size,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const data = res.data?.data;
      setLots(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching parking lots:", err);
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, [page, size]);

  // ✅ Filter
  const filtered = lots.filter((lot) => {
    const keyword = search.toLowerCase();
    const fields = [
      lot.name,
      lot.city,
      lot.streetAddress,
      lot.totalFloors?.toString(),
      lot.is24Hour ? "yes" : "no",
    ];
    const matchesKeyword = fields.some((f) => f?.toLowerCase().includes(keyword));
    const matchesStatus = status ? lot.status === status : true;
    return matchesKeyword && matchesStatus;
  });

  // ✅ Status UI
  const renderStatus = (status) => {
    const base = "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status) {
      case "PENDING":
        return <span className={`${base} text-gray-600 bg-gray-50 border-gray-300`}>Pending</span>;
      case "UNDER_SURVEY":
        return <span className={`${base} text-yellow-700 bg-yellow-50 border-yellow-300`}>Under Survey</span>;
      case "PREPARING":
        return <span className={`${base} text-orange-600 bg-orange-50 border-orange-300`}>Preparing</span>;
      case "PARTNER_CONFIGURATION":
        return <span className={`${base} text-indigo-600 bg-indigo-50 border-indigo-300`}>Partner Config</span>;
      case "ACTIVE_PENDING":
        return <span className={`${base} text-blue-700 bg-blue-50 border-blue-300`}>Active Pending</span>;
      case "ACTIVE":
        return <span className={`${base} text-green-700 bg-green-50 border-green-300`}>Active</span>;
      case "INACTIVE":
        return <span className={`${base} text-gray-700 bg-gray-50 border-gray-300`}>Inactive</span>;
      case "UNDER_MAINTENANCE":
        return <span className={`${base} text-yellow-600 bg-yellow-50 border-yellow-300`}>Maintenance</span>;
      case "MAP_DENIED":
        return <span className={`${base} text-purple-600 bg-purple-50 border-purple-300`}>Map Denied</span>;
      case "REJECTED":
        return <span className={`${base} text-red-600 bg-red-50 border-red-300`}>Rejected</span>;
      case "DENIED":
        return <span className={`${base} text-rose-600 bg-rose-50 border-rose-300`}>Denied</span>;
      default:
        return <span className={`${base} text-gray-500 bg-gray-50 border-gray-300`}>Unknown</span>;
    }
  };

  // ✅ Delete
  const handleDelete = (lot) => setConfirmingLot(lot);

  const confirmDelete = async () => {
    const lot = confirmingLot;
    if (!lot) return;

    try {
      const res = await parkingLotApi.delete(lot.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`Deleted "${lot.name}" successfully!`);
        fetchLots();
      } else {
        showError("❌ Failed to delete parking lot (invalid status code).");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      const msg = err.response?.data?.message || "❌ Failed to delete parking lot.";
      showError(msg);
    } finally {
      setConfirmingLot(null);
    }
  };

  // ✅ Edit
  const handleEdit = (lot) => {
    setEditingLot(lot); // mở modal
  };

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">Parking Lot Management</h2>
      </div>

      {/* 🔹 Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        {/* Left side: Search + Status */}
        <div className="flex flex-wrap items-center gap-3 flex-grow">
          {/* 🔍 Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, city, address, floors, or 24h..."
              className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-80 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.75 6.75a7.5 7.5 0 0 0 9.9 9.9z"
              />
            </svg>
          </div>

          {/* ⚙️ Status Filter */}
          <select
            className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_SURVEY">Under Survey</option>
            <option value="PREPARING">Preparing</option>
            <option value="PARTNER_CONFIGURATION">Partner Config</option>
            <option value="ACTIVE_PENDING">Active Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="MAP_DENIED">Map Denied</option>
            <option value="REJECTED">Rejected</option>
            <option value="DENIED">Denied</option>
          </select>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showInfo("🟣 Add Parking Lot clicked")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add Parking Lot
          </button>

          <button
            onClick={() => showInfo("🟡 Import clicked")}
            className="flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border border-yellow-200 transition"
          >
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import
          </button>

          <button
            onClick={() => showInfo("🟢 Export clicked")}
            className="flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border border-green-200 transition"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Export
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">City</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Floors</th>
              <th className="px-6 py-3 text-left">24 Hours</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 italic">
                  Loading data...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((lot, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-indigo-50 transition-all"
                >
                  <td className="px-6 py-3 text-gray-500">{page * size + idx + 1}</td>
                  <td className="px-6 py-3 font-medium">{lot.name}</td>
                  <td className="px-6 py-3">{lot.city}</td>
                  <td className="px-6 py-3 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    {lot.streetAddress || "-"}
                  </td>
                  <td className="px-6 py-3">{lot.totalFloors}</td>
                  <td className="px-6 py-3">
                    {lot.is24Hour ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-500">No</span>
                    )}
                  </td>
                  <td className="px-6 py-3">{renderStatus(lot.status)}</td>

                  {/* ✅ Actions column */}
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="Edit"
                        onClick={() => handleEdit(lot)}
                        className="p-2 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => handleDelete(lot)}
                        className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-6 text-center text-gray-500 italic">
                  No parking lots found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Previous
        </button>

        <span className="text-gray-600 text-sm">
          Page <strong>{page + 1}</strong> of {totalPages}
        </span>

        <button
          disabled={page >= totalPages - 1 || loading}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>

      {/* ✅ Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmingLot}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${confirmingLot?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingLot(null)}
      />

      {/* ✅ Popup Edit */}
      <EditParkingLotModal
        open={!!editingLot}
        lot={editingLot}
        onClose={() => setEditingLot(null)}
        onUpdated={fetchLots}
      />
    </AdminLayout>
  );
}
