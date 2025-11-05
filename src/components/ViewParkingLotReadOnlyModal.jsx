import React from "react";

export default function ViewParkingLotReadOnlyModal({ lot, onClose }) {
  if (!lot) return null;

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
            {lot.status}
          </span>
        </div>

        {/* Content - Scrollable */}
        <div className="px-8 py-6 overflow-y-auto flex-1">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-[15px] text-gray-700 mb-6">
          <p>
            <strong>🏢 Address:</strong> {lot.streetAddress || "-"}
            {lot.ward ? `, ${lot.ward}` : ""}
            {lot.city ? `, ${lot.city}` : ""}
          </p>
          <p>
            <strong>🕒 Open:</strong> {lot.openTime ?? "-"}
          </p>
          <p>
            <strong>🕕 Close:</strong> {lot.closeTime ?? "-"}
          </p>
          <p>
            <strong>🌙 24 Hours:</strong> {lot.is24Hour ? "Yes" : "No"}
          </p>
          <p>
            <strong>🏗 Floors:</strong> {lot.totalFloors ?? "-"}
          </p>
          <p>
            <strong>📍 Latitude:</strong> {lot.latitude ?? "-"}
          </p>
          <p>
            <strong>📍 Longitude:</strong> {lot.longitude ?? "-"}
          </p>
          <p>
            <strong>📅 Created:</strong>{" "}
            {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : "-"}
          </p>
          <p>
            <strong>⚙ Updated:</strong>{" "}
            {lot.updatedAt ? new Date(lot.updatedAt).toLocaleString() : "-"}
          </p>
        </div>

        {/* Reason (if provided by partner) */}
        {lot.reason && (
          <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
            <h3 className="font-semibold text-red-600 mb-2">📝 Reason</h3>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {lot.reason}
            </p>
          </div>
        )}

        {/* Partner / Owner Info */}
        {(lot.partner || lot.owner || lot.companyName) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-3">🏢 Partner / Owner</h3>
            <div className="text-sm text-gray-700">
              <p>
                <strong>Name:</strong> {lot.partner?.companyName ?? lot.owner?.name ?? lot.companyName ?? "-"}
              </p>
              {lot.partner?.companyEmail && (
                <p>
                  <strong>Email:</strong> {lot.partner.companyEmail}
                </p>
              )}
              {lot.partner?.companyPhone && (
                <p>
                  <strong>Phone:</strong> {lot.partner.companyPhone}
                </p>
              )}
              {lot.partner?.taxNumber && (
                <p>
                  <strong>Tax number:</strong> {lot.partner.taxNumber}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(lot.contactPhone || lot.contactEmail || lot.phone) && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-3">📞 Contact</h3>
            <div className="text-sm text-gray-700">
              {lot.contactPhone && (<p><strong>Phone:</strong> {lot.contactPhone}</p>)}
              {lot.phone && !lot.contactPhone && (<p><strong>Phone:</strong> {lot.phone}</p>)}
              {lot.contactEmail && (<p><strong>Email:</strong> {lot.contactEmail}</p>)}
            </div>
          </div>
        )}

        {/* Description */}
        {lot.description && (
          <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-2">📝 Description</h3>
            <p className="text-sm text-gray-700">{lot.description}</p>
          </div>
        )}

        {/* Images */}
        {((lot.images && lot.images.length > 0) || (lot.imageUrls && lot.imageUrls.length > 0) || (lot.photos && lot.photos.length > 0)) && (
          <div className="mb-6">
            <h3 className="font-semibold text-indigo-600 mb-3">📸 Images</h3>
            <div className="flex flex-wrap gap-3">
              {(lot.images ?? lot.imageUrls ?? lot.photos).map((src, i) => (
                <img
                  key={i}
                  src={src.url ?? src}
                  alt={`img-${i}`}
                  className="w-40 h-28 object-cover rounded-md border"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/160x112?text=Image" }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Capacity */}
        {lot.lotCapacity?.length > 0 && (
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
              🚗 Total Capacity
            </h3>
            <table className="min-w-full text-xs border bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Vehicle Type</th>
                  <th className="px-3 py-2 text-left">Capacity</th>
                  <th className="px-3 py-2 text-left">EV Support</th>
                </tr>
              </thead>
              <tbody>
                {lot.lotCapacity.map((c, idx) => (
                  <tr key={idx} className="border-t text-gray-700">
                    <td className="px-3 py-2">{c.vehicleType}</td>
                    <td className="px-3 py-2">{c.capacity}</td>
                    <td className="px-3 py-2">
                      {c.supportElectricVehicle ? "⚡ Yes" : "No"}
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
              💰 Pricing Rules
            </h3>
            <table className="min-w-full text-xs border bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Rule Name</th>
                  <th className="px-3 py-2 text-left">Vehicle Type</th>
                  <th className="px-3 py-2 text-left">Step Rate</th>
                  <th className="px-3 py-2 text-left">Initial Charge</th>
                  <th className="px-3 py-2 text-left">
                    Initial Duration (Minute)
                  </th>
                  <th className="px-3 py-2 text-left">Step Minute (Minute)</th>
                </tr>
              </thead>
              <tbody>
                {lot.pricingRules.map((r, idx) => (
                  <tr key={idx} className="border-t text-gray-700">
                    <td className="px-3 py-2">{r.ruleName}</td>
                    <td className="px-3 py-2">{r.vehicleType}</td>
                    <td className="px-3 py-2">
                      {r.stepRate.toLocaleString()} ₫
                    </td>
                    <td className="px-3 py-2">
                      {r.initialCharge.toLocaleString()} ₫
                    </td>
                    <td className="px-3 py-2">{r.initialDurationMinute}</td>
                    <td className="px-3 py-2">{r.stepMinute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Parking Policies */}
        {lot.policies?.length > 0 && (
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
              🛡️ Parking Policies
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {lot.policies.map((policy, idx) => {
                const getPolicyLabel = (type) => {
                  switch (type) {
                    case "EARLY_CHECK_IN_BUFFER":
                      return { label: "Early Check-in Buffer", icon: "🕐", desc: "Thời gian cho phép check-in sớm" };
                    case "LATE_CHECK_OUT_BUFFER":
                      return { label: "Late Check-out Buffer", icon: "🕐", desc: "Thời gian cho phép check-out trễ" };
                    case "LATE_CHECK_IN_CANCEL_AFTER":
                      return { label: "Late Check-in Cancel After", icon: "⏰", desc: "Tự động hủy nếu check-in trễ quá" };
                    case "EARLY_CANCEL_REFUND_BEFORE":
                      return { label: "Early Cancel Refund Before", icon: "💰", desc: "Hoàn tiền 100% nếu hủy trước" };
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
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
