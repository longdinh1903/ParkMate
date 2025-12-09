import { useState, useEffect } from "react";
import deviceApi from "../api/deviceApi";
import deviceFeeApi from "../api/deviceFeeApi";
import Modal from "./Modal";
import toast from "react-hot-toast";

export default function AssignDevicesToLotModal({ open, onClose, lot, onAssigned }) {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceFees, setDeviceFees] = useState([]);
  const [newDevices, setNewDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDeviceTypes();
      fetchDeviceFees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchDeviceTypes = async () => {
    try {
      setLoading(true);
      const res = await deviceApi.getTypes();
      const types = res.data?.data || res.data || [];
      setDeviceTypes(types);
    } catch (err) {
      console.error("Error fetching device types:", err);
      toast.error("Không thể tải danh sách loại thiết bị!");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceFees = async () => {
    try {
      const res = await deviceFeeApi.getAll({ page: 0, size: 1000 });
      const feeList = res.data?.data?.content || res.data?.content || [];
      setDeviceFees(feeList);
    } catch (err) {
      console.error("Error fetching device fees:", err);
    }
  };

  const addDevice = () => {
    setNewDevices([
      ...newDevices,
      {
        id: Date.now(),
        deviceId: "",
        deviceName: "",
        deviceType: "",
        model: "",
        serialNumber: "",
        notes: "",
      },
    ]);
  };

  const removeDevice = (id) => {
    setNewDevices(newDevices.filter((d) => d.id !== id));
  };

  const updateDevice = (id, field, value) => {
    setNewDevices(
      newDevices.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const getDeviceFee = (deviceType) => {
    if (!deviceType) return 0;
    // Try different status field names that backend might use
    const fee = deviceFees.find((f) => {
      const isTypeMatch = f.deviceType === deviceType;
      const isActive = f.status === "ACTIVE" || f.isActive === true || f.active === true;
      return isTypeMatch && isActive;
    });
    
    // If no active fee found, try without status check
    const anyFee = deviceFees.find((f) => f.deviceType === deviceType);
    
    console.log("Looking for fee:", deviceType, "Found:", fee || anyFee);
    console.log("Available fees:", deviceFees);
    return (fee || anyFee) ? (fee || anyFee).deviceFee : 0;
  };

  const calculateTotalFee = () => {
    let total = 0;
    newDevices.forEach((device) => {
      if (device.deviceType) {
        const fee = getDeviceFee(device.deviceType);
        total += fee;
      }
    });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newDevices.length === 0) {
      toast.error("Vui lòng thêm ít nhất một thiết bị!");
      return;
    }

    // Validate all devices
    for (const device of newDevices) {
      if (!device.deviceId || !device.deviceType) {
        toast.error("Vui lòng điền đầy đủ ID Thiết Bị và Loại Thiết Bị!");
        return;
      }
    }

    try {
      setSubmitting(true);

      // Get partnerId from lot data
      const partnerId = lot.partnerId || lot.partner?.id;
      if (!partnerId) {
        toast.error("Không tìm thấy thông tin đối tác của bãi xe!");
        return;
      }

      // Create devices array as per API spec
      const devicesToCreate = newDevices.map((d) => ({
        deviceId: String(d.deviceId).trim(),
        deviceName: d.deviceName?.trim() || "",
        deviceType: d.deviceType,
        partnerId: Number(partnerId),
        model: d.model?.trim() || "",
        serialNumber: d.serialNumber?.trim() || "",
        notes: d.notes?.trim() || "",
      }));

      await deviceApi.create(String(lot.id), devicesToCreate);
      
      toast.success("✅ Tạo thiết bị thành công!");
      onAssigned();
      onClose();
      setNewDevices([]);
    } catch (err) {
      console.error("Error creating devices:", err);
      toast.error(err.response?.data?.message || "Tạo thiết bị thất bại!");
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <i className="ri-device-line text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Gán Thiết Bị cho Bãi Đỗ Xe
                </h2>
                <p className="text-sm text-gray-600">{lot.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-xl text-gray-600"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
            {loading ? (
              <div className="text-center py-12">
                <i className="ri-loader-4-line text-4xl text-orange-500 animate-spin"></i>
                <p className="text-gray-600 mt-4">Đang tải danh sách loại thiết bị...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Add Device Button */}
                <button
                  type="button"
                  onClick={addDevice}
                  className="w-full py-3 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
                >
                  <i className="ri-add-circle-line text-xl"></i>
                  Thêm Thiết Bị Mới
                </button>

                {/* Device Forms */}
                {newDevices.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                    <i className="ri-device-line text-5xl text-gray-400 mb-3"></i>
                    <p className="text-gray-500 font-medium">
                      Chưa có thiết bị nào
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Nhấp "Thêm Thiết Bị Mới" để bắt đầu
                    </p>
                  </div>
                ) : (
                  newDevices.map((device, index) => {
                    const fee = getDeviceFee(device.deviceType);
                    console.log(`Device ${index + 1} - Type: ${device.deviceType}, Fee: ${fee}`);
                    
                    return (
                      <div
                        key={device.id}
                        className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-900">
                            Thiết Bị #{index + 1}
                          </h3>
                          <button
                            type="button"
                            onClick={() => removeDevice(device.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <i className="ri-delete-bin-line text-lg"></i>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Device ID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ID Thiết Bị <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={device.deviceId}
                              onChange={(e) =>
                                updateDevice(device.id, "deviceId", e.target.value)
                              }
                              placeholder="VD: CAM-001"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                              required
                            />
                          </div>

                          {/* Device Type */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Loại Thiết Bị <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={device.deviceType}
                              onChange={(e) =>
                                updateDevice(device.id, "deviceType", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                              required
                            >
                              <option value="">Chọn loại</option>
                              {deviceTypes.map((type) => (
                                <option key={type} value={type}>
                                  {deviceTypeLabels[type] || type}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Device Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tên Thiết Bị
                            </label>
                            <input
                              type="text"
                              value={device.deviceName}
                              onChange={(e) =>
                                updateDevice(device.id, "deviceName", e.target.value)
                              }
                              placeholder="VD: Camera cổng chính"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>

                          {/* Model */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              value={device.model}
                              onChange={(e) =>
                                updateDevice(device.id, "model", e.target.value)
                              }
                              placeholder="VD: HIK-DS-2CD2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>

                          {/* Serial Number */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Số Serial
                            </label>
                            <input
                              type="text"
                              value={device.serialNumber}
                              onChange={(e) =>
                                updateDevice(device.id, "serialNumber", e.target.value)
                              }
                              placeholder="VD: SN123456789"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ghi Chú
                            </label>
                            <input
                              type="text"
                              value={device.notes}
                              onChange={(e) =>
                                updateDevice(device.id, "notes", e.target.value)
                              }
                              placeholder="VD: Lắp đặt ngày 01/01/2024"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                            />
                          </div>
                        </div>

                        {/* Device Fee Display */}
                        {device.deviceType && (
                          <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">Phí thiết bị:</span>
                              <span className="font-bold text-orange-600">
                                {fee > 0 ? `${fee.toLocaleString()} ₫` : "Chưa cấu hình phí"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer with Total Fee */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="ri-calculator-line text-xl text-gray-600"></i>
                <span className="text-lg font-bold text-gray-900">
                  Tổng Chi Phí Thiết Bị:
                </span>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {calculateTotalFee().toLocaleString()} ₫
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting || newDevices.length === 0}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line mr-2"></i>
                    Tạo Thiết Bị
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
