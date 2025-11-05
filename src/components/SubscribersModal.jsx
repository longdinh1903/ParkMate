import React, { useState, useEffect } from "react";
import subscriptionApi from "../api/subscriptionApi";
import adminApi from "../api/adminApi";
import toast from "react-hot-toast";
import { XMarkIcon, UserIcon, EyeIcon } from "@heroicons/react/24/outline";
import ViewUserSubscriptionDetailModal from "./ViewUserSubscriptionDetailModal";

export default function SubscribersModal({ subscription, onClose }) {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
  });
  const [selectedUserSubscription, setSelectedUserSubscription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchSubscribers = async () => {
    if (!subscription?.id || !subscription?.lotId) return;
    
    try {
      setLoading(true);
      console.log("=== FETCHING SUBSCRIBERS ===");
      console.log("Subscription Package ID:", subscription.id);
      console.log("Parking Lot ID:", subscription.lotId);
      console.log("Page:", page, "Size:", size);
      
      const queryParams = {
        page,
        size,
      };
      console.log("Query params:", queryParams);
      
      const response = await subscriptionApi.getSubscribers(
        subscription.id,
        subscription.lotId,
        queryParams
      );

      console.log("Subscribers response:", response);
      console.log("Response data content:", response?.data?.data?.content);

      const payload = response?.data?.data;
      if (payload?.content) {
        console.log(`Received ${payload.content.length} subscribers from API`);
        console.log("Content data:", payload.content);
        
        // Fetch user details for each subscriber
        const subscribersWithUsers = await Promise.all(
          payload.content.map(async (sub) => {
            if (sub.userId && !sub.user) {
              try {
                const userResponse = await adminApi.getUserById(sub.userId);
                return { ...sub, user: userResponse?.data?.data };
              } catch (error) {
                console.error(`Error fetching user ${sub.userId}:`, error);
                return sub;
              }
            }
            return sub;
          })
        );
        
        setSubscribers(subscribersWithUsers);
        setPagination({
          totalPages: payload.totalPages || 0,
          totalElements: payload.totalElements || 0,
        });
      } else {
        setSubscribers([]);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, subscription?.id, subscription?.lotId]);

  const handleViewDetail = (userSubscription) => {
    setSelectedUserSubscription(userSubscription);
    setShowDetailModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col ${showDetailModal ? 'invisible' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Subscribers
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Users who purchased "{subscription?.name}" (Package ID: {subscription?.id})
            </p>
          </div>
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
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-3">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserIcon className="w-16 h-16 text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg">No subscribers yet</p>
              <p className="text-gray-400 text-sm mt-1">
                This subscription package hasn't been purchased by any users.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-blue-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((sub, idx) => (
                    <tr key={sub.id || idx} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {page * size + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              sub.user?.profilePicturePresignedUrl ||
                              sub.user?.profilePictureUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                sub.user?.fullName || "User"
                              )}&background=3B82F6&color=fff&bold=true&size=128`
                            }
                            alt={sub.user?.fullName || "User"}
                            className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=User&background=94a3b8&color=fff&bold=true&size=128`;
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900 text-base">
                              {sub.user?.fullName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {sub.user?.account?.email || sub.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">{sub.vehicleLicensePlate || "-"}</p>
                          <p className="text-xs text-gray-500">
                            {sub.vehicleType === 1 ? "🏍️ Motorcycle" :
                             sub.vehicleType === 2 ? "🚗 Car" :
                             sub.vehicleType === 3 ? "🚐 Van/Truck" : "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sub.startDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(sub.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : sub.status === "EXPIRED"
                              ? "bg-red-100 text-red-800"
                              : sub.status === "CANCELLED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {sub.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetail(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        {!loading && subscribers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="text-sm text-gray-600">
              Showing <strong>{page * size + 1}</strong> to{" "}
              <strong>{Math.min((page + 1) * size, pagination.totalElements)}</strong> of{" "}
              <strong>{pagination.totalElements}</strong> subscribers
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages - 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUserSubscription && (
        <ViewUserSubscriptionDetailModal
          userSubscription={selectedUserSubscription}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUserSubscription(null);
          }}
        />
      )}
    </div>
  );
}
