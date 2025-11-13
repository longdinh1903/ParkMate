import { useState } from "react";
import parkingLotApi from "../api/parkingLotApi";
import floorApi from "../api/floorApi";
import areaApi from "../api/areaApi";
import spotApi from "../api/spotApi";
import policyApi from "../api/policyApi";
import pricingRuleApi from "../api/pricingRuleApi";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import ParkingLotMapDrawer from "../components/ParkingLotMapDrawerNew"; // ✅ thêm import
import ConfirmModal from "../components/ConfirmModal";

export default function ViewParkingLotModal({
  lot,
  onClose,
  onActionDone,
  showDrawMapButton = false,
  // optional: allow callers to provide a custom list of status options
  statusOptions = null,
  showResetMapButton = false,
  allowEdit = false, // only show edit buttons when true (for Partner)
}) {
  // Local state for lot data (for realtime updates)
  const [lotData, setLotData] = useState(lot);
  
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null);
  const [showDrawMap, setShowDrawMap] = useState(false); // ✅ thêm state
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Edit states
  const [editingOperatingHours, setEditingOperatingHours] = useState(false);
  const [editingHorizonTime, setEditingHorizonTime] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null); // policy object being edited
  const [editingRule, setEditingRule] = useState(null); // pricing rule object being edited
  const [operatingHoursForm, setOperatingHoursForm] = useState({
    operatingHoursStart: "",
    operatingHoursEnd: "",
    is24Hour: false,
  });
  const [horizonTimeForm, setHorizonTimeForm] = useState({ horizonTime: "" });
  const [policyForm, setPolicyForm] = useState({ value: "" });
  const [ruleForm, setRuleForm] = useState({
    ruleName: "",
    vehicleType: "",
    stepRate: "",
    initialCharge: "",
    initialDurationMinute: "",
    stepMinute: "",
    validFrom: "",
    validTo: "",
    isActive: true,
  });

  const updateStatus = async (status, reason = null) => {
    try {
      const payloadStatus =
        typeof status === "string" ? status.trim().toUpperCase() : status;
      showInfo(`⏳ Updating status to "${payloadStatus}"...`);
      const res = await parkingLotApi.update(lot.id, {
        status: payloadStatus,
        reason,
      });

      if (res.status === 200) {
        showSuccess(`✅ Status updated to "${payloadStatus}" successfully!`);
        onActionDone();
        onClose();
      } else {
        showError("⚠️ Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error updating status:", err);
      showError(
        err.response?.data?.message || "❌ An unexpected error occurred!"
      );
    }
  };

  const handleChangeStatus = async (newStatus) => {
    // For statuses that require a reason from partner, open reason modal
    if (newStatus === "REJECTED" || newStatus === "MAP_DENIED") {
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
      case "MAP_DENIED":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  // Only allow reset when lot status is PREPARING or MAP_DENIED
  const isResetAllowed = ["PREPARING", "MAP_DENIED"].includes(
    (lot?.status || "").toUpperCase()
  );

  // Delete all floors (and their areas/spots if necessary) so admin can redraw the map
  const doReset = async () => {
    setResetLoading(true);
    try {
      showInfo("⏳ Resetting map: deleting floors...");
      const floorsRes = await floorApi.getByLotId(lot.id);
      const floors =
        floorsRes.data?.data?.content ||
        floorsRes.data?.data ||
        floorsRes.data?.content ||
        floorsRes.data ||
        [];

      const failures = [];

      for (const f of floors) {
        try {
          // Try direct delete first
          await floorApi.delete(f.id);
        } catch (err) {
          console.warn(
            `Direct delete floor ${f.id} failed, attempting cascade delete`,
            err
          );
          // cascade: delete spots -> areas -> floor
          try {
            const areasRes = await areaApi.getByFloorId(f.id);
            const areas =
              areasRes.data?.data?.content ||
              areasRes.data?.data ||
              areasRes.data?.content ||
              areasRes.data ||
              [];

            for (const a of areas) {
              try {
                const spotsRes = await spotApi.getByAreaId(a.id);
                const spots =
                  spotsRes.data?.data?.content ||
                  spotsRes.data?.data ||
                  spotsRes.data?.content ||
                  spotsRes.data ||
                  [];
                for (const s of spots) {
                  try {
                    await spotApi.delete(s.id);
                  } catch (err2) {
                    console.error(`Failed to delete spot ${s.id}`, err2);
                    failures.push(
                      `spot ${s.id}: ${
                        err2.response?.data?.message || err2.message
                      }`
                    );
                  }
                }

                // delete area
                try {
                  await areaApi.delete(a.id);
                } catch (err3) {
                  console.error(`Failed to delete area ${a.id}`, err3);
                  failures.push(
                    `area ${a.id}: ${
                      err3.response?.data?.message || err3.message
                    }`
                  );
                }
              } catch (errA) {
                console.error(`Error processing areas for floor ${f.id}`, errA);
                failures.push(
                  `areas for floor ${f.id}: ${
                    errA.response?.data?.message || errA.message
                  }`
                );
              }
            }

            // try deleting floor again after cleaning areas/spots
            try {
              await floorApi.delete(f.id);
            } catch (err4) {
              console.error(
                `Failed to delete floor ${f.id} after cascade`,
                err4
              );
              failures.push(
                `floor ${f.id}: ${err4.response?.data?.message || err4.message}`
              );
            }
          } catch (cascadeErr) {
            console.error(
              `Cascade delete failed for floor ${f.id}`,
              cascadeErr
            );
            failures.push(
              `floor ${f.id}: ${
                cascadeErr.response?.data?.message || cascadeErr.message
              }`
            );
          }
        }
      }

      if (failures.length === 0) {
        showSuccess(
          "✅ Map reset: all floors deleted. You can draw a new map now."
        );
        // open draw map drawer
        setShowDrawMap(true);
        onActionDone?.();
      } else {
        console.error("Reset map encountered failures:", failures);
        showError(`Failed to fully reset map. Errors: ${failures.join("; ")}`);
      }
    } catch (err) {
      console.error("❌ Error resetting map:", err);
      showError(err.response?.data?.message || "❌ Failed to reset map.");
    } finally {
      setResetLoading(false);
      setConfirmResetOpen(false);
    }
  };

  const handleResetMap = async () => {
    if (!isResetAllowed) {
      showError(
        `Cannot reset map: parking lot status is "${(
          lot?.status || ""
        ).toUpperCase()}". Reset is allowed only when status is Preparing or Map Denied.`
      );
      return;
    }

    // open centered confirm modal
    setConfirmResetOpen(true);
  };

  // Normalize and return any reason text stored on the lot object
  const getReasonText = () => {
    return (
      lot?.reason ||
      lot?.rejectionReason ||
      lot?.mapDenialReason ||
      lot?.mapDeniedReason ||
      null
    );
  };

  // ========== EDIT FUNCTIONS ==========
  
  // Operating Hours
  const startEditOperatingHours = () => {
    setOperatingHoursForm({
      operatingHoursStart: lotData.operatingHoursStart || lotData.openTime || "",
      operatingHoursEnd: lotData.operatingHoursEnd || lotData.closeTime || "",
      is24Hour: lotData.is24Hour || false,
    });
    setEditingOperatingHours(true);
  };

  const cancelEditOperatingHours = () => {
    setEditingOperatingHours(false);
  };

  const saveOperatingHours = async () => {
    try {
      showInfo("⏳ Updating operating hours...");
      await parkingLotApi.update(lotData.id, {
        operatingHoursStart: operatingHoursForm.operatingHoursStart,
        operatingHoursEnd: operatingHoursForm.operatingHoursEnd,
        is24Hour: operatingHoursForm.is24Hour,
      });
      showSuccess("✅ Operating hours updated successfully!");
      
      // Update local state immediately
      setLotData({
        ...lotData,
        operatingHoursStart: operatingHoursForm.operatingHoursStart,
        operatingHoursEnd: operatingHoursForm.operatingHoursEnd,
        is24Hour: operatingHoursForm.is24Hour,
      });
      
      setEditingOperatingHours(false);
    } catch (err) {
      console.error("❌ Error updating operating hours:", err);
      showError(err.response?.data?.message || "❌ Failed to update operating hours");
    }
  };

  // Horizon Time
  const startEditHorizonTime = () => {
    setHorizonTimeForm({
      horizonTime: lotData.horizonTime?.toString() || "",
    });
    setEditingHorizonTime(true);
  };

  const cancelEditHorizonTime = () => {
    setEditingHorizonTime(false);
  };

  const saveHorizonTime = async () => {
    try {
      const horizonTimeValue = parseInt(horizonTimeForm.horizonTime);
      if (isNaN(horizonTimeValue) || horizonTimeValue < 0) {
        showError("❌ Please enter a valid horizon time (number of minutes)");
        return;
      }

      showInfo("⏳ Updating horizon time...");
      await parkingLotApi.update(lotData.id, {
        horizonTime: horizonTimeValue,
      });
      showSuccess("✅ Horizon time updated successfully!");
      
      // Update local state immediately
      setLotData({
        ...lotData,
        horizonTime: horizonTimeValue,
      });
      
      setEditingHorizonTime(false);
    } catch (err) {
      console.error("❌ Error updating horizon time:", err);
      showError(err.response?.data?.message || "❌ Failed to update horizon time");
    }
  };

  // Policy
  const startEditPolicy = (policyId) => {
    // Find the latest policy data from lotData
    const policy = lotData.policies.find(p => p.id === policyId);
    if (!policy) return;
    
    setPolicyForm({ value: policy.value.toString() });
    setEditingPolicy(policy);
  };

  const cancelEditPolicy = () => {
    setEditingPolicy(null);
  };

  const savePolicy = async () => {
    try {
      showInfo("⏳ Updating policy...");
      await policyApi.update(editingPolicy.id, {
        value: parseInt(policyForm.value, 10),
      });
      showSuccess("✅ Policy updated successfully!");
      
      // Update local state immediately
      setLotData({
        ...lotData,
        policies: lotData.policies.map(p => 
          p.id === editingPolicy.id 
            ? { ...p, value: parseInt(policyForm.value, 10) }
            : p
        ),
      });
      
      setEditingPolicy(null);
    } catch (err) {
      console.error("❌ Error updating policy:", err);
      showError(err.response?.data?.message || "❌ Failed to update policy");
    }
  };

  // Pricing Rule
  const startEditRule = (ruleId) => {
    // Find the latest rule data from lotData
    const rule = lotData.pricingRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
    const formatDatetimeLocal = (isoString) => {
      if (!isoString) return "";
      try {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        return "";
      }
    };

    setRuleForm({
      ruleName: rule.ruleName || "",
      vehicleType: rule.vehicleType || "",
      stepRate: rule.stepRate?.toString() || "",
      initialCharge: rule.initialCharge?.toString() || "",
      initialDurationMinute: rule.initialDurationMinute?.toString() || "",
      stepMinute: rule.stepMinute?.toString() || "",
      validFrom: formatDatetimeLocal(rule.validFrom),
      validTo: formatDatetimeLocal(rule.validTo),
      isActive: rule.isActive ?? true,
    });
    setEditingRule(rule);
  };

  const cancelEditRule = () => {
    setEditingRule(null);
  };

  const saveRule = async () => {
    try {
      showInfo("⏳ Updating pricing rule...");
      
      // Convert datetime-local to ISO string
      const formatToISO = (datetimeLocal) => {
        if (!datetimeLocal) return null;
        try {
          const date = new Date(datetimeLocal);
          return date.toISOString();
        } catch {
          return null;
        }
      };

      const payload = {
        ruleName: ruleForm.ruleName,
        vehicleType: ruleForm.vehicleType,
        stepRate: parseFloat(ruleForm.stepRate),
        initialCharge: parseFloat(ruleForm.initialCharge),
        initialDurationMinute: parseInt(ruleForm.initialDurationMinute, 10),
        stepMinute: parseInt(ruleForm.stepMinute, 10),
        isActive: ruleForm.isActive,
      };

      // Only add validFrom and validTo if they have values
      if (ruleForm.validFrom) {
        payload.validFrom = formatToISO(ruleForm.validFrom);
      }
      if (ruleForm.validTo) {
        payload.validTo = formatToISO(ruleForm.validTo);
      }

      await pricingRuleApi.update(editingRule.id, payload);
      showSuccess("✅ Pricing rule updated successfully!");
      
      // Update local state immediately
      setLotData({
        ...lotData,
        pricingRules: lotData.pricingRules.map(rule => 
          rule.id === editingRule.id 
            ? { ...rule, ...payload }
            : rule
        ),
      });
      
      setEditingRule(null);
    } catch (err) {
      console.error("❌ Error updating pricing rule:", err);
      showError(err.response?.data?.message || "❌ Failed to update pricing rule");
    }
  };

  const handleClose = () => {
    // Call onActionDone to refresh parent data when closing
    if (onActionDone) {
      onActionDone();
    }
    onClose();
  };

  return (
    <>
      {/* ================= MODAL CHÍNH (popup overlay) ================= */}
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
        <div className="w-[90vw] max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b flex-shrink-0">
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
                  {(
                    statusOptions || [
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
                      {
                        key: "MAP_DENIED",
                        label: "Map Denied",
                        color: "text-red-600",
                      },
                    ]
                  ).map((s) => (
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

          {/* Content - Scrollable */}
          <div className="px-8 py-6 overflow-y-auto flex-1 custom-scrollbar">
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
              <strong>� Lot Square:</strong> {lotData.lotSquare ? `${lotData.lotSquare} m²` : "-"}
            </p>
            <p className="flex items-center gap-2">
              <span>
                <strong>⏱️ Horizon Time:</strong>{" "}
                {editingHorizonTime ? (
                  <input
                    type="number"
                    min="0"
                    value={horizonTimeForm.horizonTime}
                    onChange={(e) =>
                      setHorizonTimeForm({
                        ...horizonTimeForm,
                        horizonTime: e.target.value,
                      })
                    }
                    className="w-20 px-2 py-1 border rounded text-sm"
                    placeholder="0"
                  />
                ) : (
                  lotData.horizonTime ? `${lotData.horizonTime} minutes` : "-"
                )}
              </span>
              {allowEdit && (
                editingHorizonTime ? (
                  <span className="flex gap-1">
                    <button
                      onClick={saveHorizonTime}
                      className="px-2 py-0.5 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEditHorizonTime}
                      className="px-2 py-0.5 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={startEditHorizonTime}
                    className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Edit Horizon Time"
                  >
                    ✏️
                  </button>
                )
              )}
            </p>
            <p>
              <strong>�📍 Latitude:</strong> {lot.latitude}
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

          {/* Operating Hours - Editable */}
          <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-indigo-600 text-xl flex items-center gap-2">
                🕐 Operating Hours
              </h3>
              {allowEdit && !editingOperatingHours && (
                <button
                  onClick={startEditOperatingHours}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  ✏️ Edit
                </button>
              )}
            </div>
            {editingOperatingHours ? (
              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Open Time
                    </label>
                    <input
                      type="time"
                      value={operatingHoursForm.operatingHoursStart}
                      onChange={(e) =>
                        setOperatingHoursForm({
                          ...operatingHoursForm,
                          operatingHoursStart: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Close Time
                    </label>
                    <input
                      type="time"
                      value={operatingHoursForm.operatingHoursEnd}
                      onChange={(e) =>
                        setOperatingHoursForm({
                          ...operatingHoursForm,
                          operatingHoursEnd: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is24Hour"
                    checked={operatingHoursForm.is24Hour}
                    onChange={(e) =>
                      setOperatingHoursForm({
                        ...operatingHoursForm,
                        is24Hour: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="is24Hour" className="text-sm text-gray-700">
                    24 Hours Operation
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={cancelEditOperatingHours}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveOperatingHours}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    💾 Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <p>
                  <strong>Open:</strong> {lotData.operatingHoursStart || lotData.openTime || "N/A"}
                </p>
                <p>
                  <strong>Close:</strong> {lotData.operatingHoursEnd || lotData.closeTime || "N/A"}
                </p>
                <p>
                  <strong>24 Hours:</strong> {lotData.is24Hour ? "✅ Yes" : "❌ No"}
                </p>
              </div>
            )}
          </div>

          {/* Reason (if provided by partner) */}
          {getReasonText() && (
            <div className="mb-6 bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
              <h3 className="font-semibold text-red-600 mb-2">📝 Reason</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {getReasonText()}
              </p>
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
          {lotData.pricingRules?.length > 0 && (
            <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
                💰 Pricing Rules
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border bg-white rounded-lg shadow-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Rule Name</th>
                      <th className="px-3 py-2 text-left">Vehicle Type</th>
                      <th className="px-3 py-2 text-left">Initial Charge</th>
                      <th className="px-3 py-2 text-left">Initial Duration</th>
                      <th className="px-3 py-2 text-left">Step Rate</th>
                      <th className="px-3 py-2 text-left">Step Minute</th>
                      <th className="px-3 py-2 text-left">Valid From</th>
                      <th className="px-3 py-2 text-left">Valid To</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      {allowEdit && <th className="px-3 py-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lotData.pricingRules.map((r) => (
                      <tr key={r.id} className="border-t text-gray-700">
                        <td className="px-3 py-2">{r.ruleName}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                            {r.vehicleType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-600">
                          {r.initialCharge.toLocaleString()} ₫
                        </td>
                        <td className="px-3 py-2">{r.initialDurationMinute} minutes</td>
                        <td className="px-3 py-2 font-semibold text-orange-600">
                          {r.stepRate.toLocaleString()} ₫
                        </td>
                        <td className="px-3 py-2">{r.stepMinute} minutes</td>
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
                            {r.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        {allowEdit && (
                          <td className="px-3 py-2">
                            <button
                              onClick={() => startEditRule(r.id)}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              ✏️ Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parking Policies */}
          {lotData.policies?.length > 0 && (
            <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-indigo-600 mb-4 text-xl flex items-center gap-2">
                🛡️ Parking Policies
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {lotData.policies.map((policy, idx) => {
                  const getPolicyLabel = (type) => {
                    switch (type) {
                      case "EARLY_CHECK_IN_BUFFER":
                        return { label: "Early Check-in Buffer", icon: "🕐", desc: "Allows guests to check in earlier than the booked time" };
                      case "LATE_CHECK_OUT_BUFFER":
                        return { label: "Late Check-out Buffer", icon: "🕐", desc: "Allows guests to check out later than the booked time" };
                      case "LATE_CHECK_IN_CANCEL_AFTER":
                        return { label: "Late Check-in Cancel After", icon: "⏰", desc: "Automatically cancels if check-in is too late" };
                      case "EARLY_CANCEL_REFUND_BEFORE":
                        return { label: "Early Cancel Refund Before", icon: "💰", desc: "100% refund if canceled before" };
                      default:
                        return { label: type, icon: "📋", desc: "" };
                    }
                  };
                  const policyInfo = getPolicyLabel(policy.policyType);
                  const isEditing = editingPolicy?.id === policy.id;
                  
                  return (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{policyInfo.icon}</span>
                          <h4 className="font-semibold text-gray-900 text-sm">{policyInfo.label}</h4>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={policyForm.value}
                              onChange={(e) =>
                                setPolicyForm({ value: e.target.value })
                              }
                              className="w-20 px-2 py-1 border rounded text-xs"
                            />
                            <span className="text-xs text-gray-600">minutes</span>
                            <button
                              onClick={savePolicy}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              💾
                            </button>
                            <button
                              onClick={cancelEditPolicy}
                              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              ✖️
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                              {policy.value} minutes
                            </span>
                            {allowEdit && (
                              <button
                                onClick={() => startEditPolicy(policy.id)}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        )}
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
          <div className="flex justify-end gap-3 items-center px-8 pb-8 pt-5 border-t flex-shrink-0">
            {/* Reset Map (admin) - delete all floors so admin can redraw */}
            {showResetMapButton && (
              <button
                onClick={handleResetMap}
                disabled={resetLoading || !isResetAllowed}
                className={`px-4 py-2 rounded-md text-sm font-medium border flex items-center gap-2 ${
                  isResetAllowed
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                    : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                }`}
              >
                {resetLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  "Reset Map"
                )}
              </button>
            )}
            {showDrawMapButton && (
              <button
                onClick={() => setShowDrawMap(true)}
                disabled={!["PREPARING", "MAP_DENIED"].includes((lot?.mapStatus || lot?.status || "").toUpperCase())}
                title={
                  !["PREPARING", "MAP_DENIED"].includes((lot?.mapStatus || lot?.status || "").toUpperCase())
                    ? `Map editing is locked. Current status: ${lot?.mapStatus || lot?.status}. Only available in PREPARING or MAP_DENIED status.`
                    : "Open map editor"
                }
                className={`px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  ["PREPARING", "MAP_DENIED"].includes((lot?.mapStatus || lot?.status || "").toUpperCase())
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                }`}
              >
                🗺️ Draw Map
              </button>
            )}
            <button
              onClick={handleClose}
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
              {pendingStatus === "MAP_DENIED"
                ? "🚫 Enter Reason for Map Denial"
                : "🚫 Enter Reason for Rejection"}
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

      {/* Edit Pricing Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[600px] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">
              ✏️ Edit Pricing Rule
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={ruleForm.ruleName}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, ruleName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={ruleForm.vehicleType}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, vehicleType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="CAR_UP_TO_9_SEATS">🚗 Car (≤9 seats)</option>
                    <option value="MOTORBIKE">🏍️ Motorbike</option>
                    <option value="BIKE">🚲 Bike</option>
                    <option value="OTHER">📦 Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Charge (₫)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.initialCharge}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, initialCharge: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.initialDurationMinute}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        initialDurationMinute: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Rate (₫)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.stepRate}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, stepRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Minute (Minutes)
                  </label>
                  <input
                    type="number"
                    value={ruleForm.stepMinute}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, stepMinute: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="datetime-local"
                    value={ruleForm.validFrom}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, validFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid To
                  </label>
                  <input
                    type="datetime-local"
                    value={ruleForm.validTo}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, validTo: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.isActive}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelEditRule}
                className="px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveRule}
                className="px-4 py-2 rounded-md text-sm bg-green-500 text-white hover:bg-green-600"
              >
                💾 Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      <ConfirmModal
        open={confirmResetOpen}
        title="Confirm Reset Map"
        message="Are you sure you want to reset the map? This will delete all floors, areas and spots for this parking lot."
        onConfirm={doReset}
        onCancel={() => setConfirmResetOpen(false)}
        loading={resetLoading}
        confirmLabel="Reset"
      />

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
