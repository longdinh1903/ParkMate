import { useState, useEffect } from "react";
import partnerApi from "../api/partnerApi";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import ViewPartnerModal from "../components/ViewPartnerModal";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function AdminPartnerRequests() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [viewingPartner, setViewingPartner] = useState(null);
  const [confirmingPartner, setConfirmingPartner] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch Partner Requests
  const fetchData = async () => {
    try {
      const res = await partnerApi.getRequests({
        page,
        size,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const data = res.data?.data;
      setRequests(Array.isArray(data?.content) ? data.content : data || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  // ✅ View details
  const handleView = async (id) => {
    try {
      const res = await partnerApi.getById(id);
      setViewingPartner(res.data?.data || null);
    } catch (err) {
      console.error("❌ Error fetching details:", err);
      showError("Failed to fetch details");
    }
  };

  // ✅ Delete confirmation
  const handleDelete = (item) => setConfirmingPartner(item);

  const confirmDelete = async () => {
    const item = confirmingPartner;
    if (!item) return;
    try {
      const res = await partnerApi.deleteRegister(item.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`🗑️ Deleted "${item.companyName}" successfully!`);
        fetchData();
      } else showError("❌ Failed to delete item.");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
      showError(err.response?.data?.message || "❌ Failed to delete item.");
    } finally {
      setConfirmingPartner(null);
    }
  };

  // ✅ Filter logic
  const filtered = requests.filter((r) => {
    const keyword = search.toLowerCase();

    const matchSearch =
      r.contactPersonName?.toLowerCase().includes(keyword) ||
      r.contactPersonEmail?.toLowerCase().includes(keyword) ||
      r.companyEmail?.toLowerCase().includes(keyword) ||
      r.companyName?.toLowerCase().includes(keyword) ||
      r.companyPhone?.toLowerCase().includes(keyword);

    const matchStatus = status
      ? r.status?.toLowerCase() === status.toLowerCase()
      : true;

    const createdAt = new Date(r.createdAt || r.submittedAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const matchDate = (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchSearch && matchStatus && matchDate;
  });

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return (
          <span className={`${base} text-green-600 bg-green-50 border-green-300`}>
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}>
            Pending
          </span>
        );
      default:
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Unknown
          </span>
        );
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
              placeholder="Search by name, email, phone, or company..."
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

          {/* Status Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Import / Export */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import
          </button>
          <button className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
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
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Partner</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Company</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Submitted At</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {filtered.length > 0 ? (
              filtered.map((r, idx) => (
                <tr
                  key={r.id || idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3">{r.contactPersonName}</td>
                  <td className="px-6 py-3">
                    {r.contactPersonEmail || r.companyEmail}
                  </td>
                  <td className="px-6 py-3">{r.companyName}</td>
                  <td className="px-6 py-3">{r.companyPhone}</td>
                  <td className="px-6 py-3">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-6 py-3">{renderStatus(r.status)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="View Details"
                        onClick={() => handleView(r.id)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Request"
                        onClick={() => handleDelete(r)}
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
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
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

      {/* ✅ Confirm Delete Modal */}
      {confirmingPartner && (
        <ConfirmModal
          open={!!confirmingPartner}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmingPartner?.companyName}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingPartner(null)}
        />
      )}

      {/* 🔹 View Partner Modal */}
      <Modal isOpen={!!viewingPartner} onClose={() => setViewingPartner(null)}>
        {viewingPartner && (
          <ViewPartnerModal
            partner={viewingPartner}
            onClose={() => setViewingPartner(null)}
            onActionDone={fetchData}
          />
        )}
      </Modal>
    </>
  );
}
