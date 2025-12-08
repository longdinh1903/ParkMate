import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";

export default function ViewDeviceFeeModal({ open, onClose, fee }) {
  if (!open || !fee) return null;

  const deviceTypeLabels = {
    ULTRASONIC_SENSOR: "Cảm biến siêu âm (Phát hiện chỗ đỗ)",
    NFC_READER: "Đầu đọc thẻ NFC (Ra/Vào)",
    BLE_SCANNER: "Máy quét BLE (Phát hiện gần)",
    CAMERA: "Camera (Nhận diện biển số)",
    BARRIER_CONTROLLER: "Bộ điều khiển rào chắn",
    DISPLAY_BOARD: "Bảng hiển thị",
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Không giới hạn";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const isActive = () => {
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

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Thông Tin Chi Tiết
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Device Type */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Loại Thiết Bị</h3>
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="font-bold text-base text-gray-600">Loại:</span>
              <span className="text-lg font-semibold text-orange-600">
                {deviceTypeLabels[fee.deviceType] || fee.deviceType}
              </span>
            </div>
          </div>

          {/* Fee Amount */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Phí Vận Hành</h3>
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="font-bold text-base text-gray-600">Số tiền:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(fee.deviceFee)}
              </span>
            </div>
          </div>

          {/* Validity Period */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-orange-600 mb-3 border-b-2 border-orange-100 pb-1">Thời Gian Hiệu Lực</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">Hiệu Lực Từ</span>
                <div className="text-gray-800 w-2/3 break-words text-right">{formatDate(fee.validFrom)}</div>
              </div>
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">Hiệu Lực Đến</span>
                <div className="text-gray-800 w-2/3 break-words text-right">{formatDate(fee.validUntil)}</div>
              </div>
            </div>
          </section>

          {/* Status */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Trạng Thái</h3>
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="font-bold text-base text-gray-600">Trạng thái:</span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${
                  isActive()
                    ? "bg-green-100 text-green-700 ring-green-600/20"
                    : "bg-gray-100 text-gray-700 ring-gray-600/20"
                }`}
              >
                {isActive() ? "Đang hoạt động" : "Không hoạt động"}
              </span>
            </div>
          </div>

          {/* Description */}
          {fee.description && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-orange-600 mb-3 border-b-2 border-orange-100 pb-1">Mô Tả</h3>
              <div className="p-3 bg-gray-50 border rounded-md whitespace-pre-wrap text-gray-800">
                {fee.description}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section>
            <h3 className="text-lg font-semibold text-orange-600 mb-3 border-b-2 border-orange-100 pb-1">Thông Tin Hệ Thống</h3>
            <div className="space-y-1">
              {fee.createdAt && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">Ngày tạo</span>
                  <div className="text-gray-800 w-2/3 break-words text-right">{formatDate(fee.createdAt)}</div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
