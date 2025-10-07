import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import partnerApi from "../api/partnerApi";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import AddPartnerModal from "../components/AddPartnerModal";
import EditPartnerModal from "../components/EditPartnerModal";
import ConfirmModal from "../components/ConfirmModal";
import ViewPartnerDetailModal from "../components/ViewPartnerDetailModal"; // ✅ dùng component mới

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [confirmingPartner, setConfirmingPartner] = useState(null);
  const [viewingPartnerId, setViewingPartnerId] = useState(null); // ✅ ID đối tác đang xem chi tiết

  // ✅ Fetch danh sách đối tác
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await partnerApi.getAll({
        page,
        size,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      const data = res.data?.data;
      setPartners(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching partners:", err);
      showError("Failed to load partner list!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [page]);

  // ✅ Lọc theo từ khóa + ngày
  const filtered = partners.filter((p) => {
    const keyword = search.toLowerCase();
    const matchesKeyword = [
      p.companyName,
      p.companyEmail,
      p.companyPhone,
      p.taxNumber,
      p.companyAddress,
    ].some((field) => field?.toLowerCase().includes(keyword));

    const createdAt = new Date(p.createdAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const matchesDate =
      (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchesKeyword && matchesDate;
  });

  // ✅ Edit / Delete / View
  const handleEdit = (partner, e) => {
    e.stopPropagation();
    setEditingPartner(partner);
  };

  const handleDelete = (partner, e) => {
    e.stopPropagation();
    setConfirmingPartner(partner);
  };

  // ✅ Click dòng → mở modal chi tiết (truyền partnerId)
  const handleView = (partner) => {
    setViewingPartnerId(partner.id);
  };

  // ✅ Thực thi xoá
  const confirmDelete = async () => {
    const partner = confirmingPartner;
    if (!partner) return;

    const partnerId = partner.partnerId || partner.id;
    try {
      const res = await partnerApi.delete(partnerId);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`Deleted "${partner.companyName}" successfully!`);
        fetchPartners();
      } else {
        showError("❌ Failed to delete partner (invalid status code).");
      }
    } catch (err) {
      console.error("❌ Delete partner error:", err);
      const msg =
        err.response?.data?.message ||
        "❌ Failed to delete partner. Please check logs.";
      showError(msg);
    } finally {
      setConfirmingPartner(null);
    }
  };

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">
          Partner Management
        </h2>
      </div>

      {/* 🔹 Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, phone, or address..."
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

          {/* Date Range */}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add Partner
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
              <th className="px-6 py-3 text-left">Company Name</th>
              <th className="px-6 py-3 text-left">Tax Number</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  Loading...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((p, idx) => (
                <tr
                  key={p.id || idx}
                  onClick={() => handleView(p)} // ✅ click dòng để mở modal chi tiết
                  className="border-t border-gray-100 hover:bg-indigo-50 transition-all cursor-pointer"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{p.companyName}</td>
                  <td className="px-6 py-3">{p.taxNumber}</td>
                  <td className="px-6 py-3">{p.companyEmail}</td>
                  <td className="px-6 py-3">{p.companyPhone}</td>
                  <td className="px-6 py-3">{p.companyAddress}</td>
                  <td className="px-6 py-3 font-semibold text-indigo-600">
                    {p.status}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="Edit Partner"
                        onClick={(e) => handleEdit(p, e)}
                        className="p-2 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Partner"
                        onClick={(e) => handleDelete(p, e)}
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
                <td
                  colSpan="8"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  No partners found.
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
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Previous
        </button>

        <span className="text-gray-600 text-sm">
          Page <strong>{page + 1}</strong> of {totalPages}
        </span>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>

      {/* ✅ Modals */}
      {showAddModal && (
        <AddPartnerModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchPartners}
        />
      )}

      {editingPartner && (
        <EditPartnerModal
          partner={editingPartner}
          onClose={() => setEditingPartner(null)}
          onUpdated={fetchPartners}
        />
      )}

      {confirmingPartner && (
        <ConfirmModal
          open={!!confirmingPartner}
          title="Confirm Deletion"
          message={`Are you sure you want to delete "${confirmingPartner?.companyName}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingPartner(null)}
        />
      )}

      {viewingPartnerId && (
        <ViewPartnerDetailModal
          partnerId={viewingPartnerId}
          onClose={() => setViewingPartnerId(null)}
        />
      )}
    </AdminLayout>
  );
}
