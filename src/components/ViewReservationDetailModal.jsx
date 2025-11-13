import React, { useState, useEffect } from "react";
import vehicleApi from "../api/vehicleApi";

export default function ViewReservationDetailModal({ reservation, parkingLotName, onClose }) {
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      console.log("Reservation data:", reservation);
      console.log("Vehicle ID:", reservation?.vehicleId);
      
      if (reservation?.vehicleId) {
        setLoadingVehicle(true);
        try {
          console.log("Fetching vehicle with ID:", reservation.vehicleId);
          const response = await vehicleApi.getById(reservation.vehicleId);
          console.log("Vehicle API response:", response);
          const vehicleInfo = response.data?.data || response.data;
          console.log("Vehicle data extracted:", vehicleInfo);
          setVehicleData(vehicleInfo);
        } catch (error) {
          console.error("Error fetching vehicle:", error);
        } finally {
          setLoadingVehicle(false);
        }
      } else {
        console.log("No vehicleId found in reservation");
      }
    };

    fetchVehicle();
  }, [reservation?.vehicleId]);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20";
      case "CANCELLED":
        return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20";
      default:
        return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/20";
    }
  };

  const getVehicleTypeBadge = (type) => {
    const typeMap = {
      CAR_UP_TO_9_SEATS: { label: "Car (≤9 seats)", color: "bg-blue-100 text-blue-700" },
      MOTORBIKE: { label: "Motorbike", color: "bg-purple-100 text-purple-700" },
      BIKE: { label: "Bike", color: "bg-green-100 text-green-700" },
      OTHER: { label: "Other", color: "bg-gray-100 text-gray-700" },
      1: { label: "Motorbike", color: "bg-purple-100 text-purple-700" },
      2: { label: "Car (≤9 seats)", color: "bg-blue-100 text-blue-700" },
      3: { label: "Bike", color: "bg-green-100 text-green-700" },
      4: { label: "Other", color: "bg-gray-100 text-gray-700" },
    };
    const info = typeMap[type] || { label: type, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  // Helper component for displaying information rows
  const InfoRow = ({ label, value, children }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900 font-semibold text-right">
        {children || value || "-"}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-check-fill text-2xl text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-white">Reservation Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] custom-scrollbar">
          {/* Status Overview */}
          <section className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs text-indigo-600 font-medium mb-2">STATUS</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(reservation.status)}`}>
                {reservation.status || "UNKNOWN"}
              </span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-2">INITIAL FEE</p>
              <p className="text-2xl font-bold text-blue-700">
                {reservation.initialFee ? `${reservation.initialFee.toLocaleString()} ₫` : "-"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-2">TOTAL FEE</p>
              <p className="text-2xl font-bold text-green-700">
                {reservation.totalFee ? `${reservation.totalFee.toLocaleString()} ₫` : "-"}
              </p>
            </div>
          </section>

          {/* QR Code Section */}
          {reservation.qrCode && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-qr-code-fill text-indigo-500"></i>
                QR Code
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex flex-col items-center border border-gray-200">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img 
                    src={reservation.qrCode} 
                    alt="Reservation QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  <i className="ri-information-line mr-1"></i>
                  Scan this QR code for check-in
                </p>
              </div>
            </section>
          )}

          {/* Vehicle Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-car-fill text-indigo-500"></i>
              Vehicle Information
            </h3>
            {loadingVehicle ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading vehicle details...</span>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow label="License Plate">
                  <span className="font-bold text-lg">
                    {vehicleData?.licensePlate || reservation.vehicleLicensePlate || "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Vehicle Type">
                  {getVehicleTypeBadge(vehicleData?.type || reservation.vehicleType)}
                </InfoRow>
                {vehicleData?.vehicleBrand && (
                  <InfoRow label="Brand" value={vehicleData.vehicleBrand} />
                )}
                {vehicleData?.vehicleModel && (
                  <InfoRow label="Model" value={vehicleData.vehicleModel} />
                )}
                {vehicleData?.vehicleColor && (
                  <InfoRow label="Color" value={vehicleData.vehicleColor} />
                )}
                {vehicleData?.description && (
                  <InfoRow label="Description" value={vehicleData.description} />
                )}
              </div>
            )}
          </section>

          {/* Parking Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-parking-box-fill text-indigo-500"></i>
              Parking Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Parking Lot" value={parkingLotName} />
            </div>
          </section>

          {/* Reservation Time */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-time-fill text-indigo-500"></i>
              Reservation Time
            </h3>
            <div className="space-y-1">
              <InfoRow label="Reserved From">
                <span className="text-green-600">{formatDateTime(reservation.reservedFrom)}</span>
              </InfoRow>
              <InfoRow label="Reserved Until">
                <span className="text-red-600">{formatDateTime(reservation.reservedUntil)}</span>
              </InfoRow>
            </div>
          </section>

          {/* System Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-information-fill text-indigo-500"></i>
              System Information
            </h3>
            <div className="space-y-1">
              <InfoRow label="Listing Status">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  reservation.isListed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {reservation.isListed ? "✓ Listed" : "✗ Not Listed"}
                </span>
              </InfoRow>
              <InfoRow label="Created At" value={formatDateTime(reservation.createdAt)} />
              <InfoRow label="Updated At" value={formatDateTime(reservation.updatedAt)} />
            </div>
          </section>

          {/* Additional Data */}
          {reservation.group && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-group-fill text-indigo-500"></i>
                Group Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(reservation.group, null, 2)}
                </pre>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
