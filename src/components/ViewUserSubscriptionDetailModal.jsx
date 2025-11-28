import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import subscriptionApi from "../api/subscriptionApi";
import vehicleApi from "../api/vehicleApi";
import parkingLotApi from "../api/parkingLotApi";
import spotApi from "../api/spotApi";
import adminApi from "../api/adminApi";
import toast from "react-hot-toast";

export default function ViewUserSubscriptionDetailModal({
  userSubscription,
  onClose,
}) {
  const [data, setData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [subscriptionPackage, setSubscriptionPackage] = useState(null);
  const [parkingLot, setParkingLot] = useState(null);
  const [assignedSpot, setAssignedSpot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!userSubscription?.id) return;

      try {
        setLoading(true);
        const response = await subscriptionApi.getUserSubscriptionById(
          userSubscription.id
        );
        const detailData = response?.data?.data;

        if (detailData) {
          setData(detailData);

          // Fetch all related data in parallel
          const promises = [];

          // Fetch user details if userId exists
          if (detailData.userId) {
            promises.push(
              adminApi
                .getUserById(detailData.userId)
                .then((res) => setUserData(res?.data?.data))
                .catch((err) => console.error("Error fetching user:", err))
            );
          }

          // Fetch vehicle details if vehicleId exists
          if (detailData.vehicleId) {
            promises.push(
              vehicleApi
                .getById(detailData.vehicleId)
                .then((res) => setVehicleData(res?.data?.data))
                .catch((err) => console.error("Error fetching vehicle:", err))
            );
          }

          // Fetch subscription package details
          if (detailData.subscriptionPackageId) {
            promises.push(
              subscriptionApi
                .getById(detailData.subscriptionPackageId)
                .then((res) => setSubscriptionPackage(res?.data?.data))
                .catch((err) =>
                  console.error("Error fetching subscription package:", err)
                )
            );
          }

          // Fetch parking lot details
          if (detailData.parkingLotId) {
            promises.push(
              parkingLotApi
                .getById(detailData.parkingLotId)
                .then((res) => setParkingLot(res?.data?.data))
                .catch((err) =>
                  console.error("Error fetching parking lot:", err)
                )
            );
          }

          // Fetch assigned spot details
          if (detailData.assignedSpotId) {
            promises.push(
              spotApi
                .getById(detailData.assignedSpotId)
                .then((res) => setAssignedSpot(res?.data?.data))
                .catch((err) => console.error("Error fetching spot:", err))
            );
          }

          // Wait for all promises to complete
          await Promise.all(promises);
        } else {
          toast.error("Failed to load subscription details");
        }
      } catch (error) {
        console.error("Error fetching user subscription detail:", error);
        toast.error("Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [userSubscription?.id]);
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Active" },
      EXPIRED: { bg: "bg-red-100", text: "text-red-800", label: "Expired" },
      CANCELLED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Cancelled",
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
    };
    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const InfoRow = ({ label, value, children }) => (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">{label}</span>
      <div className="text-gray-800 w-2/3 break-words text-right">
        {value !== undefined && value !== null ? value : children || <span className="text-gray-400 italic">N/A</span>}
      </div>
    </div>
  );

  const user = userData || data?.user || userSubscription?.user;
  const displayData = data || userSubscription;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10  h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-user-3-line text-2xl" aria-hidden="true"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">User Subscription Details</h2>
              <p className="text-sm text-indigo-100">Subscription overview and related information</p>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-3">Loading details...</p>
            </div>
          ) : (
            <>
              {/* User Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                  <i className="ri-user-3-line text-indigo-500"></i>
                  User Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start gap-6">
                    <img
                      src={
                        user?.profilePicturePresignedUrl ||
                        user?.profilePictureUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user?.fullName || "User"
                        )}&background=6366f1&color=fff&bold=true&size=128`
                      }
                      alt={user?.fullName || "User"}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=User&background=94a3b8&color=fff&bold=true&size=128`;
                      }}
                    />
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                        <p className="font-bold text-gray-900 text-lg">
                          {user?.fullName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">
                          {user?.phone || "-"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-900">
                          {user?.account?.email || user?.email || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                  <i className="ri-file-list-3-line text-indigo-500"></i>
                  Subscription Details
                </h3>
                <div className="space-y-1">
                  <InfoRow label="Package" value={subscriptionPackage?.name || "-"} />
                  <InfoRow label="Parking Lot" value={parkingLot?.name || "-"} />
                  <InfoRow label="Status">{getStatusBadge(displayData?.status)}</InfoRow>
                </div>
              </div>

              {/* Vehicle Information Section */}
              {(displayData?.vehicleId || vehicleData) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                    <i className="ri-car-fill text-indigo-500"></i>
                    Vehicle Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow label="License Plate" value={vehicleData?.licensePlate || displayData?.vehicleLicensePlate || "-"} />
                    <InfoRow label="Vehicle Type" value={vehicleData?.type === 1 ? "Motorcycle" : vehicleData?.type === 2 ? "Car" : vehicleData?.type === 3 ? "Van/Truck" : displayData?.vehicleType || "-"} />
                    {vehicleData?.brand && <InfoRow label="Brand" value={vehicleData.brand} />}
                    {vehicleData?.model && <InfoRow label="Model" value={vehicleData.model} />}
                    {vehicleData?.color && <InfoRow label="Color" value={vehicleData.color} />}
                  </div>
                </div>
              )}

              {/* Parking Spot Information Section */}
              {(displayData?.assignedSpotId || assignedSpot) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    🅿️ Assigned Parking Spot
                  </h3>
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-indigo-600 mb-1">
                          Spot Name
                        </p>
                        <p className="font-bold text-gray-900 text-2xl">
                          {assignedSpot?.name ||
                            displayData?.assignedSpotName ||
                            "Loading..."}
                        </p>
                      </div>
                      {assignedSpot?.status && (
                        <div>
                          <p className="text-sm text-indigo-600 mb-1">
                            Spot Status
                          </p>
                          <p className="font-medium text-gray-900 text-lg">
                            {assignedSpot.status === "AVAILABLE"
                              ? "🟢 Available"
                              : assignedSpot.status === "OCCUPIED"
                              ? "🔴 Occupied"
                              : assignedSpot.status === "RESERVED"
                              ? "🟡 Reserved"
                              : assignedSpot.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates & Timeline Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                  <i className="ri-time-fill text-indigo-500"></i>
                  Timeline
                </h3>
                <div className="space-y-1">
                  <InfoRow label="Created At" value={formatDate(displayData?.createdAt)} />
                  <InfoRow label="Start Date" value={formatDate(displayData?.startDate)} />
                  <InfoRow label="End Date" value={formatDate(displayData?.endDate)} />
                  <InfoRow label="Last Updated" value={formatDate(displayData?.updatedAt)} />
                </div>
              </div>

              {/* Payment Information Section */}
              {displayData?.paidAmount !== undefined && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                    <i className="ri-money-dollar-circle-fill text-indigo-500"></i>
                    Payment Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow label="Paid Amount">
                      <span className="text-lg font-bold text-green-600">{formatCurrency(displayData?.paidAmount)}</span>
                    </InfoRow>
                    {displayData?.paymentTransactionId && <InfoRow label="Transaction ID" value={displayData?.paymentTransactionId} />}
                  </div>
                </div>
              )}

              {/* Auto Renew & Additional Info */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-600 mb-3 border-b-2 border-indigo-100 pb-1 flex items-center gap-2">
                  <i className="ri-settings-3-line text-indigo-500"></i>
                  Additional Information
                </h3>
                <div className="space-y-1">
                  <InfoRow label="Auto Renew">{displayData?.autoRenew ? <span className="text-green-600">✓ Enabled</span> : <span className="text-red-600">✗ Disabled</span>}</InfoRow>
                  {displayData?.cancellationReason && <InfoRow label="Cancellation Reason" value={displayData?.cancellationReason} />}
                </div>
              </div>
            </>
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
