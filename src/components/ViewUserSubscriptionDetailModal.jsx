import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import subscriptionApi from "../api/subscriptionApi";
import vehicleApi from "../api/vehicleApi";
import parkingLotApi from "../api/parkingLotApi";
import spotApi from "../api/spotApi";
import adminApi from "../api/adminApi";
import toast from "react-hot-toast";

export default function ViewUserSubscriptionDetailModal({ userSubscription, onClose }) {
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
        const response = await subscriptionApi.getUserSubscriptionById(userSubscription.id);
        const detailData = response?.data?.data;
        
        if (detailData) {
          setData(detailData);
          
          // Fetch all related data in parallel
          const promises = [];
          
          // Fetch user details if userId exists
          if (detailData.userId) {
            promises.push(
              adminApi.getUserById(detailData.userId)
                .then(res => setUserData(res?.data?.data))
                .catch(err => console.error("Error fetching user:", err))
            );
          }
          
          // Fetch vehicle details if vehicleId exists
          if (detailData.vehicleId) {
            promises.push(
              vehicleApi.getById(detailData.vehicleId)
                .then(res => setVehicleData(res?.data?.data))
                .catch(err => console.error("Error fetching vehicle:", err))
            );
          }
          
          // Fetch subscription package details
          if (detailData.subscriptionPackageId) {
            promises.push(
              subscriptionApi.getById(detailData.subscriptionPackageId)
                .then(res => setSubscriptionPackage(res?.data?.data))
                .catch(err => console.error("Error fetching subscription package:", err))
            );
          }
          
          // Fetch parking lot details
          if (detailData.parkingLotId) {
            promises.push(
              parkingLotApi.getById(detailData.parkingLotId)
                .then(res => setParkingLot(res?.data?.data))
                .catch(err => console.error("Error fetching parking lot:", err))
            );
          }
          
          // Fetch assigned spot details
          if (detailData.assignedSpotId) {
            promises.push(
              spotApi.getById(detailData.assignedSpotId)
                .then(res => setAssignedSpot(res?.data?.data))
                .catch(err => console.error("Error fetching spot:", err))
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
      CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", label: "Cancelled" },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    };
    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const user = userData || data?.user || userSubscription?.user;
  const displayData = data || userSubscription;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
          <h2 className="text-xl font-bold text-indigo-700">User Subscription Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-3">Loading details...</p>
            </div>
          ) : (
            <>
              {/* User Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  👤 User Information
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
                        <p className="font-bold text-gray-900 text-lg">{user?.fullName || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <p className="font-medium text-gray-900">{user?.phone || "-"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-900">{user?.account?.email || user?.email || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📋 Subscription Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 mb-1">Package</p>
                    <p className="font-bold text-gray-900 text-xl">{subscriptionPackage?.name || "Loading..."}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Parking Lot</p>
                    <p className="font-bold text-gray-900 text-xl">{parkingLot?.name || "Loading..."}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 col-span-2">
                    <p className="text-sm text-orange-600 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(displayData?.status)}</div>
                  </div>
                </div>
              </div>

              {/* Vehicle Information Section */}
              {(displayData?.vehicleId || vehicleData) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    🚗 Vehicle Information
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">License Plate</p>
                        <p className="font-bold text-gray-900 text-2xl">
                          {vehicleData?.licensePlate || displayData?.vehicleLicensePlate || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Vehicle Type</p>
                        <p className="font-medium text-gray-900 text-lg">
                          {vehicleData?.type === 1 ? "🏍️ Motorcycle" : 
                           vehicleData?.type === 2 ? "🚗 Car (4-9 seats)" :
                           vehicleData?.type === 3 ? "🚐 Van/Truck (>9 seats)" :
                           displayData?.vehicleType === 1 ? "🏍️ Motorcycle" :
                           displayData?.vehicleType === 2 ? "🚗 Car (4-9 seats)" :
                           displayData?.vehicleType === 3 ? "🚐 Van/Truck (>9 seats)" :
                           "-"}
                        </p>
                      </div>
                      {vehicleData?.brand && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Brand</p>
                          <p className="font-medium text-gray-900">{vehicleData.brand}</p>
                        </div>
                      )}
                      {vehicleData?.model && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Model</p>
                          <p className="font-medium text-gray-900">{vehicleData.model}</p>
                        </div>
                      )}
                      {vehicleData?.color && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Color</p>
                          <p className="font-medium text-gray-900">{vehicleData.color}</p>
                        </div>
                      )}
                    </div>
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
                        <p className="text-sm text-indigo-600 mb-1">Spot Name</p>
                        <p className="font-bold text-gray-900 text-2xl">{assignedSpot?.name || displayData?.assignedSpotName || "Loading..."}</p>
                      </div>
                      {assignedSpot?.status && (
                        <div>
                          <p className="text-sm text-indigo-600 mb-1">Spot Status</p>
                          <p className="font-medium text-gray-900 text-lg">
                            {assignedSpot.status === "AVAILABLE" ? "🟢 Available" :
                             assignedSpot.status === "OCCUPIED" ? "🔴 Occupied" :
                             assignedSpot.status === "RESERVED" ? "🟡 Reserved" :
                             assignedSpot.status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Dates & Timeline Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📅 Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-700">Created At</span>
                    <span className="text-sm text-gray-900">{formatDate(displayData?.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-700">Start Date</span>
                    <span className="text-sm text-gray-900">{formatDate(displayData?.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-700">End Date</span>
                    <span className="text-sm text-gray-900">{formatDate(displayData?.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Last Updated</span>
                    <span className="text-sm text-gray-900">{formatDate(displayData?.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              {displayData?.paidAmount !== undefined && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    💰 Payment Information
                  </h3>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-green-600 mb-1">Paid Amount</p>
                        <p className="font-bold text-2xl text-green-700">{formatCurrency(displayData?.paidAmount)}</p>
                      </div>
                      {displayData?.paymentTransactionId && (
                        <div>
                          <p className="text-sm text-green-600 mb-1">Transaction ID</p>
                          <p className="font-medium text-gray-900">{displayData?.paymentTransactionId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Auto Renew & Additional Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  ⚙️ Additional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Auto Renew</p>
                    <p className="font-semibold text-gray-900">
                      {displayData?.autoRenew ? (
                        <span className="text-green-600">✓ Enabled</span>
                      ) : (
                        <span className="text-red-600">✗ Disabled</span>
                      )}
                    </p>
                  </div>
                  {displayData?.cancellationReason && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600 mb-1">Cancellation Reason</p>
                      <p className="font-medium text-gray-900">{displayData?.cancellationReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
