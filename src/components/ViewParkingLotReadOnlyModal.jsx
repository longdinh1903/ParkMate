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
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[1000px] max-h-[85vh] overflow-y-auto p-8 border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
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

        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[15px] text-gray-700 mb-8">
          <p>
            <strong>🏢 Address:</strong> {lot.streetAddress}, {lot.ward},{" "}
            {lot.city}
          </p>
          <p>
            <strong>🕒 Open:</strong> {lot.openTime}
          </p>
          <p>
            <strong>🕕 Close:</strong> {lot.closeTime}
          </p>
          <p>
            <strong>🌙 24 Hours:</strong> {lot.is24Hour ? "Yes" : "No"}
          </p>
          <p>
            <strong>🏗 Floors:</strong> {lot.totalFloors}
          </p>
          <p>
            <strong>📍 Latitude:</strong> {lot.latitude}
          </p>
          <p>
            <strong>📍 Longitude:</strong> {lot.longitude}
          </p>
          <p>
            <strong>📅 Created:</strong> {lot.createdAt}
          </p>
          <p>
            <strong>⚙ Updated:</strong> {lot.updatedAt}
          </p>
        </div>

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

        {/* Footer */}
        <div className="flex justify-end border-t pt-5">
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
