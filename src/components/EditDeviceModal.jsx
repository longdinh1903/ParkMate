import { useState, useEffect } from "react";
import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import deviceApi from "../api/deviceApi";
import partnerApi from "../api/partnerApi";
import { showSuccess, showError } from "../utils/toastUtils";

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

export default function EditDeviceModal({ open, device, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    model: "",
    serialNumber: "",
    deviceStatus: "PENDING",
    notes: "",
  });
  const [partnerName, setPartnerName] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && device) {
      setFormData({
        deviceId: device.deviceId || "",
        deviceName: device.deviceName || "",
        deviceStatus: device.status || device.deviceStatus || "PENDING",
        model: device.model || "",
        serialNumber: device.serialNumber || "",
        notes: device.notes || "",
      });
      // fetch partner name if needed
      if (device?.partnerId || device?.partner?.id) {
        const pid = device.partnerId || device.partner?.id;
        (async () => {
          try {
            const res = await partnerApi.getByIdPartner(pid);
            const p = res.data?.data || res.data || null;
            if (p) setPartnerName(p.companyName || p.name || null);
          } catch (err) {
            void err;
          }
        })();
      }
    }
  }, [open, device]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const newDeviceId = String(formData.deviceId).trim();
      const payload = {
        deviceName: formData.deviceName?.trim() || undefined,
        deviceStatus: formData.deviceStatus || undefined,
        model: formData.model?.trim() || undefined,
        serialNumber: formData.serialNumber?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      // Only include deviceId if it was actually changed by the user
      if (newDeviceId && newDeviceId !== (device?.deviceId || "")) {
        payload.deviceId = newDeviceId;
      }

      await deviceApi.update(device.id, payload);
      showSuccess("Device updated successfully!");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating device:", err);
      showError(err.response?.data?.message || "Failed to update device");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Chỉnh Sửa 
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Device ID (read-only in edit mode - usually shouldn't change) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Thiết Bị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
              <p className="text-xs text-gray-500 mt-1">Thay đổi deviceId yêu cầu xác thực tính duy nhất</p>
            </div>

            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên Thiết Bị
              </label>
              <input
                type="text"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleChange}
                maxLength={255}
                placeholder="Tên thân thiện cho thiết bị"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại Thiết Bị</label>
              <input
                type="text"
                value={deviceTypeLabels[device?.deviceType] || device?.deviceType || "-"}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đối Tác</label>
              <input
                type="text"
                value={partnerName || device?.partner?.companyName || device?.companyName || device?.partnerName || (device?.partnerId ? `#${device.partnerId}` : "-")}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bãi Đỗ Xe</label>
              <input
                type="text"
                value={device?.parkingLot?.name || device?.lotName || "-"}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
              />
            </div>

            {/* Device Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng Thái Thiết Bị</label>
              <select
                name="deviceStatus"
                value={formData.deviceStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="PENDING">CHỞ XỬ LÝ</option>
                <option value="ACTIVE">HOẠT ĐỘNG</option>
                <option value="OFFLINE">NGOẠI TUYẾN</option>
                <option value="MAINTENANCE">BẢO TRÌ</option>
                <option value="FAULTY">LỖI</option>
                <option value="DEACTIVATED">VÔ HIỆU HÓA</option>
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                maxLength={100}
                placeholder="Model/thương hiệu thiết bị"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Seri</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                maxLength={100}
                placeholder="Số seri"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi Chú</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ghi chú lắp đặt, sự cố, v.v."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            >
              <i className="ri-save-line"></i>
              <span>Lưu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
