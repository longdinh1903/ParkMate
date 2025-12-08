import { useState, useEffect } from "react";
import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import deviceApi from "../api/deviceApi";
import parkingLotApi from "../api/parkingLotApi";
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

export default function AddDeviceModal({ open, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    model: "",
    deviceType: "",
    serialNumber: "",
    notes: "",
    lotId: "",
    partnerId: "",
  });

  const [parkingLots, setParkingLots] = useState([]);
  const [partners, setPartners] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPartners();
      fetchDeviceTypes();
      // Load active parking lots by default so the Lot select is populated
      fetchParkingLots();
    }
  }, [open]);

  const fetchParkingLots = async (partnerId) => {
    try {
      const params = { page: 0, size: 1000 };
      // ensure partnerId sent as number when provided
      const partnerNum = partnerId ? Number(partnerId) : undefined;
      if (partnerNum) params.partnerId = partnerNum;
      // clear current list while loading
      setParkingLots([]);
      const res = await parkingLotApi.getAll(params);
      const data = res.data?.data;
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      // If backend doesn't filter correctly by partnerId, apply client-side filter
      const partnerFiltered = partnerNum
        ? list.filter(
            (l) =>
              String(l.partnerId || l.ownerId || l.partner?.id || "") === String(partnerNum)
          )
        : list;
      const active = list
        .filter((l) => String(l.status).toUpperCase() === "ACTIVE")
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      // If we filtered by partner, filter active from partnerFiltered instead
      const finalList = partnerNum
        ? partnerFiltered.filter((l) => String(l.status).toUpperCase() === "ACTIVE").sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        : active;
      setParkingLots(finalList);
    } catch (err) {
      console.error("Error fetching parking lots:", err);
      setParkingLots([]);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await partnerApi.getAll({ page: 0, size: 1000 });
      const data = res.data?.data;
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      const sorted = list.sort((a, b) => ((a.companyName || a.name || "").localeCompare(b.companyName || b.name || "")));
      setPartners(sorted);
    } catch (err) {
      console.error("Error fetching partners:", err);
      setPartners([]);
    }
  };

  const fetchDeviceTypes = async () => {
    try {
      const res = await deviceApi.getTypes();
      const types = res.data?.data || [];
      setDeviceTypes(types);
    } catch (err) {
      console.error("Error fetching device types:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (name === "partnerId") {
      // set partnerId and clear selected lot
      setFormData((prev) => ({ ...prev, partnerId: val, lotId: "" }));
      // fetch parking lots for selected partner
      fetchParkingLots(val || undefined);
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lotId) {
      showError("Vui lòng chọn bãi đỗ xe");
      return;
    }

    if (!formData.deviceId || !formData.deviceType) {
      showError("ID Thiết bị và Loại thiết bị là bắt buộc");
      return;
    }

    if (!formData.partnerId) {
      showError("Vui lòng chọn đối tác");
      return;
    }

    setLoading(true);
    try {
      // Build device object as per Swagger spec
      const deviceData = {
        deviceId: String(formData.deviceId).trim(),
        deviceName: formData.deviceName?.trim() || "",
        deviceType: formData.deviceType,
        partnerId: Number(formData.partnerId),
        model: formData.model?.trim() || "",
        serialNumber: formData.serialNumber?.trim() || "",
        notes: formData.notes?.trim() || "",
      };

      // Backend expects an array of devices
      const payload = [deviceData];

      // Call API with lotId as string
      const lotIdParam = String(formData.lotId);
      await deviceApi.create(lotIdParam, payload);
      showSuccess("Đăng ký thiết bị thành công!");
      onCreated();
      handleClose();
    } catch (err) {
      console.error("Error creating device:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      showError(serverMsg || "Đăng ký thiết bị thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      deviceId: "",
      deviceName: "",
      model: "",
      deviceType: "",
      serialNumber: "",
      notes: "",
      lotId: "",
      partnerId: "",
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Thêm Thiết Bị Mới
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đối Tác
              </label>
              <select
                name="partnerId"
                value={formData.partnerId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Chọn đối tác</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName || p.name || `Partner ${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Parking Lot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bãi Đỗ Xe <span className="text-red-500">*</span>
              </label>
              <select
                name="lotId"
                value={formData.lotId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Chọn bãi đỗ xe</option>
                {parkingLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} - {lot.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Device ID */}
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
                placeholder="ví dụ: CAM-ENTRY-01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
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

            {/* Device Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại Thiết Bị <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Chọn loại</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {deviceTypeLabels[type] || type}
                  </option>
                ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số Seri
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi Chú
              </label>
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
              onClick={handleClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
            >
              <i className="ri-add-line"></i>
              {loading ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
