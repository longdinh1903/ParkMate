import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import partnerApi from "../api/partnerApi";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import AddPartnerModal from "../components/AddPartnerModal";
import EditPartnerModal from "../components/EditPartnerModal";
import ConfirmModal from "../components/ConfirmModal";
import ViewPartnerDetailModal from "../components/ViewPartnerDetailModal";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [confirmingPartner, setConfirmingPartner] = useState(null);
  const [viewingPartnerId, setViewingPartnerId] = useState(null);

  const fileInputRef = useRef(null);

  // ✅ Fetch danh sách đối tác
  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await partnerApi.getAll({
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      const data = res.data?.data;
      setPartners(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching partners:", err);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // whenever partners list updates, refresh count to keep in sync
  useEffect(() => {
    fetchPartnerCount();
  }, [partners]);

  // ✅ Fetch total count of partners (no filters for now)
  const fetchPartnerCount = async (filters = {}) => {
    try {
      const res = await partnerApi.count(filters);
      // backend may return number in res.data or res.data.data
      const count = Number(res.data?.data ?? res.data ?? 0) || 0;
      setTotalCount(count);
    } catch (err) {
      console.error("❌ Error fetching partner count:", err);
    }
  };

  useEffect(() => {
    // fetch count on mount
    fetchPartnerCount();
  }, []);

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    const s = status?.toUpperCase();
    const colorMap = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-300",
      ACTIVE: "bg-green-50 text-green-700 border-green-300",
      INACTIVE: "bg-gray-50 text-gray-600 border-gray-300",
      REJECTED: "bg-red-50 text-red-700 border-red-300",
      APPROVED: "bg-green-50 text-green-700 border-green-300",
    };

    const statusMap = {
      PENDING: "Chờ duyệt",
      ACTIVE: "Hoạt động",
      INACTIVE: "Ngưng hoạt động",
      REJECTED: "Bị từ chối",
      APPROVED: "Đã duyệt",
    };

    const displayText = statusMap[s] || "Không rõ";

    return (
      <span
        className={`${base} ${
          colorMap[s] || "bg-gray-50 text-gray-600 border-gray-300"
        }`}
      >
        {displayText}
      </span>
    );
  };

  // ✅ Lọc dữ liệu hiển thị
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

  // ✅ EXPORT Excel
  const handleExport = async () => {
    try {
      showInfo("⏳ Đang xuất dữ liệu...");
      const res = await partnerApi.exportPartners();

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Partners_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showSuccess("✅ Xuất dữ liệu thành công!");
    } catch (err) {
      console.error("❌ Export error:", err);
      showError(err.response?.data?.message || "Xuất dữ liệu thất bại!");
    }
  };

  // ✅ IMPORT Excel
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
    else showError("⚠️ File input chưa sẵn sàng!");
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showInfo("⏳ Đang tải file lên...");
      const formData = new FormData();
      formData.append("file", file);

      const res = await partnerApi.importPartners(formData);

      if (res.status === 200) {
        const total = res.data?.totalRows || 0;
        const success = res.data?.successCount || 0;
        const failed = res.data?.failedCount || 0;
        showSuccess(
          `✅ Nhập dữ liệu thành công: ${success}/${total} dòng (thất bại: ${failed})`
        );
        fetchPartners();
      } else showError("❌ Nhập dữ liệu thất bại!");
    } catch (err) {
      console.error("❌ Import error:", err);
      showError(err.response?.data?.message || "Không thể nhập file!");
    } finally {
      e.target.value = "";
    }
  };

  // ✅ CRUD actions
  const handleEdit = (partner, e) => {
    e.stopPropagation();
    setEditingPartner(partner);
  };

  const handleDelete = (partner, e) => {
    e.stopPropagation();
    setConfirmingPartner(partner);
  };

  const handleView = (partner, e) => {
    e.stopPropagation();
    setViewingPartnerId(partner.id);
  };

  const confirmDelete = async () => {
    const partner = confirmingPartner;
    if (!partner) return;

    const partnerId = partner.partnerId || partner.id;
    try {
      const res = await partnerApi.delete(partnerId);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`Xóa "${partner.companyName}" thành công!`);
        fetchPartners();
      } else showError("❌ Không thể xóa đối tác (mã lỗi không hợp lệ).");
    } catch (err) {
      console.error("❌ Delete partner error:", err);
      showError(
        err.response?.data?.message ||
          "❌ Không thể xóa đối tác. Vui lòng kiểm tra logs."
      );
    } finally {
      setConfirmingPartner(null);
    }
  };

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          <i className="ri-building-fill"></i>
          Quản lý đối tác
        </h2>
      </div>

      {/* 🔹 Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại hoặc địa chỉ..."
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
              <option value="createdAt">Ngày tạo</option>
              <option value="companyName">Tên công ty</option>
              <option value="companyEmail">Email</option>
              <option value="companyPhone">Số điện thoại</option>
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

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setStartDate("");
              setEndDate("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(0);
              fetchPartners();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm mới</span>
          </button>
        </div>

        {/* ✅ Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Thêm đối tác
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition transform hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Nhập Excel
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition transform hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Xuất Excel
          </button>

          <input
            type="file"
            accept=".xlsx,.xls"
            ref={fileInputRef}
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Tên Công Ty</th>
              <th className="px-6 py-3 text-left">Mã Số Thuế</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Số Điện Thoại</th>
              <th className="px-6 py-3 text-left">Địa Chỉ</th>
              <th className="px-6 py-3 text-center">Số Bãi Đỗ</th>
              <th className="px-6 py-3 text-left">Trạng Thái</th>
              <th className="px-6 py-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((p, idx) => (
                <tr
                  key={p.id || idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3">{p.companyName}</td>
                  <td className="px-6 py-3">{p.taxNumber}</td>
                  <td className="px-6 py-3">{p.companyEmail}</td>
                  <td className="px-6 py-3">{p.companyPhone}</td>
                  <td className="px-6 py-3">{p.companyAddress}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm">
                      {p.numbersOfParkingLots ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-3">{renderStatus(p.status)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="Xem chi tiết"
                        onClick={(e) => handleView(p, e)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Chỉnh sửa"
                        onClick={(e) => handleEdit(p, e)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa"
                        onClick={(e) => handleDelete(p, e)}
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
                  Không tìm thấy đối tác nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination (with total count centered) */}
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
            Tổng đối tác:{" "}
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
          title="Xác Nhận Xóa"
          message={`Bạn có chắc chắn muốn xóa "${confirmingPartner?.companyName}"?`}
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
