import React from "react";

export default function ViewParkingLotReadOnlyModal({ lot, onClose }) {
  if (!lot) return null;

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "REJECTED":
        return "Bị từ chối";
      case "PREPARING":
        return "Đang chuẩn bị";
      case "PARTNER_CONFIGURATION":
        return "Cấu hình đối tác";
      case "PENDING":
        return "Chờ duyệt";
      case "PENDING_PAYMENT":
        return "Chờ thanh toán";
      case "MAP_DENIED":
        return "Từ chối bản đồ";
      case "INACTIVE":
        return "Không hoạt động";
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
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1200px] max-h-[85vh] border border-gray-200 flex flex-col">
        {/* Header - Orange Theme for Admin */}
        <div className="flex justify-between items-center px-8 py-5 bg-orange-600 rounded-t-2xl flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">
            {lot.name}
          </h2>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${getStatusStyle(
                lot.status
              )}`}
            >
              {getStatusLabel(lot.status)}
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Đóng"
            >
              <i className="ri-close-line text-xl text-white"></i>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* ROW 1: Basic Info + Images (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Thông tin cơ bản */}
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-4">Thông tin cơ bản</h3>
              <div className="space-y-3">
                {/* Địa chỉ */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-start gap-3">
                    <i className="ri-map-pin-line text-orange-600 text-xl mt-0.5"></i>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Địa chỉ:</p>
                      <p className="font-medium text-gray-900">
                        {lot.streetAddress || "-"}
                        {lot.ward ? `, ${lot.ward}` : ""}
                        {lot.city ? `, ${lot.city}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Giờ mở cửa / đóng cửa */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <i className="ri-time-line text-orange-600 text-xl mt-0.5"></i>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Giờ mở cửa:</p>
                        <p className="text-xl font-bold text-gray-900">{lot.openTime ?? "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <i className="ri-time-line text-orange-600 text-xl mt-0.5"></i>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Giờ đóng cửa:</p>
                        <p className="text-xl font-bold text-gray-900">{lot.closeTime ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 24/7 */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-center gap-3">
                    <i className="ri-24-hours-line text-orange-600 text-xl"></i>
                    <span className="text-gray-700">24/7:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${lot.is24Hour ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {lot.is24Hour ? "Có" : "Không"}
                    </span>
                  </div>
                </div>

                {/* Tổng số tầng */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-center gap-3">
                    <i className="ri-building-2-line text-orange-600 text-xl"></i>
                    <span className="text-gray-700">Tổng số tầng:</span>
                    <span className="font-bold text-gray-900">{lot.totalFloors ?? "-"}</span>
                  </div>
                </div>

                {/* Diện tích */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-center gap-3">
                    <i className="ri-ruler-2-line text-orange-600 text-xl"></i>
                    <span className="text-gray-700">Diện tích:</span>
                    <span className="font-bold text-gray-900">{lot.lotSquare ? `${lot.lotSquare} m²` : "-"}</span>
                  </div>
                </div>

                {/* Thời gian tầm nhìn (Horizon Time) */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-center gap-3">
                    <i className="ri-timer-line text-orange-600 text-xl"></i>
                    <span className="text-gray-700">Thời gian tầm nhìn:</span>
                    <span className="font-bold text-gray-900">{lot.horizonTime ? `${lot.horizonTime} phút` : "-"}</span>
                  </div>
                </div>

                {/* Tọa độ */}
                <div className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                  <div className="flex items-center gap-3">
                    <i className="ri-compass-3-line text-orange-600 text-xl"></i>
                    <span className="text-gray-700">Tọa độ:</span>
                    <span className="font-medium text-gray-900">{lot.latitude ?? "-"}, {lot.longitude ?? "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Thư viện ảnh */}
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-4">Thư viện ảnh</h3>
              {lot.images && lot.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {lot.images.map((image, index) => (
                    <div 
                      key={image.id || index} 
                      className="relative rounded-xl overflow-hidden shadow-md border-2 border-gray-200 hover:border-orange-400 transition-all cursor-pointer"
                      onClick={() => window.open(image.path, '_blank')}
                    >
                      <img
                        src={image.path}
                        alt={`Parking lot ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}/{lot.images.length}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-orange-50 rounded-xl border-2 border-dashed border-orange-300">
                  <i className="ri-image-line text-5xl text-orange-300 mb-3"></i>
                  <p className="text-orange-600 font-medium">Chưa có hình ảnh</p>
                </div>
              )}
            </div>
          </div>

          {/* Reason (if provided) */}
          {lot.reason && (
            <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
              <h3 className="font-semibold text-red-600 mb-2">📝 Lý do</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {lot.reason}
              </p>
            </div>
          )}

          {/* Partner / Owner Info */}
          {(lot.partner || lot.owner || lot.companyName) && (
            <div className="mb-6 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-building-line text-orange-600 text-xl"></i>
                Đối tác / Chủ sở hữu
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Tên:</strong> {lot.partner?.companyName ?? lot.owner?.name ?? lot.companyName ?? "-"}
                </p>
                {lot.partner?.companyEmail && (
                  <p><strong>Email:</strong> {lot.partner.companyEmail}</p>
                )}
                {lot.partner?.companyPhone && (
                  <p><strong>Điện thoại:</strong> {lot.partner.companyPhone}</p>
                )}
                {lot.partner?.taxNumber && (
                  <p><strong>Mã số thuế:</strong> {lot.partner.taxNumber}</p>
                )}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(lot.contactPhone || lot.contactEmail || lot.phone) && (
            <div className="mb-6 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-phone-line text-orange-600 text-xl"></i>
                Thông tin liên hệ
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                {lot.contactPhone && (<p><strong>Điện thoại:</strong> {lot.contactPhone}</p>)}
                {lot.phone && !lot.contactPhone && (<p><strong>Điện thoại:</strong> {lot.phone}</p>)}
                {lot.contactEmail && (<p><strong>Email:</strong> {lot.contactEmail}</p>)}
              </div>
            </div>
          )}

          {/* Description */}
          {lot.description && (
            <div className="mb-6 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-file-text-line text-orange-600 text-xl"></i>
                Mô tả
              </h3>
              <p className="text-sm text-gray-700">{lot.description}</p>
            </div>
          )}

          {/* Capacity */}
          {lot.lotCapacity?.length > 0 && (
            <div className="mb-8 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-car-line text-orange-600 text-xl"></i>
                Sức chứa tổng
              </h3>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-orange-700 font-semibold">Loại xe</th>
                      <th className="px-4 py-3 text-left text-orange-700 font-semibold">Sức chứa</th>
                      <th className="px-4 py-3 text-left text-orange-700 font-semibold">Hỗ trợ EV</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {lot.lotCapacity.map((c, idx) => (
                      <tr key={idx} className="border-t text-gray-700">
                        <td className="px-4 py-3">{c.vehicleType}</td>
                        <td className="px-4 py-3">{c.capacity}</td>
                        <td className="px-4 py-3">
                          {c.supportElectricVehicle ? "⚡ Có" : "Không"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing Rules */}
          {lot.pricingRules?.length > 0 && (
            <div className="mb-8 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-money-dollar-circle-line text-orange-600 text-xl"></i>
                Bảng giá dịch vụ
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-100">
                    <tr>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Tên quy tắc</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Loại xe</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Phí ban đầu</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Thời gian BD</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Phí bước</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Bước nhảy</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Hiệu lực từ</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Hiệu lực đến</th>
                      <th className="px-3 py-3 text-left text-orange-700 font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {lot.pricingRules.map((r, idx) => (
                      <tr key={idx} className="border-t text-gray-700">
                        <td className="px-3 py-2">{r.ruleName}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                            {r.vehicleType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-600">
                          {r.initialCharge?.toLocaleString()} ₫
                        </td>
                        <td className="px-3 py-2">{r.initialDurationMinute} phút</td>
                        <td className="px-3 py-2 font-semibold text-orange-600">
                          {r.stepRate?.toLocaleString()} ₫
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
                            {r.isActive ? '✅ Hoạt động' : '❌ Ngưng hoạt động'}
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
            <div className="mb-8 bg-white p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-3">
                <i className="ri-shield-check-line text-orange-600 text-xl"></i>
                Chính sách bãi đỗ
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {lot.policies.map((policy, idx) => {
                  const getPolicyLabel = (type) => {
                    switch (type) {
                      case "EARLY_CHECK_IN_BUFFER":
                        return { label: "Thời gian giãn cách an toàn", icon: "🕐", desc: "Khoảng nghỉ bắt buộc giữa hai lượt đặt liên tiếp." };
                      case "LATE_CHECK_IN_CANCEL_AFTER":
                        return { label: "Thời gian giữ chỗ tối đa", icon: "⏰", desc: "Tự động hủy đặt chỗ nếu khách đến trễ quá thời gian này." };
                      case "EARLY_CANCEL_REFUND_BEFORE":
                        return { label: "Thời gian tối thiểu báo hủy", icon: "💰", desc: "Khách phải hủy trước giờ đặt ít nhất bao nhiêu phút để được hoàn tiền." };
                      default:
                        return { label: type, icon: "📋", desc: "" };
                    }
                  };
                  const policyInfo = getPolicyLabel(policy.policyType);
                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-400 transition-all group">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 group-hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                            <span className="text-lg group-hover:text-white transition-colors">{policyInfo.icon}</span>
                          </div>
                          <h4 className="font-semibold text-slate-800 text-sm">{policyInfo.label}</h4>
                        </div>
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
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

          {/* Timestamps */}
          <div className="mt-5 pt-4 border-t border-gray-200 flex gap-8 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <i className="ri-calendar-line text-orange-400"></i>
              Ngày tạo: <span className="font-medium text-gray-700">{lot.createdAt ? new Date(lot.createdAt).toLocaleString() : "-"}</span>
            </span>
            <span className="flex items-center gap-2">
              <i className="ri-refresh-line text-orange-400"></i>
              Cập nhật: <span className="font-medium text-gray-700">{lot.updatedAt ? new Date(lot.updatedAt).toLocaleString() : "-"}</span>
            </span>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end px-8 pb-6 pt-4 border-t flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition cursor-pointer flex items-center gap-2"
          >
            <i className="ri-close-line"></i>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
