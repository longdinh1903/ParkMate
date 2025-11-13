import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import pricingRuleApi from "../api/pricingRuleApi";

export default function ViewSessionDetailModal({ session, parkingLotName, onClose }) {
  const [pricingRule, setPricingRule] = useState(null);
  const [loadingPricingRule, setLoadingPricingRule] = useState(false);

  useEffect(() => {
    const fetchPricingRule = async () => {
      if (session?.pricingRuleId) {
        setLoadingPricingRule(true);
        try {
          const response = await pricingRuleApi.getById(session.pricingRuleId);
          // API trả về { success, message, data: {...} }
          setPricingRule(response.data.data || response.data);
        } catch (error) {
          console.error("Error fetching pricing rule:", error);
        } finally {
          setLoadingPricingRule(false);
        }
      }
    };

    fetchPricingRule();
  }, [session?.pricingRuleId]);

  if (!session) return null;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (entryTime, exitTime) => {
    if (!entryTime) return "-";
    const start = new Date(entryTime);
    const end = exitTime ? new Date(exitTime) : new Date();
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 ring-green-600/20";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 ring-blue-600/20";
      case "SYNCED":
        return "bg-purple-100 text-purple-700 ring-purple-600/20";
      case "CANCELLED":
        return "bg-red-100 text-red-700 ring-red-600/20";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-600/20";
    }
  };

  const getReferenceTypeBadge = (type) => {
    switch (type) {
      case "WALK_IN":
        return { color: "bg-orange-100 text-orange-700 ring-orange-600/20", icon: "🚶", label: "Walk-in" };
      case "RESERVATION":
        return { color: "bg-blue-100 text-blue-700 ring-blue-600/20", icon: "📅", label: "Reservation" };
      case "SUBSCRIPTION":
        return { color: "bg-purple-100 text-purple-700 ring-purple-600/20", icon: "🎫", label: "Subscription" };
      default:
        return { color: "bg-gray-100 text-gray-700 ring-gray-600/20", icon: "❓", label: type };
    }
  };

  const refType = getReferenceTypeBadge(session.referenceType);

  const InfoRow = ({ label, value, children }) => (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">{label}</span>
      <div className="text-gray-800 w-2/3 break-words text-right">
        {value !== undefined && value !== null ? value : children || <span className="text-gray-400 italic">N/A</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-car-line text-2xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Session Details</h2>
              <p className="text-sm text-indigo-100">Parking session information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/20 transition-colors duration-200"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Status & Type Overview */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Status Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <span className="font-medium text-gray-600 block mb-2">Session Status:</span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${getStatusBadge(session.status)}`}>
                  {session.status || "UNKNOWN"}
                </span>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                <span className="font-medium text-gray-600 block mb-2">Session Type:</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${refType.color}`}>
                  {refType.icon} {refType.label}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle & Parking Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-car-fill text-indigo-500"></i>
              Vehicle & Parking Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="License Plate" value={session.licensePlate} />
              <InfoRow label="Parking Lot" value={session.parkingLotName || parkingLotName} />
            </div>
          </section>

          {/* Time Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-time-fill text-indigo-500"></i>
              Time Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Entry Time" value={formatDateTime(session.entryTime)} />
              <InfoRow label="Exit Time" value={formatDateTime(session.exitTime)} />
              <InfoRow label="Duration">
                <span className="font-semibold text-indigo-600">
                  {session.durationMinute ? `${session.durationMinute} min` : calculateDuration(session.entryTime, session.exitTime)}
                </span>
              </InfoRow>
            </div>
          </section>

          {/* Payment Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-money-dollar-circle-fill text-indigo-500"></i>
              Payment Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Total Amount">
                <span className="text-lg font-bold text-green-600">
                  {session.totalAmount ? `${session.totalAmount.toLocaleString()} ₫` : "-"}
                </span>
              </InfoRow>
              {session.paymentMethod && (
                <InfoRow label="Payment Method" value={session.paymentMethod} />
              )}
              {session.syncedPromoId && (
                <InfoRow label="Synced Promo ID" value={session.syncedPromoId} />
              )}
            </div>
          </section>

          {/* Pricing Rule Information */}
          {session.pricingRuleId && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-price-tag-3-fill text-indigo-500"></i>
                Pricing Rule
              </h3>
              {loadingPricingRule ? (
                <div className="p-4 text-center text-gray-500">
                  <i className="ri-loader-4-line animate-spin text-2xl"></i>
                  <p className="mt-2">Loading pricing rule...</p>
                </div>
              ) : pricingRule ? (
                <div className="space-y-1">
                  <InfoRow label="Vehicle Type" value={pricingRule.vehicleType} />
                  <InfoRow label="Rule Name" value={pricingRule.ruleName} />
                  <InfoRow label="Step Minute" value={pricingRule.stepMinute ? `${pricingRule.stepMinute} min` : null} />
                  <InfoRow label="Step Rate">
                    <span className="font-semibold text-blue-600">
                      {pricingRule.stepRate ? `${pricingRule.stepRate.toLocaleString()} ₫` : "-"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Initial Charge">
                    <span className="font-semibold text-green-600">
                      {pricingRule.initialCharge ? `${pricingRule.initialCharge.toLocaleString()} ₫` : "-"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Initial Duration" value={pricingRule.initialDurationMinute ? `${pricingRule.initialDurationMinute} min` : null} />
                  <InfoRow label="Status">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      pricingRule.isActive 
                        ? "bg-green-100 text-green-700 ring-green-600/20" 
                        : "bg-red-100 text-red-700 ring-red-600/20"
                    }`}>
                      {pricingRule.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </InfoRow>
                  <InfoRow label="Valid From" value={formatDateTime(pricingRule.validFrom)} />
                  <InfoRow label="Valid Until" value={formatDateTime(pricingRule.validUntil)} />
                  {pricingRule.syncStatus && (
                    <InfoRow label="Sync Status">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                        pricingRule.syncStatus === "SYNCED" 
                          ? "bg-purple-100 text-purple-700 ring-purple-600/20" 
                          : "bg-yellow-100 text-yellow-700 ring-yellow-600/20"
                      }`}>
                        {pricingRule.syncStatus}
                      </span>
                    </InfoRow>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No pricing rule information available</p>
                </div>
              )}
            </section>
          )}

          {/* Reference Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-links-fill text-indigo-500"></i>
              Reference Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Reference Type">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${refType.color}`}>
                  {refType.icon} {refType.label}
                </span>
              </InfoRow>
            </div>
          </section>

          {/* Sync Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-refresh-fill text-indigo-500"></i>
              System Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Created At" value={formatDateTime(session.createdAt)} />
              <InfoRow label="Updated At" value={formatDateTime(session.updatedAt)} />
            </div>
          </section>

          {/* Note Section */}
          {session.note && (
            <section>
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-sticky-note-fill text-indigo-500"></i>
                Note
              </h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{session.note}</p>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
