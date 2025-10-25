import { useState } from "react";
import parkingLotApi from "../api/parkingLotApi";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import ParkingLotMapDrawer from "../components/ParkingLotMapDrawerNew"; // ✅ thêm import

export default function ViewParkingLotModal({
  lot,
  onClose,
  onActionDone,
  showDrawMapButton = false,
  // optional: allow callers to provide a custom list of status options
  statusOptions = null,
}) {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showDrawMap, setShowDrawMap] = useState(false); // ✅ thêm state

  const updateStatus = async (status, reason = null) => {
    try {
      showInfo(`⏳ Updating status to "${status}"...`);
      const res = await parkingLotApi.update(lot.id, { status, reason });

      if (res.status === 200) {
        showSuccess(`✅ Status updated to "${status}" successfully!`);
        onActionDone();
        onClose();
      } else {
        showError("⚠️ Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      showError(err.response?.data?.message || "❌ An unexpected error occurred!");
    }
  };

  const handleChangeStatus = async (newStatus) => {
    if (newStatus === "REJECTED") {
      setPendingStatus(newStatus);
      setShowReasonModal(true);
      return;
    }
    await updateStatus(newStatus, null);
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
    <>
      {/* ================= MODAL CHÍNH (popup overlay) ================= */}
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
        <div className="p-8 w-[90vw] max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
          <h2 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
            🅿️ {lot.name}
          </h2>

          {/* Status Dropdown */}
          <div className="relative">
            <details className="group">
              <summary
                className={`list-none flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm cursor-pointer select-none transition-all duration-200 ${getStatusStyle(
                  lot.status
                )}`}
              >
                {lot.status}
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

              <ul className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {(statusOptions || [
                  {
                    key: "PREPARING",
                    label: "Preparing",
                    color: "text-yellow-600",
                  },
                  {
                    key: "PARTNER_CONFIGURATION",
                    label: "Partner Configuration",
                    color: "text-blue-600",
                  },
                  {
                    key: "REJECTED",
                    label: "Rejected",
                    color: "text-red-600",
                  },
                ]).map((s) => (
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
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[15px] text-gray-700 mb-8">
          <p>
            <strong>🏢 Address:</strong> {lot.streetAddress}, {lot.ward}, {lot.city}
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
                {lot.pricingRules.map((r) => (
                  <tr key={r.id} className="border-t text-gray-700">
                    <td className="px-3 py-2">{r.ruleName}</td>
                    <td className="px-3 py-2">{r.vehicleType}</td>
                    <td className="px-3 py-2">{r.stepRate.toLocaleString()} ₫</td>
                    <td className="px-3 py-2">{r.initialCharge.toLocaleString()} ₫</td>
                    <td className="px-3 py-2">{r.initialDurationMinute}</td>
                    <td className="px-3 py-2">{r.stepMinute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ Footer với nút Draw Map mới */}
        <div className="mt-6 flex justify-end gap-3 items-center border-t pt-5 sticky bottom-0 bg-white z-10">
          {showDrawMapButton && (
            <button
              onClick={() => setShowDrawMap(true)}
              className="bg-blue-100 text-blue-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-200 flex items-center gap-2"
            >
              🗺️ Draw Map
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
          >
            Close
          </button>
        </div>
  </div>
  </div>
  {/* 🔸 Popup nhập lý do reject */}
      {showReasonModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-semibold text-red-600 mb-3">
              🚫 Enter Reason for Rejection
            </h2>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400"
              rows="4"
              placeholder="Enter detailed reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    showError("⚠️ Please enter a reason!");
                    return;
                  }
                  await updateStatus(pendingStatus, rejectionReason.trim());
                  setShowReasonModal(false);
                }}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Drawer vẽ map toàn màn hình */}
      {showDrawMap && (
        <ParkingLotMapDrawer
          lot={lot}
          onClose={() => {
            setShowDrawMap(false);
            onActionDone(); // reload lại danh sách sau khi lưu layout
          }}
        />
      )}
    </>
  );
}
