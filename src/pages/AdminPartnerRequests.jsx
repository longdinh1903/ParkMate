import { useState, useEffect, useCallback } from "react";
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
  const [size] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewingPartner, setViewingPartner] = useState(null);
  const [confirmingPartner, setConfirmingPartner] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Partner Requests
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };

      // Không gửi search qua API, filter client-side
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await partnerApi.getRequests(params);

      const data = res.data?.data;
      setRequests(Array.isArray(data?.content) ? data.content : data || []);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalElements || (Array.isArray(data?.content) ? data.content.length : 0));
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder, status, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Client-side filtering for search (giống PartnerHome)
  const filtered = requests.filter((r) => {
    const keyword = (search || "").toLowerCase();
    
    const matchSearch =
      !keyword ||
      [
        r.contactPersonName,
        r.contactPersonEmail,
        r.companyEmail,
        r.companyName,
        r.companyPhone,
      ].some((field) => String(field || "").toLowerCase().includes(keyword));

    return matchSearch;
  });

  // ✅ View details
  const handleView = async (id) => {
    try {
      const res = await partnerApi.getById(id);
      setViewingPartner(res.data?.data || null);
    } catch (err) {
      console.error("❌ Error fetching details:", err);
      showError("Không thể tải chi tiết!");
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
        showSuccess(`🗑️ Đã xóa "${item.companyName}" thành công!`);
        fetchData();
      } else showError("❌ Xóa thất bại.");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
      showError(err.response?.data?.message || "❌ Xóa thất bại.");
    } finally {
      setConfirmingPartner(null);
    }
  };

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return (
          <span className={`${base} text-green-600 bg-green-50 border-green-300`}>
            Đã Duyệt
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Bị Từ Chối
          </span>
        );
      case "PENDING":
        return (
          <span className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}>
            Chờ Duyệt
          </span>
        );
      default:
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Không xác định
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
              placeholder="Tìm kiếm theo tên, email, số điện thoại, công ty..."
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
              <option value="createdAt">Ngày Tạo</option>
              <option value="companyName">Tên Công Ty</option>
              <option value="contactPersonName">Người Liên Hệ</option>
              <option value="companyPhone">Số Điện Thoại</option>
              <option value="status">Trạng Thái</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
              {sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
            </span>
          </button>

          {/* Status Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất Cả Trạng Thái</option>
            <option value="PENDING">Chờ Duyệt</option>
            <option value="APPROVED">Đã Duyệt</option>
            <option value="REJECTED">Bị Từ Chối</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setStartDate("");
              setEndDate("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(0);
              fetchData();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm Mới</span>
          </button>
        </div>

        {/* Import / Export */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Nhập Excel
          </button>
          <button className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Đối Tác</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Công Ty</th>
              <th className="px-6 py-3 text-left">Số Điện Thoại</th>
              <th className="px-6 py-3 text-left">Ngày Nộp</th>
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
                        title="Xem Chi Tiết"
                        onClick={() => handleView(r.id)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa Yêu Cầu"
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
                  Không tìm thấy yêu cầu nào.
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
          ← Trước
        </button>
        <div className="text-center text-gray-600 text-sm">
          <div>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tổng yêu cầu:{" "}
            <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* ✅ Confirm Delete Modal */}
      {confirmingPartner && (
        <ConfirmModal
          open={!!confirmingPartner}
          title="Xác Nhận Xóa"
          message={`Bạn có chắc chắn muốn xóa "${confirmingPartner?.companyName}"?`}
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
