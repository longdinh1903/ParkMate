import { useState, useEffect, useCallback } from "react";
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
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [confirmingLot, setConfirmingLot] = useState(null);
  const [editingLot, setEditingLot] = useState(null);
  const [viewingLot, setViewingLot] = useState(null); // ✅ thêm state để xem chi tiết
  const [showAddModal, setShowAddModal] = useState(false);

  // ✅ Fetch parking lots
  const fetchLots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await parkingLotApi.getAll({
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
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
  }, [page, size, sortBy, sortOrder]);

  useEffect(() => {
    fetchLots();
  }, [fetchLots]);

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
            Chờ Duyệt
          </span>
        );
      case "PREPARING":
        return (
          <span
            className={`${base} bg-orange-50 text-orange-700 border-orange-300`}
          >
            Đang Chuẩn Bị
          </span>
        );
      case "PARTNER_CONFIGURATION":
        return (
          <span
            className={`${base} bg-orange-50 text-orange-700 border-orange-300`}
          >
            Cấu Hình Đối Tác
          </span>
        );
      case "ACTIVE":
        return (
          <span
            className={`${base} bg-green-50 text-green-700 border-green-300`}
          >
            Hoạt Động
          </span>
        );
      case "INACTIVE":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Ngừng Hoạt Động
          </span>
        );
      case "MAP_DENIED":
        return (
          <span
            className={`${base} bg-red-50 text-red-700 border-red-300`}
          >
            Từ Chối Bản Đồ
          </span>
        );
      case "REJECTED":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Bị Từ Chối
          </span>
        );
        case "PENDING_PAYMENT":
        return (
          <span className={`${base} bg-purple-50 text-purple-700 border-purple-300`}>
            Chờ Thanh Toán
          </span>
        );
      default:
        return (
          <span className={`${base} text-gray-500 bg-gray-50 border-gray-300`}>
            Không Xác Định
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
        showError("❌ Không xóa được bãi đậu xe (mã trạng thái không hợp lệ).");
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
        <h2 className="text-2xl font-bold text-orange-700">
          Quản Lý Bãi Đỗ Xe
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
              placeholder="Tìm kiếm theo tên, thành phố, địa chỉ, số tầng hoặc 24h..."
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
              <option value="name">Tên</option>
              <option value="city">Thành Phố</option>
              <option value="totalFloors">Số Tầng</option>
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
              {sortOrder === "asc" ? "Tăng" : "Giảm"}
            </span>
          </button>

          {/* ⚙️ Status Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất Cả Trạng Thái</option>
            <option value="PENDING">Chờ Duyệt</option>
            <option value="PREPARING">Đang Chuẩn Bị</option>
            <option value="PARTNER_CONFIGURATION">Cấu Hình Đối Tác</option>
            <option value="ACTIVE">Hoạt Động</option>
            <option value="INACTIVE">Ngừng Hoạt Động</option>
            <option value="MAP_DENIED">Từ Chối Bản Đồ</option>
            <option value="REJECTED">Bị Từ Chối</option>
            <option value="PENDING_PAYMENT">Chờ Thanh Toán</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(0);
              fetchLots();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm Mới</span>
          </button>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Thêm Bãi Đỗ Xe
          </button>

          {/* ✅ Import */}
          <label className="flex items-center hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Nhập 
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
            Xuất 
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Tên</th>
              <th className="px-6 py-3 text-left">Thành Phố</th>
              <th className="px-6 py-3 text-left">Địa Chỉ</th>
              <th className="px-6 py-3 text-left">Số Tầng</th>
              <th className="px-6 py-3 text-left">24 Giờ</th>
              <th className="px-6 py-3 text-left">Trạng Thái</th>
              <th className="px-6 py-3 text-center">Thao Tác</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-8 text-gray-500 italic"
                >
                  Đang tải dữ liệu...
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
                      <span className="text-green-600 font-medium">Có</span>
                    ) : (
                      <span className="text-gray-500">Không</span>
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
                  Không tìm thấy bãi đỗ xe.
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
          ← Trước
        </button>

        <div className="text-center text-gray-600 text-sm">
          <div>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tổng bãi đỗ: <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>

        <button
          disabled={page >= totalPages - 1 || loading}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* ✅ Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmingLot}
        title="Vô Hiệu Hóa Bãi Đỗ Xe"
        message={`Điều này sẽ đặt bãi đỗ xe "${confirmingLot?.name}" thành NGỪNG HOẠT ĐỘNG (xóa mềm). Tiếp tục?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingLot(null)}
        loading={deleting}
        confirmLabel="Vô Hiệu Hóa"
      />

      {/* ✅ Popup Edit */}
      <EditParkingLotModal
        open={!!editingLot}
        lot={editingLot}
        onClose={() => setEditingLot(null)}
        onUpdated={async () => {
          showSuccess("✅ Cập nhật bãi đỗ xe thành công!");
          await fetchLots();
          setEditingLot(null);
        }}
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
        onCreated={async () => {
          showSuccess("✅ Thêm bãi đỗ xe mới thành công!");
          await fetchLots();
          setShowAddModal(false);
        }}
      />
    </AdminLayout>
  );
}
