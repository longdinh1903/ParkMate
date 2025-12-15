import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import deviceFeeApi from "../api/deviceFeeApi";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import AddDeviceFeeModal from "../components/AddDeviceFeeModal";
import EditDeviceFeeModal from "../components/EditDeviceFeeModal";
import ViewDeviceFeeModal from "../components/ViewDeviceFeeModal";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminDeviceFees() {
  const [deviceFees, setDeviceFees] = useState([]);
  const [search, setSearch] = useState("");
  const [deviceTypeFilter, setDeviceTypeFilter] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [viewingFee, setViewingFee] = useState(null);
  const [confirmingFee, setConfirmingFee] = useState(null);

  // Device types available
  const deviceTypes = [
    "ULTRASONIC_SENSOR",
    "NFC_READER",
    "BLE_SCANNER",
    "CAMERA",
    "BARRIER_CONTROLLER",
    "DISPLAY_BOARD",
  ];

  // Fetch device fee configurations
  const fetchDeviceFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size,
      };

      if (deviceTypeFilter) {
        params.deviceType = deviceTypeFilter;
      }

      const res = await deviceFeeApi.getAll(params);
      const data = res.data?.data;
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      
      setDeviceFees(list);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalElements || list.length);
    } catch (err) {
      console.error("❌ Error fetching device fees:", err);
      showError("Không thể tải danh sách cấu hình phí thiết bị");
    } finally {
      setLoading(false);
    }
  }, [page, size, deviceTypeFilter]);

  useEffect(() => {
    fetchDeviceFees();
  }, [fetchDeviceFees]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "Không giới hạn";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Check if fee is active
  const isActive = (fee) => {
    if (typeof fee.isActive === "boolean") {
      return fee.isActive;
    }
    const now = new Date();
    const validFrom = new Date(fee.validFrom);
    const validUntil = fee.validUntil ? new Date(fee.validUntil) : null;
    
    if (!validUntil) {
      return now >= validFrom;
    }
    return now >= validFrom && now <= validUntil;
  };

  // Render status badge
  const renderStatus = (fee) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    const active = isActive(fee);

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

  // Get device type label in Vietnamese
  const getDeviceTypeLabel = (type) => {
    const labels = {
      ULTRASONIC_SENSOR: "Cảm biến siêu âm (Phát hiện chỗ đỗ)",
      NFC_READER: "Đầu đọc thẻ NFC (Ra/Vào)",
      BLE_SCANNER: "Máy quét BLE (Phát hiện gần)",
      CAMERA: "Camera (Nhận diện biển số)",
      BARRIER_CONTROLLER: "Bộ điều khiển rào chắn",
      DISPLAY_BOARD: "Bảng hiển thị",
    };
    return labels[type] || type;
  };

  // Filter data
  const filtered = deviceFees.filter((fee) => {
    const keyword = search.toLowerCase();
    return (
      fee.deviceType?.toLowerCase().includes(keyword) ||
      fee.description?.toLowerCase().includes(keyword) ||
      fee.deviceFee?.toString().includes(keyword)
    );
  });

  // CRUD actions
  const handleEdit = (fee, e) => {
    e.stopPropagation();
    setEditingFee(fee);
  };

  const handleDelete = (fee, e) => {
    e.stopPropagation();
    setConfirmingFee(fee);
  };

  const handleView = (fee, e) => {
    e.stopPropagation();
    setViewingFee(fee);
  };

  const confirmDelete = async () => {
    const fee = confirmingFee;
    if (!fee) return;

    try {
      await deviceFeeApi.delete(fee.id);
      showSuccess("Xóa cấu hình phí thiết bị thành công!");
      fetchDeviceFees();
    } catch (err) {
      console.error("❌ Delete error:", err);
      showError(
        err.response?.data?.message || "Xóa cấu hình phí thiết bị thất bại"
      );
    } finally {
      setConfirmingFee(null);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          <i className="ri-copper-coin-fill"></i>
          Quản Lý Phí Thiết Bị
        </h2>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo loại thiết bị, mô tả..."
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

          {/* Device Type Filter */}
          <select
            value={deviceTypeFilter}
            onChange={(e) => {
              setDeviceTypeFilter(e.target.value);
              setPage(0);
            }}
            className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all bg-white cursor-pointer"
          >
            <option value="">Tất cả loại thiết bị</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {getDeviceTypeLabel(type)}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setDeviceTypeFilter("");
              setPage(0);
              fetchDeviceFees();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm Mới</span>
          </button>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <PlusIcon className="w-5 h-5 text-white" />
          Thêm Cấu Hình Phí
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left w-16">#</th>
              <th className="px-6 py-3 text-left">Loại Thiết Bị</th>
              <th className="px-6 py-3 text-left">Phí Vận Hành</th>
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
              filtered.map((fee, idx) => (
                <tr
                  key={fee.id || idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <CpuChipIcon className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-900">
                        {getDeviceTypeLabel(fee.deviceType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-orange-600">
                    {formatCurrency(fee.deviceFee)}
                  </td>
                  <td className="px-6 py-3 max-w-xs">
                    <div
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      className="text-sm text-gray-800 break-words"
                      title={fee.description}
                    >
                      {fee.description || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {formatDate(fee.validFrom)}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {formatDate(fee.validUntil)}
                  </td>
                  <td className="px-6 py-3">{renderStatus(fee)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="Xem Chi Tiết"
                        onClick={(e) => handleView(fee, e)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Chỉnh Sửa"
                        onClick={(e) => handleEdit(fee, e)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa"
                        onClick={(e) => handleDelete(fee, e)}
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
                  Không tìm thấy cấu hình phí thiết bị nào.
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
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDeviceFeeModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchDeviceFees();
          }}
        />
      )}

      {editingFee && (
        <EditDeviceFeeModal
          open={!!editingFee}
          onClose={() => setEditingFee(null)}
          onUpdated={() => {
            setEditingFee(null);
            fetchDeviceFees();
          }}
          fee={editingFee}
        />
      )}

      {viewingFee && (
        <ViewDeviceFeeModal
          open={!!viewingFee}
          onClose={() => setViewingFee(null)}
          fee={viewingFee}
        />
      )}

      {confirmingFee && (
        <ConfirmModal
          open={!!confirmingFee}
          onClose={() => setConfirmingFee(null)}
          onConfirm={confirmDelete}
          title="Xác Nhận Xóa"
          message={`Bạn có chắc chắn muốn xóa cấu hình phí cho thiết bị "${getDeviceTypeLabel(
            confirmingFee.deviceType
          )}"?`}
        />
      )}
    </AdminLayout>
  );
}
