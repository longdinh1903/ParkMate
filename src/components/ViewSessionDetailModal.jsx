import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import sessionApi from "../api/sessionApi";

export default function ViewSessionDetailModal({ session, parkingLotName, onClose }) {
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionDetail = async () => {
      if (!session?.id) {
        setSessionDetail(session);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await sessionApi.getById(session.id);
        const detail = response.data?.data || response.data;
        console.log("Session detail from API:", detail);
        setSessionDetail(detail);
      } catch (error) {
        console.error("Error fetching session detail:", error);
        // Fallback to original session data if API fails
        setSessionDetail(session);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetail();
  }, [session]);

  if (!session) return null;

  // Use sessionDetail if loaded, otherwise use session
  const displaySession = sessionDetail || session;

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

  const refType = getReferenceTypeBadge(displaySession.referenceType);

  const InfoRow = ({ label, value, children }) => (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">{label}</span>
      <div className="text-gray-800 w-2/3 break-words text-right">
        {value !== undefined && value !== null ? value : children || <span className="text-gray-400 italic">N/A</span>}
      </div>
    </div>
  );

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading session details...</p>
        </div>
      </div>
    );
  }

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
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${getStatusBadge(displaySession.status)}`}>
                  {displaySession.status || "UNKNOWN"}
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
              <InfoRow label="License Plate" value={displaySession.licensePlate} />
              <InfoRow label="Parking Lot" value={displaySession.lotName || parkingLotName} />
            </div>
          </section>

          {/* Time Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-time-fill text-indigo-500"></i>
              Time Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Entry Time" value={formatDateTime(displaySession.entryTime)} />
              <InfoRow label="Exit Time" value={formatDateTime(displaySession.exitTime)} />
              <InfoRow label="Duration">
                <span className="font-semibold text-indigo-600">
                  {displaySession.durationMinute ? `${displaySession.durationMinute} minutes` : calculateDuration(displaySession.entryTime, displaySession.exitTime)}
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
                  {displaySession.totalAmount ? `${displaySession.totalAmount.toLocaleString()} ₫` : "-"}
                </span>
              </InfoRow>
            </div>
          </section>

          {/* Pricing Rule Information */}
          {displaySession.pricingRule && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-price-tag-3-fill text-indigo-500"></i>
                Pricing Rule
              </h3>
              <div className="space-y-1">
                <InfoRow label="Vehicle Type" value={displaySession.pricingRule.vehicleType} />
                <InfoRow label="Rule Name" value={displaySession.pricingRule.ruleName} />
                <InfoRow label="Step Rate">
                  <span className="font-semibold text-blue-600">
                    {displaySession.pricingRule.stepRate ? `${displaySession.pricingRule.stepRate.toLocaleString()} ₫` : "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Step Minute" value={displaySession.pricingRule.stepMinute ? `${displaySession.pricingRule.stepMinute} min` : "-"} />
                <InfoRow label="Initial Charge">
                  <span className="font-semibold text-green-600">
                    {displaySession.pricingRule.initialCharge ? `${displaySession.pricingRule.initialCharge.toLocaleString()} ₫` : "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Initial Duration" value={displaySession.pricingRule.initialDurationMinute ? `${displaySession.pricingRule.initialDurationMinute} min` : "-"} />
                <InfoRow label="Valid From" value={formatDateTime(displaySession.pricingRule.validFrom)} />
                <InfoRow label="Valid Until" value={formatDateTime(displaySession.pricingRule.validUntil)} />
                {displaySession.pricingRule.syncStatus && (
                  <InfoRow label="Sync Status">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      displaySession.pricingRule.syncStatus === "SYNCED" 
                        ? "bg-purple-100 text-purple-700 ring-purple-600/20" 
                        : "bg-yellow-100 text-yellow-700 ring-yellow-600/20"
                    }`}>
                      {displaySession.pricingRule.syncStatus}
                    </span>
                  </InfoRow>
                )}
              </div>
            </section>
          )}

          {/* Override Pricing Rule */}
          {displaySession.overridePricingRule && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-amber-600 mb-3 border-b-2 border-amber-100 pb-1 flex items-center gap-2">
                <i className="ri-price-tag-3-line text-amber-500"></i>
                Override Pricing Rule
              </h3>
              <div className="space-y-1 bg-amber-50 p-4 rounded-lg border border-amber-200">
                <InfoRow label="Rule Name" value={displaySession.overridePricingRule.ruleName} />
                <InfoRow label="Step Rate">
                  <span className="font-semibold text-amber-700">
                    {displaySession.overridePricingRule.stepRate ? `${displaySession.overridePricingRule.stepRate.toLocaleString()} ₫` : "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Step Minute" value={displaySession.overridePricingRule.stepMinute ? `${displaySession.overridePricingRule.stepMinute} min` : "-"} />
                <InfoRow label="Initial Charge">
                  <span className="font-semibold text-amber-700">
                    {displaySession.overridePricingRule.initialCharge ? `${displaySession.overridePricingRule.initialCharge.toLocaleString()} ₫` : "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Initial Duration" value={displaySession.overridePricingRule.initialDurationMinute ? `${displaySession.overridePricingRule.initialDurationMinute} min` : "-"} />
                <InfoRow label="Valid From" value={formatDateTime(displaySession.overridePricingRule.validFrom)} />
                <InfoRow label="Valid Until" value={formatDateTime(displaySession.overridePricingRule.validUntil)} />
              </div>
            </section>
          )}

          {/* Entry Images */}
          {displaySession.entryImage && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-image-fill text-indigo-500"></i>
                Entry Image
              </h3>
              <div className="flex flex-col gap-3">
                <img 
                  src={displaySession.entryImage} 
                  alt="Entry" 
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.open(displaySession.entryImage, '_blank')}
                />
                <a 
                  href={displaySession.entryImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
                >
                  <i className="ri-external-link-line"></i>
                  Open in New Tab
                </a>
              </div>
            </section>
          )}

          {/* Entry Plate Image */}
          {displaySession.entryPlateImage && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-image-fill text-indigo-500"></i>
                Entry License Plate Image
              </h3>
              <div className="flex flex-col gap-3">
                <img 
                  src={displaySession.entryPlateImage} 
                  alt="Entry License Plate" 
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.open(displaySession.entryPlateImage, '_blank')}
                />
                <a 
                  href={displaySession.entryPlateImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
                >
                  <i className="ri-external-link-line"></i>
                  Open in New Tab
                </a>
              </div>
            </section>
          )}

          {/* Exit Images */}
          {displaySession.exitImage && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-image-fill text-indigo-500"></i>
                Exit Image
              </h3>
              <div className="flex flex-col gap-3">
                <img 
                  src={displaySession.exitImage} 
                  alt="Exit" 
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.open(displaySession.exitImage, '_blank')}
                />
                <a 
                  href={displaySession.exitImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
                >
                  <i className="ri-external-link-line"></i>
                  Open in New Tab
                </a>
              </div>
            </section>
          )}

          {/* Plate Images */}
          {displaySession.exitPlateImage && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-image-fill text-indigo-500"></i>
                Exit License Plate Image
              </h3>
              <div className="flex flex-col gap-3">
                <img 
                  src={displaySession.exitPlateImage} 
                  alt="License Plate" 
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => window.open(displaySession.exitPlateImage, '_blank')}
                />
                <a 
                  href={displaySession.exitPlateImage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-fit"
                >
                  <i className="ri-external-link-line"></i>
                  Open in New Tab
                </a>
              </div>
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
          {(displaySession.syncedFromLocal || displaySession.syncedPromoId || displaySession.syncStatus) && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-refresh-fill text-indigo-500"></i>
                Sync Information
              </h3>
              <div className="space-y-1">
                {displaySession.syncedFromLocal && (
                  <InfoRow label="Synced From Local" value={displaySession.syncedFromLocal} />
                )}
                {displaySession.syncedPromoId && (
                  <InfoRow label="Synced Promo ID" value={displaySession.syncedPromoId} />
                )}
                {displaySession.syncStatus && (
                  <InfoRow label="Sync Status">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                      displaySession.syncStatus === "SYNCED" 
                        ? "bg-purple-100 text-purple-700 ring-purple-600/20" 
                        : "bg-yellow-100 text-yellow-700 ring-yellow-600/20"
                    }`}>
                      {displaySession.syncStatus}
                    </span>
                  </InfoRow>
                )}
              </div>
            </section>
          )}

          {/* System Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-information-fill text-indigo-500"></i>
              System Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Created At" value={formatDateTime(displaySession.createdAt)} />
              <InfoRow label="Updated At" value={formatDateTime(displaySession.updatedAt)} />
            </div>
          </section>

          {/* Error Information */}
          {displaySession.error && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-3 border-b-2 border-red-100 pb-1 flex items-center gap-2">
                <i className="ri-error-warning-fill text-red-500"></i>
                Error Information
              </h3>
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 whitespace-pre-wrap">{displaySession.error}</p>
              </div>
            </section>
          )}

          {/* Metadata */}
          {displaySession.meta && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-file-info-fill text-indigo-500"></i>
                Metadata
              </h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(displaySession.meta, null, 2)}
                </pre>
              </div>
            </section>
          )}

          {/* Timestamp */}
          {displaySession.timestamp && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-calendar-fill text-indigo-500"></i>
                Timestamp
              </h3>
              <div className="space-y-1">
                <InfoRow label="Timestamp" value={formatDateTime(displaySession.timestamp)} />
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

