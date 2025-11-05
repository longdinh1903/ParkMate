import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function ViewSubscriptionModal({ subscription, parkingLotName, onClose }) {
  if (!subscription) return null;

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Vehicle type display
  const getVehicleTypeDisplay = (type) => {
    const types = {
      BIKE: "Bicycle",
      MOTORBIKE: "Motorbike",
      CAR_UP_TO_9_SEATS: "Car (Up to 9 seats)",
    };
    return types[type] || type;
  };

  // Duration type display
  const getDurationDisplay = (type) => {
    const durations = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly (3 months)",
      YEARLY: "Yearly (12 months)",
    };
    return durations[type] || type;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden animate-fadeInScale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <i className="ri-file-list-3-line text-indigo-600"></i>
            Subscription Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white rounded-full"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <i className="ri-information-line"></i>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Package Name</p>
                  <p className="font-semibold text-gray-900">{subscription.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      subscription.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {subscription.isActive ? "● Active" : "○ Inactive"}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Vehicle Type</p>
                  <p className="font-semibold text-gray-900">
                    {getVehicleTypeDisplay(subscription.vehicleType)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Duration Type</p>
                  <p className="font-semibold text-gray-900">
                    {getDurationDisplay(subscription.durationType)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Parking Lot</p>
                  <p className="font-semibold text-indigo-600 flex items-center gap-1">
                    <i className="ri-map-pin-2-fill"></i>
                    {parkingLotName || `Lot ID: ${subscription.lotId}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <i className="ri-money-dollar-circle-line"></i>
                Pricing
              </h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-600">
                  {formatPrice(subscription.price)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  per {subscription.durationType?.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-file-text-line"></i>
                Description
              </h3>
              <div className="text-gray-700 text-sm whitespace-pre-wrap max-h-[4.5rem] overflow-y-auto custom-scrollbar pr-2">
                {subscription.description || "No description provided."}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <i className="ri-time-line"></i>
                Timestamps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Created At</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(subscription.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(subscription.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
