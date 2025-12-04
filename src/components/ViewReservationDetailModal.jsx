import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import vehicleApi from "../api/vehicleApi";

export default function ViewReservationDetailModal({
  reservation,
  parkingLotName,
  onClose,
}) {
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
      CAR_UP_TO_9_SEATS: {
        label: "Ôtô (≤9 chỗ)",
        color: "bg-blue-100 text-blue-700",
      },
      MOTORBIKE: { label: "Xe máy", color: "bg-purple-100 text-purple-700" },
      BIKE: { label: "Xe đạp", color: "bg-green-100 text-green-700" },
      OTHER: { label: "Khác", color: "bg-gray-100 text-gray-700" },
      1: { label: "Xe máy", color: "bg-purple-100 text-purple-700" },
      2: { label: "Ôtô (≤9 chỗ)", color: "bg-blue-100 text-blue-700" },
      3: { label: "Xe đạp", color: "bg-green-100 text-green-700" },
      4: { label: "Khác", color: "bg-gray-100 text-gray-700" },
    };
    const info = typeMap[type] || {
      label: type,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}
      >
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
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-check-fill text-2xl text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-white">
              Chi tiết đặt chỗ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white hover:bg-white/20 transition-colors duration-200 cursor-pointer"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status Overview */}
          <section className="mb-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
              <p className="text-xs text-indigo-600 font-medium mb-2">Trạng thái</p>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
                  reservation.status
                )}`}
              >
                {reservation.status === "PENDING" ? "Chờ xử lý" :
                 reservation.status === "ACTIVE" ? "Đang hoạt động" :
                 reservation.status === "COMPLETED" ? "Hoàn thành" :
                 reservation.status === "EXPIRED" ? "Hết hạn" :
                 reservation.status === "CANCELLED" ? "Đã hủy" : reservation.status || "KHÔNG XÁC ĐỊNH"}
              </span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-2">
                Phí ban đầu
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {reservation.initialFee
                  ? `${reservation.initialFee.toLocaleString()} ₫`
                  : "-"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-2">
                Tổng phí
              </p>
              <p className="text-2xl font-bold text-green-700">
                {reservation.totalFee
                  ? `${reservation.totalFee.toLocaleString()} ₫`
                  : "-"}
              </p>
            </div>
          </section>

          {/* QR Code Section */}
          {reservation.qrCode && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-qr-code-fill text-indigo-500"></i>
                Mã QR
              </h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex flex-col items-center border border-gray-200">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <img
                    src={reservation.qrCode}
                    alt="Mã QR Đặt Chỗ"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-3 text-center">
                  <i className="ri-information-line mr-1"></i>
                  Quét mã QR này để làm thủ tục vào
                </p>
              </div>
            </section>
          )}

          {/* Vehicle Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-car-fill text-indigo-500"></i>
              Thông tin phương tiện
            </h3>
            {loadingVehicle ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">
                  Đang tải thông tin phương tiện...
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <InfoRow label="Biển số xe">
                  <span className="font-bold text-lg">
                    {vehicleData?.licensePlate ||
                      reservation.vehicleLicensePlate ||
                      "-"}
                  </span>
                </InfoRow>
                <InfoRow label="Loại xe">
                  {getVehicleTypeBadge(
                    vehicleData?.type || reservation.vehicleType
                  )}
                </InfoRow>
                {vehicleData?.vehicleBrand && (
                  <InfoRow label="Hãng xe" value={vehicleData.vehicleBrand} />
                )}
                {vehicleData?.vehicleModel && (
                  <InfoRow label="Mẫu xe" value={vehicleData.vehicleModel} />
                )}
                {vehicleData?.vehicleColor && (
                  <InfoRow label="Màu xe" value={vehicleData.vehicleColor} />
                )}
                {vehicleData?.description && (
                  <InfoRow
                    label="Mô tả"
                    value={vehicleData.description}
                  />
                )}
              </div>
            )}
          </section>

          {/* Parking Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-parking-box-fill text-indigo-500"></i>
              Thông tin bãi xe
            </h3>
            <div className="space-y-1">
              <InfoRow label="Bãi xe" value={parkingLotName} />
            </div>
          </section>

          {/* Reservation Time */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-time-fill text-indigo-500"></i>
              Thời gian đặt chỗ
            </h3>
            <div className="space-y-1">
              <InfoRow label="Từ">
                <span className="text-green-600">
                  {formatDateTime(reservation.reservedFrom)}
                </span>
              </InfoRow>
              <InfoRow label="Đến">
                <span className="text-red-600">
                  {formatDateTime(reservation.reservedUntil)}
                </span>
              </InfoRow>
            </div>
          </section>

          {/* System Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
              <i className="ri-information-fill text-indigo-500"></i>
              Thông tin hệ thống
            </h3>
            <div className="space-y-1">
              <InfoRow label="Trạng thái niêm yết">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    reservation.isListed
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {reservation.isListed ? "✓ Đã niêm yết" : "✗ Chưa niêm yết"}
                </span>
              </InfoRow>
              <InfoRow
                label="Ngày tạo"
                value={formatDateTime(reservation.createdAt)}
              />
              <InfoRow
                label="Cập nhật lần cuối"
                value={formatDateTime(reservation.updatedAt)}
              />
            </div>
          </section>

          {/* Additional Data */}
          {reservation.group && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                <i className="ri-group-fill text-indigo-500"></i>
                Thông tin nhóm
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(reservation.group, null, 2)}
                </pre>
              </div>
            </section>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
