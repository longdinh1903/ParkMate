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
  const [allFeeConfigs, setAllFeeConfigs] = useState([]);
  // reference the variable to avoid unused-variable lint errors in some setups
  void allFeeConfigs;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Default to newest-first so newly created items appear at top
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFeeConfig, setEditingFeeConfig] = useState(null);
  const [confirmingFeeConfig, setConfirmingFeeConfig] = useState(null);
  const [viewingFeeConfig, setViewingFeeConfig] = useState(null);

  // ✅ Fetch danh sách fee configs
  // ✅ Check if config is currently active
  const isActive = useCallback((config) => {
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
  }, []);

  // ✅ Fetch danh sách fee configs
  const fetchFeeConfigs = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch full list with a large size so we can reorder Active items globally
      const res = await operationalFeeApi.getAll({
        page: 0,
        size: 10000,
        sortBy: sortBy,
        sortOrder: sortOrder,
        filterParams: {},
      });
      const data = res.data?.data;
      const raw = Array.isArray(data?.content) ? data.content : [];
      const activeItems = raw.filter((f) => isActive(f));
      const otherItems = raw.filter((f) => !isActive(f));
      const ordered = [...activeItems, ...otherItems];
      setAllFeeConfigs(ordered);

      // client-side paginate the ordered list
      const start = page * size;
      const pageSlice = ordered.slice(start, start + size);
      setFeeConfigs(pageSlice);

      const total = ordered.length;
      setTotalPages(Math.max(1, Math.ceil(total / size)));
      setTotalCount(total);
    } catch (err) {
      console.error("❌ Error fetching fee configs:", err);
      showError("Failed to fetch fee configurations");
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder, isActive]);

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
        {active ? "Hoạt Động" : "Không Hoạt Động"}
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
        <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          <i className="ri-money-dollar-circle-fill"></i>
          Cấu Hình Phí Hoạt Động
        </h2>
      </div>

      {/* 🔹 Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo mô tả, giá, hoặc kỳ..."
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
              <option value="pricePerSqm">Giá/m²</option>
              <option value="billingPeriodMonths">Kỳ Thanh Toán</option>
              <option value="validFrom">Hiệu Lực Từ</option>
              <option value="validUntil">Hiệu Lực Đến</option>
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
            title={sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
          >
            {sortOrder === "asc" ? (
              <i className="ri-sort-asc text-lg text-gray-600"></i>
            ) : (
              <i className="ri-sort-desc text-lg text-gray-600"></i>
            )}
            <span className="text-sm text-gray-600">
              {sortOrder === "asc" ? "Tăng" : "Giảm"}
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
            title="Làm mới bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm Mới</span>
          </button>
        </div>

        {/* ✅ Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Thêm Cấu Hình Phí
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Giá/m² (VND)</th>
              <th className="px-6 py-3 text-left">Kỳ Thanh Toán</th>
              <th className="px-6 py-3 text-left">Mô Tả</th>
              <th className="px-6 py-3 text-left">Hiệu Lực Từ</th>
              <th className="px-6 py-3 text-left">Hiệu Lực Đến</th>
              <th className="px-6 py-3 text-left">Trạng Thái</th>
              <th className="px-6 py-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  Đang tải...
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
                  <td className="px-6 py-3">{f.billingPeriodMonths} tháng</td>
                  <td className="px-6 py-3 max-w-xs" title={f.description}>
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      className="text-sm text-gray-800 break-words"
                    >
                      {f.description}
                    </div>
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
                        title="Xem Chi Tiết"
                        onClick={(e) => handleView(f, e)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Chỉnh Sửa"
                        onClick={(e) => handleEdit(f, e)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa"
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
                  Không tìm thấy cấu hình phí nào.
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
          ← Trước
        </button>

        <div className="text-center text-gray-600 text-sm">
          <div>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tổng cấu hình:{" "}
            <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* ✅ Modals */}
      {showAddModal && (
        <AddFeeConfigModal
          onClose={() => setShowAddModal(false)}
          onAdded={(created) => {
            // close modal and show the newly created item after active items
            setShowAddModal(false);
            setPage(0);
            if (created) {
              setAllFeeConfigs((prev) => {
                const activeCount = prev.filter((f) => isActive(f)).length;
                const next = [...prev];
                next.splice(activeCount, 0, created);
                // update visible page (page 0)
                setFeeConfigs(next.slice(0, size));
                return next;
              });
              setTotalCount((c) => (typeof c === "number" ? c + 1 : c));
            } else {
              // fallback to refetch if API didn't return the created object
              fetchFeeConfigs();
            }
          }}
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
          title="Xác Nhận Xóa"
          message={`Bạn có chắc chắn muốn xóa cấu hình phí này?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingFeeConfig(null)}
        />
      )}

      {/* View Modal */}
      {viewingFeeConfig && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-orange-50">
              <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2"><i className="ri-money-dollar-circle-line text-orange-500"></i> Thông Tin Chi Tiết</h2>
              <button
                onClick={() => setViewingFeeConfig(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto p-6 text-gray-700 text-sm space-y-6 custom-scrollbar divide-y-0">
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <p className="text-gray-500 text-xs border-0">Giá/m²:</p>
                  <p className="font-medium text-orange-600 border-0">{viewingFeeConfig.pricePerSqm?.toLocaleString("vi-VN")} VND</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs border-0">Kỳ Thanh Toán:</p>
                  <p className="font-medium border-0">{viewingFeeConfig.billingPeriodMonths} tháng</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs border-0">Mô Tả:</p>
                  <p className="font-medium text-gray-800 whitespace-pre-wrap break-words max-h-48 overflow-auto mt-1 border-0">{viewingFeeConfig.description}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs border-0">Hiệu Lực Từ:</p>
                  <p className="font-medium border-0">{formatDate(viewingFeeConfig.validFrom)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs border-0">Hiệu Lực Đến:</p>
                  <p className="font-medium border-0">{formatDate(viewingFeeConfig.validUntil)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Trạng Thái:</p>
                  <div className="mt-1">{renderStatus(viewingFeeConfig)}</div>
                </div>
                <div>
                  <p className="text-gray-500 text-xs border-0">Ngày Tạo:</p>
                  <p className="font-medium border-0">{formatDate(viewingFeeConfig.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs border-0">Ngày Cập Nhật:</p>
                  <p className="font-medium border-0">{formatDate(viewingFeeConfig.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => setViewingFeeConfig(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
