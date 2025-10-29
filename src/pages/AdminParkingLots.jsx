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
  EyeIcon,
} from "@heroicons/react/24/outline";
import { showInfo, showSuccess, showError } from "../utils/toastUtils.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import EditParkingLotModal from "../components/EditParkingLotModal.jsx";
import ViewParkingLotReadOnlyModal from "../components/ViewParkingLotReadOnlyModal.jsx"; // ✅ modal mới
import AddParkingLotModal from "../components/AddParkingLotModal.jsx";

export default function AdminParkingLots() {
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmingLot, setConfirmingLot] = useState(null);
  const [editingLot, setEditingLot] = useState(null);
  const [viewingLot, setViewingLot] = useState(null); // ✅ thêm state để xem chi tiết
  const [showAddModal, setShowAddModal] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  // Fetch total count of parking lots
  const fetchLotsCount = async (filters = {}) => {
    try {
      const res = await parkingLotApi.count(filters);
      const count = Number(res.data?.data ?? res.data ?? 0) || 0;
      setTotalCount(count);
    } catch (err) {
      console.error("❌ Error fetching lots count:", err);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchLotsCount();
  }, []);

  // keep count updated when lots change
  useEffect(() => {
    fetchLotsCount();
  }, [lots]);

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
    const matchesKeyword = fields.some((f) =>
      f?.toLowerCase().includes(keyword)
    );
    const matchesStatus = status ? lot.status === status : true;
    return matchesKeyword && matchesStatus;
  });

  // ✅ Status UI
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status) {
      case "PENDING":
        return (
          <span className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}>
            Pending
          </span>
        );
      case "PREPARING":
        return (
          <span
            className={`${base} bg-orange-50 text-orange-700 border-orange-300`}
          >
            Preparing
          </span>
        );
      case "PARTNER_CONFIGURATION":
        return (
          <span
            className={`${base} bg-indigo-50 text-indigo-700 border-indigo-300`}
          >
            Partner Configuration
          </span>
        );
      case "ACTIVE":
        return (
          <span
            className={`${base} bg-green-50 text-green-700 border-green-300`}
          >
            Active
          </span>
        );
      case "INACTIVE":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Inactive
          </span>
        );
      case "MAP_DENIED":
        return (
          <span
            className={`${base} bg-red-50 text-red-700 border-red-300`}
          >
            Map Denied
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${base} text-gray-500 bg-gray-50 border-gray-300`}>
            Unknown
          </span>
        );
    }
  };

  // ✅ Delete
  const handleDelete = (lot) => {
    // Don't allow deletion when parking lot is in PENDING state
    if (lot?.status === "PENDING") {
      showError(
        "Bãi xe đang ở trạng thái Pending và không thể vô hiệu hoá. Vui lòng xử lý trạng thái yêu cầu trước khi xóa."
      );
      return;
    }

    setConfirmingLot(lot);
  };

  const confirmDelete = async () => {
    const lot = confirmingLot;
    if (!lot) return;

    try {
      setDeleting(true);
      const res = await parkingLotApi.deleteRegister(lot.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`🗑️ "${lot.name}" đã được vô hiệu hoá (INACTIVE).`);
        // refresh list
        await fetchLots();
        // close modal after successful delete
        setConfirmingLot(null);
      } else {
        showError("❌ Failed to delete parking lot (invalid status code).");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || err.message;

      if (status === 409) {
        // Conflict - business rule prevents deletion (e.g., active bookings)
        showError(
          serverMsg ||
            "Không thể vô hiệu hoá bãi xe do có ràng buộc (ví dụ: đặt chỗ đang hoạt động). Vui lòng kiểm tra các booking trước khi vô hiệu hoá."
        );
        // keep modal open so admin can take action
        return;
      }

      showError(serverMsg || "❌ Failed to delete parking lot.");
    } finally {
      setDeleting(false);
    }
  };

  // Deleting state for confirm button
  const [deleting, setDeleting] = useState(false);

  // ✅ Edit
  const handleEdit = (lot) => {
    setEditingLot(lot);
  };

  // ✅ View
  // Fetch and show full details for a parking lot (fetch first, then open modal)
  const handleView = async (lot) => {
    try {
      const res = await parkingLotApi.getById(lot.id);
      const detail = res.data?.data ?? res.data ?? null;
      if (!detail) throw new Error("Empty parking lot detail");
      setViewingLot(detail);
    } catch (err) {
      console.error("❌ Error fetching parking lot detail:", err);
      showError("Không thể tải chi tiết bãi xe.");
    }
  };

  // ✅ Import Excel
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showInfo("📤 Importing Excel...");
      await parkingLotApi.importExcel(file);
      showSuccess("✅ Import Excel successfully!");
      fetchLots();
    } catch (err) {
      console.error("❌ Import error:", err);
      showError(err.response?.data?.message || "Failed to import Excel file!");
    } finally {
      e.target.value = null;
    }
  };

  // ✅ Export Excel
  const handleExport = async () => {
    try {
      showInfo("📥 Exporting Excel...");
      const res = await parkingLotApi.exportExcel();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ParkingLots_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess("✅ Export Excel successfully!");
    } catch (err) {
      console.error("❌ Export error:", err);
      showError("Failed to export Excel file!");
    }
  };

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">
          Parking Lot Management
        </h2>
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
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PREPARING">Preparing</option>
            <option value="PARTNER_CONFIGURATION">Partner Configuration</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="MAP_DENIED">Map Denied</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add Parking Lot
          </button>

          {/* ✅ Import */}
          <label className="flex items-center hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import 
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          {/* ✅ Export */}
          <button
            onClick={handleExport}
            className="flex items-center hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer"
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
                <td
                  colSpan="8"
                  className="text-center py-8 text-gray-500 italic"
                >
                  Loading data...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((lot, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
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

                  {/* ✅ Actions */}
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      {/* �👁 View */}
                      <button
                        title="View"
                        onClick={() => handleView(lot)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>

                      {/* ✏ Edit */}
                      <button
                        title="Edit"
                        onClick={() => handleEdit(lot)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>

                      {/* 🗑 Delete */}
                      <button
                        title="Delete"
                        onClick={() => handleDelete(lot)}
                        className="p-2 rounded-full hover:bg-red-100 transition cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
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
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ← Previous
        </button>

        <div className="text-center text-gray-600 text-sm">
          <div>
            Page <strong>{page + 1}</strong> of {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total lots: <strong className="text-indigo-700">{totalCount}</strong>
          </div>
        </div>

        <button
          disabled={page >= totalPages - 1 || loading}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Next →
        </button>
      </div>

      {/* ✅ Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmingLot}
        title="Deactivate Parking Lot"
        message={`This will set the parking lot "${confirmingLot?.name}" to INACTIVE (soft delete). Continue?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingLot(null)}
        loading={deleting}
        confirmLabel="Deactivate"
      />

      {/* ✅ Popup Edit */}
      <EditParkingLotModal
        open={!!editingLot}
        lot={editingLot}
        onClose={() => setEditingLot(null)}
        onUpdated={fetchLots}
      />

      {/* ✅ Popup View (open only after details fetched, like AdminParkingLotRequests) */}
      {viewingLot && (
        <ViewParkingLotReadOnlyModal
          lot={viewingLot}
          onClose={() => setViewingLot(null)}
        />
      )}

      {/* ✅ Add Parking Lot Modal */}
      <AddParkingLotModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={fetchLots}
      />
    </AdminLayout>
  );
}
