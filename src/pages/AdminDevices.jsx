import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import deviceApi from "../api/deviceApi";
import parkingLotApi from "../api/parkingLotApi";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import AddDeviceModal from "../components/AddDeviceModal";
import EditDeviceModal from "../components/EditDeviceModal";
import ViewDeviceModal from "../components/ViewDeviceModal";
import ConfirmModal from "../components/ConfirmModal";

// Device Type Labels mapping
const deviceTypeLabels = {
  ULTRASONIC_SENSOR: "Cảm biến siêu âm (Phát hiện chỗ đỗ)",
  "Ultrasonic Sensor": "Cảm biến siêu âm (Phát hiện chỗ đỗ)",
  NFC_READER: "Đầu đọc thẻ NFC (Ra/Vào)",
  "NFC Reader": "Đầu đọc thẻ NFC (Ra/Vào)",
  BLE_SCANNER: "Máy quét BLE (Phát hiện gần)",
  "BLE Scanner": "Máy quét BLE (Phát hiện gần)",
  CAMERA: "Camera (Nhận diện biển số)",
  Camera: "Camera (Nhận diện biển số)",
  BARRIER_CONTROLLER: "Bộ điều khiển cổng chặn",
  "Barrier Controller": "Bộ điều khiển cổng chặn",
  DISPLAY_BOARD: "Bảng hiển thị điện tử",
  "Display Board": "Bảng hiển thị điện tử",
  // Legacy types
  BARRIER: "Cổng chặn",
  Barrier: "Cổng chặn",
  SENSOR: "Cảm biến",
  Sensor: "Cảm biến",
  INFRARED_SENSOR: "Cảm biến hồng ngoại",
  "Infrared Sensor": "Cảm biến hồng ngoại",
  PAYMENT_TERMINAL: "Máy thanh toán",
  "Payment Terminal": "Máy thanh toán",
  DISPLAY: "Màn hình hiển thị",
  Display: "Màn hình hiển thị",
  LED_DISPLAY: "Màn hình LED",
  "LED Display": "Màn hình LED",
  OTHER: "Khác",
  Other: "Khác",
};

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [viewingDevice, setViewingDevice] = useState(null);
  const [deletingDevice, setDeletingDevice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [lotFilter, setLotFilter] = useState("");

  // ✅ Fetch all devices
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deviceApi.getAll({
        page,
        size,
      });
      const responseData = res.data?.data;
      const list = Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData)
        ? responseData
        : [];

      setDevices(list);
      setTotalPages(responseData?.totalPages || 1);
      setTotalCount(responseData?.totalElements || list.length);
    } catch (err) {
      console.error("❌ Error fetching devices:", err);
      showError("Không thể tải danh sách thiết bị.");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ✅ Fetch device types
  const fetchDeviceTypes = async () => {
    try {
      const res = await deviceApi.getTypes();
      const types = res.data?.data || [];
      setDeviceTypes(types);
    } catch (err) {
      console.error("Error fetching device types:", err);
    }
  };

  useEffect(() => {
    fetchDeviceTypes();
  }, []);

  // ✅ Fetch parking lots for the lot filter
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await parkingLotApi.getAll({ page: 0, size: 1000 });
          const data = res.data?.data;
          const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          // Only include ACTIVE parking lots in the filter, sorted by name
          const activeLots = list
            .filter((l) => String(l.status).toUpperCase() === "ACTIVE")
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          setParkingLots(activeLots);
      } catch (err) {
        console.error("Error fetching parking lots:", err);
        setParkingLots([]);
      }
    };

    fetchLots();
  }, []);

  // ✅ Client-side filter and sort
  const filteredDevices = devices
    .filter((device) => {
      const keyword = search.toLowerCase();
      const matchesKeyword =
        device.deviceId?.toLowerCase().includes(keyword) ||
        device.deviceName?.toLowerCase().includes(keyword) ||
        device.model?.toLowerCase().includes(keyword) ||
        device.manufacturer?.toLowerCase().includes(keyword) ||
        device.serialNumber?.toLowerCase().includes(keyword) ||
        device.locationDescription?.toLowerCase().includes(keyword);

      const matchesType = deviceType ? device.deviceType === deviceType : true;
      const matchesStatus = deviceStatus
        ? (device.status === deviceStatus || device.deviceStatus === deviceStatus)
        : true;

      // Match selected parking lot (support multiple device fields)
      const matchesLot = lotFilter
        ? (device.parkingLot && String(device.parkingLot.id) === String(lotFilter)) ||
          String(device.lotId || device.parkingLotId || "") === String(lotFilter)
        : true;

      return matchesKeyword && matchesType && matchesStatus && matchesLot;
    })
    .sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "deviceId":
          aVal = a.deviceId || "";
          bVal = b.deviceId || "";
          break;
        case "deviceName":
          aVal = a.deviceName || "";
          bVal = b.deviceName || "";
          break;
        case "deviceType":
          aVal = a.deviceType || "";
          bVal = b.deviceType || "";
          break;
        case "createdAt":
        default:
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
          break;
      }

      if (sortBy === "createdAt") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      } else {
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });

  // ✅ View device details
  const handleViewClick = async (device) => {
    try {
      const res = await deviceApi.getById(device.id);
      const detail = res.data?.data;
      if (!detail) throw new Error("Empty data");
      setViewingDevice(detail);
    } catch (err) {
      console.error("❌ Error fetching device detail:", err);
      showError("Không thể tải chi tiết thiết bị!");
    }
  };

  // ✅ Delete device
  const handleDeleteClick = (device) => {
    setDeletingDevice(device);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDevice) return;

    setDeleteLoading(true);
    try {
      await deviceApi.delete(deletingDevice.id);
      showSuccess("Xóa thiết bị thành công!");
      setDeletingDevice(null);
      fetchDevices();
    } catch (err) {
      console.error("❌ Delete failed:", err);
      showError(err.response?.data?.message || "Xóa thiết bị thất bại!");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Status UI
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status) {
      case "PENDING":
        return (
          <span
            className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}
          >
            Chờ Xử Lý
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
      case "OFFLINE":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Ngoại Tuyến
          </span>
        );
      case "MAINTENANCE":
        return (
          <span
            className={`${base} bg-orange-50 text-orange-700 border-orange-300`}
          >
            Bảo Trì
          </span>
        );
      case "FAULTY":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Lỗi
          </span>
        );
      case "DEACTIVATED":
        return (
          <span
            className={`${base} bg-gray-50 text-gray-500 border-gray-300`}
          >
            Vô Hiệu Hóa
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

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          <CpuChipIcon className="w-8 h-8" />
          Quản lý thiết bị
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo ID, tên, model, nhà sản xuất..."
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
              <option value="deviceId">ID Thiết bị</option>
              <option value="deviceName">Tên thiết bị</option>
              <option value="deviceType">Loại thiết bị</option>
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

          {/* Device Type Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            {deviceTypes.map((type) => (
              <option key={type} value={type}>
                {deviceTypeLabels[type] || type}
              </option>
            ))}
          </select>

          {/* Parking Lot Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={lotFilter}
            onChange={(e) => setLotFilter(e.target.value)}
          >
            <option value="">Tất cả bãi đỗ</option>
            {parkingLots.map((lot) => (
              <option key={lot.id} value={String(lot.id)}>
                {lot.name}
              </option>
            ))}
          </select>

          {/* Device Status Filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={deviceStatus}
            onChange={(e) => setDeviceStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="OFFLINE">Ngoại tuyến</option>
            <option value="MAINTENANCE">Bảo trì</option>
            <option value="FAULTY">Lỗi</option>
            <option value="DEACTIVATED">Vô hiệu hóa</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setDeviceType("");
              setDeviceStatus("");
              setLotFilter("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(0);
              fetchDevices();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm mới</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition transform hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Thêm thiết bị
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">ID thiết bị</th>
              <th className="px-6 py-3 text-left">Tên thiết bị</th>
              <th className="px-6 py-3 text-left">Loại</th>
              <th className="px-6 py-3 text-left">Model</th>
              <th className="px-6 py-3 text-left">Số seri</th>
              <th className="px-6 py-3 text-left">Bãi đỗ xe</th>
              <th className="px-6 py-3 text-left">Trạng thái</th>
              <th className="px-6 py-3 text-left">Ngày tạo</th>
              <th className="px-6 py-3 text-center">Thao tác</th>
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
            ) : filteredDevices.length > 0 ? (
              filteredDevices.map((device, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{device.deviceId}</td>
                  <td className="px-6 py-3">{device.deviceName || "-"}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                      {deviceTypeLabels[device.deviceType] || device.deviceType}
                    </span>
                  </td>
                  <td className="px-6 py-3">{device.model || "-"}</td>
                  <td className="px-6 py-3">{device.serialNumber || "-"}</td>
                  <td className="px-6 py-3">
                    <div className="text-sm">
                      <div className="font-medium text-gray-800">{device.lotName || device.parkingLot?.name || "-"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-3">{renderStatus(device.status || device.deviceStatus)}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{device.createdAt ? new Date(device.createdAt).toLocaleString() : "-"}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="View Details"
                        onClick={() => handleViewClick(device)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Edit Device"
                        onClick={() => setEditingDevice(device)}
                        className="p-2 rounded-full hover:bg-yellow-100 transition cursor-pointer"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Device"
                        onClick={() => handleDeleteClick(device)}
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
                  Không tìm thấy thiết bị.
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
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 cursor-pointer"
        >
          ← Trước
        </button>

        <div className="text-center text-gray-600 text-sm">
          <div>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tổng thiết bị:{" "}
            <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>

        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* Modals */}
      <AddDeviceModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={fetchDevices}
      />

      <EditDeviceModal
        open={!!editingDevice}
        device={editingDevice}
        onClose={() => setEditingDevice(null)}
        onUpdated={fetchDevices}
      />

      {viewingDevice && (
        <ViewDeviceModal
          device={viewingDevice}
          onClose={() => setViewingDevice(null)}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!deletingDevice}
        title="Xác nhận xóa thiết bị"
        message={`Bạn có chắc chắn muốn xóa thiết bị "${
          deletingDevice?.deviceName || deletingDevice?.deviceId || "thiết bị này"
        }"? Hành động này không thể hoàn tác.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDevice(null)}
        loading={deleteLoading}
        confirmLabel="Xóa"
      />
    </AdminLayout>
  );
}
