import { useState, useEffect } from "react";
import parkingLotApi from "../api/parkingLotApi";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import ViewParkingLotModal from "../components/ViewParkingLotModal";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function AdminParkingLotRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewingLot, setViewingLot] = useState(null);
  const [confirmingLot, setConfirmingLot] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await parkingLotApi.getAll({
        page,
        size,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const data = res.data?.data;
      setRequests(Array.isArray(data?.content) ? data.content : data || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching parking lots:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // ✅ View details popup
  const handleView = async (id) => {
    try {
      const res = await parkingLotApi.getById(id);
      const lotData = res.data?.data;
      setViewingLot(lotData || null);
    } catch (err) {
      console.error("❌ Error fetching details:", err);
      showError("Failed to fetch parking lot details!");
    }
  };

  // ✅ Delete confirm
  const handleDelete = (item) => setConfirmingLot(item);

  const confirmDelete = async () => {
    const lot = confirmingLot;
    if (!lot) return;
    try {
      const res = await parkingLotApi.deleteRegister(lot.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`🗑️ Deleted "${lot.name}" successfully!`);
        fetchData();
      } else showError("❌ Failed to delete item.");
    } catch (err) {
      console.error("❌ Error deleting lot:", err);
      showError(err.response?.data?.message || "❌ Failed to delete lot.");
    } finally {
      setConfirmingLot(null);
    }
  };

  // ✅ Filter
  const filtered = requests.filter((r) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      r.name?.toLowerCase().includes(keyword) ||
      r.streetAddress?.toLowerCase().includes(keyword) ||
      r.ward?.toLowerCase().includes(keyword) ||
      r.city?.toLowerCase().includes(keyword) ||
      r.status?.toLowerCase().includes(keyword);

    const matchStatus = status
      ? r.status?.toLowerCase() === status.toLowerCase()
      : true;

    const createdAt = new Date(r.createdAt || r.updatedAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const matchDate = (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchSearch && matchStatus && matchDate;
  });

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base = "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    const s = status?.toUpperCase();
    const colorMap = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-300",
      UNDER_SURVEY: "bg-blue-50 text-blue-700 border-blue-300",
      PREPARING: "bg-orange-50 text-orange-700 border-orange-300",
      PARTNER_CONFIGURATION: "bg-indigo-50 text-indigo-700 border-indigo-300",
      ACTIVE_PENDING: "bg-cyan-50 text-cyan-700 border-cyan-300",
      ACTIVE: "bg-green-50 text-green-700 border-green-300",
      INACTIVE: "bg-gray-50 text-gray-600 border-gray-300",
      UNDER_MAINTENANCE: "bg-amber-50 text-amber-700 border-amber-300",
      MAP_DENIED: "bg-red-50 text-red-700 border-red-300",
      REJECTED: "bg-red-50 text-red-700 border-red-300",
    };

    return (
      <span className={`${base} ${colorMap[s] || "bg-gray-50 text-gray-600 border-gray-300"}`}>
        {s || "UNKNOWN"}
      </span>
    );
  };

  // ✅ Import Excel
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showSuccess("📤 Importing...");
      await parkingLotApi.importExcel(file);
      showSuccess("✅ Import Excel successfully!");
      fetchData();
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
      showSuccess("📥 Exporting Excel...");
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
    <>
      {/* 🔹 Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, city, ward, or status..."
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

          {/* Status filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {[
              "PENDING",
              "UNDER_SURVEY",
              "PREPARING",
              "PARTNER_CONFIGURATION",
              "ACTIVE_PENDING",
              "ACTIVE",
              "INACTIVE",
              "UNDER_MAINTENANCE",
              "MAP_DENIED",
              "REJECTED",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* ✅ Import / Export */}
        <div className="flex gap-2">
          {/* Import */}
          <label className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import Excel
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          {/* Export */}
          <button
            className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer"
            onClick={handleExport}
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Ward</th>
              <th className="px-6 py-3 text-left">City</th>
              <th className="px-6 py-3 text-left">Floors</th>
              <th className="px-6 py-3 text-left">Open - Close</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500 italic">
                  Loading...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((lot, idx) => (
                <tr
                  key={lot.id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{lot.name}</td>
                  <td className="px-6 py-3">{lot.streetAddress}</td>
                  <td className="px-6 py-3">{lot.ward}</td>
                  <td className="px-6 py-3">{lot.city}</td>
                  <td className="px-6 py-3">{lot.totalFloors}</td>
                  <td className="px-6 py-3">
                    {lot.is24Hour
                      ? "24-hour Open"
                      : `${lot.operatingHoursStart || "-"} - ${
                          lot.operatingHoursEnd || "-"
                        }`}
                  </td>
                  <td className="px-6 py-3">{renderStatus(lot.status)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        title="View Details"
                        onClick={() => handleView(lot.id)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Request"
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
                  colSpan="9"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  No parking lots found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ← Previous
        </button>
        <span className="text-gray-600 text-sm">
          Page <strong>{page + 1}</strong> of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Next →
        </button>
      </div>

      {/* Confirm Delete Modal */}
      {confirmingLot && (
        <ConfirmModal
          open={!!confirmingLot}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmingLot?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingLot(null)}
        />
      )}

      {/* View Lot Modal */}
      <Modal isOpen={!!viewingLot} onClose={() => setViewingLot(null)}>
        {viewingLot && (
          <ViewParkingLotModal
            lot={viewingLot}
            onClose={() => setViewingLot(null)}
            onActionDone={fetchData}
          />
        )}
      </Modal>
    </>
  );
}
