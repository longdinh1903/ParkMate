import { useEffect, useState } from "react";
import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import partnerApi from "../api/partnerApi";

export default function ViewDeviceModal({ device, onClose }) {
  const [partnerName, setPartnerName] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadPartner = async () => {
      try {
        if (!device) return; // guard when device is not yet available
        const pid = device?.partnerId || device?.partner?.id;
        if (!pid) return;
        const res = await partnerApi.getByIdPartner(pid);
        const p = res.data?.data || res.data || null;
        if (mounted && p) setPartnerName(p.companyName || p.name || null);
      } catch (err) {
        // intentionally ignore errors (keep variable referenced for linters)
        void err;
      }
    };

    loadPartner();
    return () => (mounted = false);
  }, [device]);

  if (!device) return null;

  const InfoRow = ({ label, value }) => (
    <div className="flex py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 font-medium w-1/3">{label}:</span>
      <span className="text-gray-800 w-2/3">{value || "-"}</span>
    </div>
  );

  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    switch (status) {
      case "PENDING":
        return (
          <span
            className={`${base} bg-yellow-50 text-yellow-700 border-yellow-300`}
          >
            Pending
          </span>
        );
      case "ACTIVE":
        return (
          <span
            className={`${base} bg-green-50 text-green-700 border-green-300`}
          >
            Active
          </span>
        );
      case "OFFLINE":
        return (
          <span className={`${base} bg-gray-50 text-gray-600 border-gray-300`}>
            Offline
          </span>
        );
      case "MAINTENANCE":
        return (
          <span
            className={`${base} bg-orange-50 text-orange-700 border-orange-300`}
          >
            Maintenance
          </span>
        );
      case "FAULTY":
        return (
          <span className={`${base} bg-red-50 text-red-700 border-red-300`}>
            Faulty
          </span>
        );
      case "DEACTIVATED":
        return (
          <span className={`${base} bg-gray-50 text-gray-500 border-gray-300`}>
            Deactivated
          </span>
        );
      default:
        return (
          <span className={`${base} text-gray-500 bg-gray-50 border-gray-300`}>
            {status || "Unknown"}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const partnerLabel =
    partnerName ||
    device.partner?.companyName ||
    device.companyName ||
    device.partnerName ||
    device.partner?.name ||
    (device.partnerId ? `#${device.partnerId}` : "-");

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Device Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Device Status */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3 text-base">
              <CpuChipIcon className="w-5 h-5" />
              Status
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                label="Device Status"
                value={renderStatus(device.status || device.deviceStatus)}
              />
            </div>
          </div>

          {/* Device Information */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3 text-base">
              <CpuChipIcon className="w-5 h-5" />
              Device Information
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow label="Device ID" value={device.deviceId} />
              <InfoRow label="Device Name" value={device.deviceName} />
              <InfoRow label="Partner" value={partnerLabel} />
              <InfoRow label="Device Type" value={device.deviceType} />
              <InfoRow label="Model" value={device.model} />
              <InfoRow label="Serial Number" value={device.serialNumber} />
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3 text-base">
              <CpuChipIcon className="w-5 h-5" />
              Location
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                label="Parking Lot"
                value={device.parkingLot?.name || device.lotName || "-"}
              />
            </div>
          </div>

          {/* System Information */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3 text-base">
              <CpuChipIcon className="w-5 h-5" />
              System Information
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow
                label="Created At"
                value={formatDate(device.createdAt)}
              />
              <InfoRow
                label="Updated At"
                value={formatDate(device.updatedAt)}
              />
              <InfoRow
                label="Last Maintenance"
                value={formatDate(device.lastMaintenanceAt)}
              />
            </div>
          </div>

          {/* Notes */}
          {device.notes && (
            <div className="mb-6">
              <h4 className="flex items-center gap-2 text-orange-700 font-semibold mb-3 text-base">
                <CpuChipIcon className="w-5 h-5" />
                Notes
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {device.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
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
