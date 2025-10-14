import parkingLotApi from "../api/parkingLotApi";
import { showSuccess, showError } from "../utils/toastUtils.jsx";

export default function ViewParkingLotModal({ lot, onClose, onActionDone }) {
  const handleChangeStatus = async (newStatus) => {
    try {
      let reason = null;

      // Nếu admin chọn REJECTED thì bắt nhập lý do
      if (newStatus === "REJECTED") {
        reason = prompt("Enter reason for rejection:");
        if (!reason) return showError("Reason is required!");
      }

      const res = await parkingLotApi.update(lot.id, {
        status: newStatus,
        reason,
      });

      if (res.status === 200) {
        showSuccess(`✅ Updated status to "${newStatus}"`);
        onActionDone();
        onClose();
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      showError("Failed to update status!");
    }
  };

  return (
    <div className="p-8 w-[90vw] max-w-[1200px] mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
        <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
          🅿️ {lot.name}
        </h2>
        <span
          className={`px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${
            lot.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {lot.status}
        </span>
      </div>

      {/* 🔸 Basic Info */}
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

      {/* 🔸 Total Capacity */}
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

      {/* 🔸 Pricing Rules */}
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
                <th className="px-3 py-2 text-left">Base Rate</th>
                <th className="px-3 py-2 text-left">Initial Charge</th>
                <th className="px-3 py-2 text-left">Free (min)</th>
                <th className="px-3 py-2 text-left">Grace (min)</th>
              </tr>
            </thead>
            <tbody>
              {lot.pricingRules.map((r) => (
                <tr key={r.id} className="border-t text-gray-700">
                  <td className="px-3 py-2">{r.ruleName}</td>
                  <td className="px-3 py-2">{r.vehicleType}</td>
                  <td className="px-3 py-2">{r.baseRate.toLocaleString()} ₫</td>
                  <td className="px-3 py-2">
                    {r.initialCharge.toLocaleString()} ₫
                  </td>
                  <td className="px-3 py-2">{r.freeMinute}</td>
                  <td className="px-3 py-2">{r.gracePeriodMinute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔸 Footer Buttons */}
      <div className="mt-6 flex justify-end items-center gap-3 border-t pt-5 sticky bottom-0 bg-white z-10">
        {/* ✅ Dropdown chọn trạng thái (hiển thị LÊN TRÊN) */}
        <div className="relative">
          <details className="group">
            <summary className="list-none flex items-center gap-2 bg-indigo-100 text-indigo-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-200 cursor-pointer select-none">
              Change Status
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </summary>

            {/* 🔺 Đổi mt-2 => mb-2, bottom-full để xổ lên trên */}
            <ul className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {[
                {
                  key: "UNDER_SURVEY",
                  label: "Under Survey",
                  color: "text-blue-600",
                },
                {
                  key: "PREPARING",
                  label: "Preparing",
                  color: "text-yellow-600",
                },
                {
                  key: "ACTIVE_PENDING",
                  label: "Active Pending",
                  color: "text-indigo-600",
                },
                { key: "ACTIVE", label: "Active", color: "text-green-600" },
                { key: "REJECTED", label: "Rejected", color: "text-red-600" },
              ].map((s) => (
                <li
                  key={s.key}
                  onClick={() => handleChangeStatus(s.key)}
                  className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${s.color}`}
                >
                  {s.label}
                </li>
              ))}
            </ul>
          </details>
        </div>

        <button
          onClick={onClose}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}
