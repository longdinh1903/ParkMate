import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import operationalFeeApi from "../api/operationalFeeApi";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import AddFeeConfigModal from "../components/AddFeeConfigModal";
import EditFeeConfigModal from "../components/EditFeeConfigModal";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminFeeConfig() {
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeeConfig, setEditingFeeConfig] = useState(null);
  const [confirmingFeeConfig, setConfirmingFeeConfig] = useState(null);
  const [viewingFeeConfig, setViewingFeeConfig] = useState(null);

  // ✅ Fetch danh sách fee configs
  const fetchFeeConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await operationalFeeApi.getAll({
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
        filterParams: {},
      });
      const data = res.data?.data;
      setFeeConfigs(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalElements || 0);
    } catch (err) {
      console.error("❌ Error fetching fee configs:", err);
      showError("Failed to fetch fee configurations");
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder]);

  useEffect(() => {
    fetchFeeConfigs();
  }, [fetchFeeConfigs]);

  // ✅ Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ Check if config is currently active
  const isActive = (config) => {
    // If isActive field exists in the API response, use it directly
    if (typeof config.isActive === "boolean") {
      return config.isActive;
    }

    // Otherwise, calculate based on dates
    const now = new Date();
    const validFrom = new Date(config.validFrom);
    const validUntil = config.validUntil ? new Date(config.validUntil) : null;

    if (!validUntil) {
      // If no validUntil, only check if validFrom has passed
      return now >= validFrom;
    }

    return now >= validFrom && now <= validUntil;
  };

  // ✅ Render status badge
  const renderStatus = (config) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    const active = isActive(config);

    return (
      <span
        className={`${base} ${
          active
            ? "bg-green-50 text-green-700 border-green-300"
            : "bg-gray-50 text-gray-600 border-gray-300"
        }`}
      >
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  // ✅ Lọc dữ liệu hiển thị
  const filtered = feeConfigs.filter((f) => {
    const keyword = search.toLowerCase();
    return (
      f.description?.toLowerCase().includes(keyword) ||
      f.pricePerSqm?.toString().includes(keyword) ||
      f.billingPeriodMonths?.toString().includes(keyword)
    );
  });

  // ✅ CRUD actions
  const handleEdit = (feeConfig, e) => {
    e.stopPropagation();
    setEditingFeeConfig(feeConfig);
  };

  const handleDelete = (feeConfig, e) => {
    e.stopPropagation();
    setConfirmingFeeConfig(feeConfig);
  };

  const handleView = (feeConfig, e) => {
    e.stopPropagation();
    setViewingFeeConfig(feeConfig);
  };

  const confirmDelete = async () => {
    const feeConfig = confirmingFeeConfig;
    if (!feeConfig) return;

    try {
      const res = await operationalFeeApi.delete(feeConfig.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess("Fee configuration deleted successfully!");
        fetchFeeConfigs();
      } else {
        showError("❌ Failed to delete fee configuration.");
      }
    } catch (err) {
      console.error("❌ Delete fee config error:", err);
      showError(
        err.response?.data?.message || "❌ Failed to delete fee configuration."
      );
    } finally {
      setConfirmingFeeConfig(null);
    }
  };

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-700">
          Operational Fee Configuration
        </h2>
      </div>

      {/* 🔹 Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by description, price, or period..."
              className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-80 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
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

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all appearance-none bg-white pr-10 cursor-pointer"
            >
              <option value="pricePerSqm">Price per sqm</option>
              <option value="billingPeriodMonths">Billing Period</option>
              <option value="validFrom">Valid From</option>
              <option value="validUntil">Valid Until</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            {sortOrder === "asc" ? (
              <i className="ri-sort-asc text-lg text-gray-600"></i>
            ) : (
              <i className="ri-sort-desc text-lg text-gray-600"></i>
            )}
            <span className="text-sm text-gray-600">
              {sortOrder === "asc" ? "Asc" : "Desc"}
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setSortBy("id");
              setSortOrder("asc");
              setPage(0);
              fetchFeeConfigs();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Reset filters"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Refresh</span>
          </button>
        </div>

        {/* ✅ Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add Fee Config
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Price/sqm (VND)</th>
              <th className="px-6 py-3 text-left">Billing Period</th>
              <th className="px-6 py-3 text-left">Description</th>
              <th className="px-6 py-3 text-left">Valid From</th>
              <th className="px-6 py-3 text-left">Valid Until</th>
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
              filtered.map((f, idx) => (
                <tr
                  key={f.id || idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3 font-semibold text-orange-600">
                    {f.pricePerSqm?.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-6 py-3">{f.billingPeriodMonths} months</td>
                  <td
                    className="px-6 py-3 max-w-xs truncate"
                    title={f.description}
                  >
                    {f.description}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {formatDate(f.validFrom)}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {formatDate(f.validUntil)}
                  </td>
                  <td className="px-6 py-3">{renderStatus(f)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="View Details"
                        onClick={(e) => handleView(f, e)}
                        className="p-2 rounded-full hover:bg-orange-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Edit Fee Config"
                        onClick={(e) => handleEdit(f, e)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Fee Config"
                        onClick={(e) => handleDelete(f, e)}
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
                  No fee configurations found.
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
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ← Previous
        </button>

        <div className="text-center text-gray-600 text-sm">
          <div>
            Page <strong>{page + 1}</strong> of {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Total configurations:{" "}
            <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Next →
        </button>
      </div>

      {/* ✅ Modals */}
      {showAddModal && (
        <AddFeeConfigModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchFeeConfigs}
        />
      )}
      {editingFeeConfig && (
        <EditFeeConfigModal
          feeConfig={editingFeeConfig}
          onClose={() => setEditingFeeConfig(null)}
          onUpdated={fetchFeeConfigs}
        />
      )}
      {confirmingFeeConfig && (
        <ConfirmModal
          open={!!confirmingFeeConfig}
          title="Confirm Deletion"
          message={`Are you sure you want to delete this fee configuration?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingFeeConfig(null)}
        />
      )}

      {/* View Modal */}
      {viewingFeeConfig && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
          <div className="bg-white w-[600px] rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-orange-700 mb-4">
              Fee Configuration Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">
                  Price per sqm:
                </span>
                <span className="text-orange-600 font-semibold">
                  {viewingFeeConfig.pricePerSqm?.toLocaleString("vi-VN")} VND
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">
                  Billing Period:
                </span>
                <span className="text-gray-800">
                  {viewingFeeConfig.billingPeriodMonths} months
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Description:</span>
                <span className="text-gray-800 text-right max-w-md">
                  {viewingFeeConfig.description}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Valid From:</span>
                <span className="text-gray-800">
                  {formatDate(viewingFeeConfig.validFrom)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Valid Until:</span>
                <span className="text-gray-800">
                  {formatDate(viewingFeeConfig.validUntil)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Status:</span>
                <span>{renderStatus(viewingFeeConfig)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Created At:</span>
                <span className="text-gray-800">
                  {formatDate(viewingFeeConfig.createdAt)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-600">Updated At:</span>
                <span className="text-gray-800">
                  {formatDate(viewingFeeConfig.updatedAt)}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingFeeConfig(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
