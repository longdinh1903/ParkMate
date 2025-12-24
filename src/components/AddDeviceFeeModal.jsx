import { useState } from "react";
import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import deviceFeeApi from "../api/deviceFeeApi";
import { showSuccess, showError } from "../utils/toastUtils";

export default function AddDeviceFeeModal({ open, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    deviceType: "",
    deviceFee: "",
    validFrom: "",
    validUntil: "",
    description: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    { value: "ULTRASONIC_SENSOR", label: "Cảm biến siêu âm (Phát hiện chỗ đỗ)" },
    { value: "NFC_READER", label: "Đầu đọc thẻ NFC (Ra/Vào)" },
    { value: "BLE_SCANNER", label: "Máy quét BLE (Phát hiện gần)" },
    { value: "CAMERA", label: "Camera (Nhận diện biển số)" },
    { value: "BARRIER_CONTROLLER", label: "Bộ điều khiển rào chắn" },
    { value: "DISPLAY_BOARD", label: "Bảng hiển thị" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.deviceType) {
      showError("Vui lòng chọn loại thiết bị");
      return;
    }

    if (!formData.deviceFee || parseFloat(formData.deviceFee) <= 0) {
      showError("Phí vận hành phải lớn hơn 0");
      return;
    }

    if (!formData.validFrom) {
      showError("Vui lòng chọn ngày hiệu lực");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        deviceType: formData.deviceType,
        deviceFee: parseFloat(formData.deviceFee),
        validFrom: formData.validFrom ? `${formData.validFrom}T00:00:00` : null,
        validUntil: formData.validUntil ? `${formData.validUntil}T23:59:59` : null,
        description: formData.description?.trim() || "",
        isActive: formData.isActive,
      };

      await deviceFeeApi.create(payload);
      showSuccess("Tạo cấu hình phí thiết bị thành công!");
      onCreated();
      handleClose();
    } catch (err) {
      console.error("Error creating device fee:", err);
      const serverMsg =
        err?.response?.data?.message || err?.response?.data || err.message;
      showError(serverMsg || "Tạo cấu hình phí thiết bị thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      deviceType: "",
      deviceFee: "",
      validFrom: "",
      validUntil: "",
      description: "",
      isActive: true,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Thêm cấu hình phí thiết bị
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại thiết bị <span className="text-red-500">*</span>
            </label>
            <select
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
            >
              <option value="">-- Chọn loại thiết bị --</option>
              {deviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Device Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phí vận hành (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="deviceFee"
              value={formData.deviceFee}
              onChange={handleChange}
              required
              min="0"
              step="1"
              placeholder="Nhập phí vận hành"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
            />
          </div>

          {/* Valid From & Valid Until */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hiệu lực từ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hiệu lực đến
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleChange}
                min={formData.validFrom || new Date().toISOString().slice(0, 10)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu không giới hạn
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              maxLength="500"
              placeholder="Nhập mô tả chi tiết về cấu hình phí này..."
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tối đa 500 ký tự
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kích hoạt ngay sau khi tạo
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50 gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="add-device-fee-form"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Đang tạo..." : "Tạo cấu hình"}
          </button>
        </div>
      </div>
    </div>
  );
}
