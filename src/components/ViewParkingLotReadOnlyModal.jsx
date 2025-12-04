import React from "react";

export default function ViewParkingLotReadOnlyModal({ lot, onClose }) {
  if (!lot) return null;

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt Động";
      case "REJECTED":
        return "Bị Từ Chối";
      case "PREPARING":
        return "Đang Chuẩn Bị";
      case "PARTNER_CONFIGURATION":
        return "Cấu Hình Đối Tác";
      case "PENDING":
        return "Chờ Duyệt";
      case "PENDING_PAYMENT":
        return "Chờ Thanh Toán";
      case "MAP_DENIED":
        return "Từ Chối Bản Đồ";
      case "INACTIVE":
        return "Không Hoạt Động";
      default:
        return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border border-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-700 border border-red-300";
      case "PREPARING":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "PARTNER_CONFIGURATION":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "PENDING":
        return "bg-orange-100 text-orange-700 border border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1200px] max-h-[85vh] border border-gray-200 flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b flex-shrink-0">
          <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
            🅿️ {lot.name}
          </h2>
          <span
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${getStatusStyle(
              lot.status
            )}`}
          >
            {getStatusLabel(lot.status)}
          </span>
        </div>

        {/* Content - Scrollable */}
        <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-[15px] text-gray-700 mb-6">
          <p>
            <strong>🏢 Address:</strong> {lot.streetAddress || "-"}
            {lot.ward ? `, ${lot.ward}` : ""}
            {lot.city ? `, ${lot.city}` : ""}
          </p>
          <p>
            <strong>🕒 Mở:</strong> {lot.openTime ?? "-"}
          </p>
          <p>
            <strong>🕕 Đóng:</strong> {lot.closeTime ?? "-"}
          </p>
          <p>
            <strong>🌙 24 Giờ:</strong> {lot.is24Hour ? "Có" : "Không"}
          </p>
          <p>
            <strong>🏗 Tầng:</strong> {lot.totalFloors ?? "-"}
          </p>
          <p>
            <strong>📐 Diện Tích Bãi Đỗ:</strong> {lot.lotSquare ? `${lot.lotSquare} m²` : "-"}
          </p>
          <p>
            <strong>⏱️ Thời Gian Chờ:</strong> {lot.horizonTime ? `${lot.horizonTime} phút` : "-"}
          </p>
          <p>
            <strong>�📍 Vĩ Độ:</strong> {lot.latitude ?? "-"}
          </p>
          <p>
            <strong>📍 Kinh Độ:</strong> {lot.longitude ?? "-"}
          </p>
          <p>
            <strong>📅 Ngày Tạo:</strong>{" "}
            {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : "-"}
          </p>
          <p>
            <strong>⚙ Cập Nhật:</strong>{" "}
            {lot.updatedAt ? new Date(lot.updatedAt).toLocaleString() : "-"}
          </p>
        </div>

        {/* Reason (if provided by partner) */}
        {lot.reason && (
          <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
            <h3 className="font-semibold text-red-600 mb-2">📝 Lý Do</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {lot.reason}
            </p>
          </div>
        )}

        {/* Partner / Owner Info */}
        {(lot.partner || lot.owner || lot.companyName) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-3">🏢 Đối Tác / Chủ Sở Hữu</h3>
            <div className="text-sm text-gray-700">
              <p>
                <strong>Tên:</strong> {lot.partner?.companyName ?? lot.owner?.name ?? lot.companyName ?? "-"}
              </p>
              {lot.partner?.companyEmail && (
                <p>
                  <strong>Email:</strong> {lot.partner.companyEmail}
                </p>
              )}
              {lot.partner?.companyPhone && (
                <p>
                  <strong>Điện Thoại:</strong> {lot.partner.companyPhone}
                </p>
              )}
              {lot.partner?.taxNumber && (
                <p>
                  <strong>Mã Số Thuế:</strong> {lot.partner.taxNumber}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(lot.contactPhone || lot.contactEmail || lot.phone) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-3">📞 Liên Hệ</h3>
            <div className="text-sm text-gray-700">
              {lot.contactPhone && (<p><strong>Điện Thoại:</strong> {lot.contactPhone}</p>)}
              {lot.phone && !lot.contactPhone && (<p><strong>Điện Thoại:</strong> {lot.phone}</p>)}
              {lot.contactEmail && (<p><strong>Email:</strong> {lot.contactEmail}</p>)}
            </div>
          </div>
        )}

        {/* Description */}
        {lot.description && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-2">📝 Mô Tả</h3>
            <p className="text-sm text-gray-700">{lot.description}</p>
          </div>
        )}

        {/* Images Section */}
        <div className="mb-8 bg-gradient-to-br from-purple-50 to-purple-100/30 p-6 rounded-2xl border border-purple-200 shadow-sm">
          <h3 className="font-semibold text-purple-600 text-xl flex items-center gap-2 mb-4">
            <i className="ri-image-fill"></i> Hình Ảnh Bãi Xe
          </h3>

          {lot.images && lot.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lot.images.map((image, index) => (
                <div key={image.id || index} className="relative group">
                  <img
                    src={image.path}
                    alt={`Parking lot ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border-2 border-purple-200 shadow-md hover:shadow-xl transition-all cursor-pointer"
                    onClick={() => window.open(image.path, '_blank')}
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}/{lot.images.length}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-purple-300">
              <i className="ri-image-line text-5xl text-purple-300 mb-3"></i>
              <p className="text-purple-600 font-medium">Chưa có hình ảnh</p>
            </div>
          )}
        </div>

        {/* Capacity */}
        {lot.lotCapacity?.length > 0 && (
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
              🚗 Tổng Sức Chứa
            </h3>
            <table className="min-w-full text-xs border bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Loại Xe</th>
                  <th className="px-3 py-2 text-left">Sức Chứa</th>
                  <th className="px-3 py-2 text-left">Hỗ Trợ EV</th>
                </tr>
              </thead>
              <tbody>
                {lot.lotCapacity.map((c, idx) => (
                  <tr key={idx} className="border-t text-gray-700">
                    <td className="px-3 py-2">{c.vehicleType}</td>
                    <td className="px-3 py-2">{c.capacity}</td>
                    <td className="px-3 py-2">
                      {c.supportElectricVehicle ? "⚡ Có" : "Không"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pricing Rules */}
        {lot.pricingRules?.length > 0 && (
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
              💰 Quy Tắc Giá
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border bg-white rounded-lg shadow-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Tên Quy Tắc</th>
                    <th className="px-3 py-2 text-left">Loại Xe</th>
                    <th className="px-3 py-2 text-left">Phí Ban Đầu</th>
                    <th className="px-3 py-2 text-left">Thời Lượng Ban Đầu</th>
                    <th className="px-3 py-2 text-left">Phí Bước</th>
                    <th className="px-3 py-2 text-left">Bước nhảy (phút)</th>
                    <th className="px-3 py-2 text-left">Hiệu Lực Từ</th>
                    <th className="px-3 py-2 text-left">Hiệu Lực Đến</th>
                    <th className="px-3 py-2 text-left">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {lot.pricingRules.map((r, idx) => (
                    <tr key={idx} className="border-t text-gray-700">
                      <td className="px-3 py-2">{r.ruleName}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                          {r.vehicleType}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-semibold text-green-600">
                        {r.initialCharge.toLocaleString()} ₫
                      </td>
                      <td className="px-3 py-2">{r.initialDurationMinute} phút</td>
                      <td className="px-3 py-2 font-semibold text-orange-600">
                        {r.stepRate.toLocaleString()} ₫
                      </td>
                      <td className="px-3 py-2">{r.stepMinute} phút</td>
                      <td className="px-3 py-2">
                        {r.validFrom ? new Date(r.validFrom).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        {r.validTo ? new Date(r.validTo).toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          r.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.isActive ? '✅ Hoạt Động' : '❌ Không Hoạt Động'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parking Policies */}
        {lot.policies?.length > 0 && (
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
              🛡️ Chính Sách Đỗ Xe
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {lot.policies.map((policy, idx) => {
                const getPolicyLabel = (type) => {
                  switch (type) {
                    case "EARLY_CHECK_IN_BUFFER":
                      return { label: "Cho Phép Check-in Sớm", icon: "🕐", desc: "Cho phép khách check-in sớm hơn giờ đã đặt" };
                    case "LATE_CHECK_OUT_BUFFER":
                      return { label: "Cho Phép Check-out Muộn", icon: "🕐", desc: "Cho phép khách check-out muộn hơn giờ đã đặt" };
                    case "LATE_CHECK_IN_CANCEL_AFTER":
                      return { label: "Hủy Nếu Check-in Trễ", icon: "⏰", desc: "Tự động hủy nếu check-in quá muộn" };
                    case "EARLY_CANCEL_REFUND_BEFORE":
                      return { label: "Hoàn Tiền Nếu Hủy Sớm", icon: "💰", desc: "Hoàn 100% nếu hủy trước" };
                    default:
                      return { label: type, icon: "📋", desc: "" };
                  }
                };
                const policyInfo = getPolicyLabel(policy.policyType);
                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{policyInfo.icon}</span>
                        <h4 className="font-semibold text-gray-900 text-sm">{policyInfo.label}</h4>
                      </div>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {policy.value} phút
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 pl-7">{policyInfo.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end px-8 pb-8 pt-5 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
