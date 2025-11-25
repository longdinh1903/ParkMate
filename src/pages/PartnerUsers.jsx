import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import subscriptionApi from "../api/subscriptionApi";
import parkingLotApi from "../api/parkingLotApi";
import adminApi from "../api/adminApi";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import ViewUserSubscriptionDetailModal from "../components/ViewUserSubscriptionDetailModal";

export default function PartnerUsers() {
  const [searchParams] = useSearchParams();
  const subscriptionIdFromUrl = searchParams.get("subscriptionId"); // Get subscriptionId from URL
  const lotIdFromUrl = searchParams.get("lotId"); // Get lotId from URL

  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [parkingLotsMap, setParkingLotsMap] = useState({});
  const [subscriptionPackagesMap, setSubscriptionPackagesMap] = useState({});
  const [userCache, setUserCache] = useState({}); // Cache user details
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubscriptionPackage, setFilterSubscriptionPackage] =
    useState("");
  const [filterParkingLot, setFilterParkingLot] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination state
  const [page, setPage] = useState(0);
  const [size] = useState(6); // 6 items per page
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
  });

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUserSubscription, setSelectedUserSubscription] =
    useState(null);

  // Fetch partner's parking lots to get lot IDs and build map
  const fetchPartnerParkingLots = async () => {
    try {
      const response = await parkingLotApi.getAllByPartner();
      const payload = response?.data?.data;
      if (payload) {
        const lots = payload.content || payload;
        const lotIds = Array.isArray(lots) ? lots.map((lot) => lot.id) : [];

        // Build parking lots map
        const lotsMap = {};
        lots.forEach((lot) => {
          lotsMap[lot.id] = lot;
        });
        setParkingLotsMap(lotsMap);

        return lotIds;
      }
      return [];
    } catch {
      toast.error("Failed to load parking lots");
      return [];
    }
  };
  
  // Fetch all subscription packages from partner's parking lots
  const fetchPartnerSubscriptions = async (lotIds) => {
    try {
      // Lấy tất cả subscription packages của partner (dùng ownedByMe=true)
      const response = await subscriptionApi.getAll(
        { page: 0, size: 1000 },
        { ownedByMe: true }
      );
      const packages = response?.data?.data?.content || response?.data?.data || [];
      
      // Filter chỉ lấy packages thuộc về parking lots của partner
      const partnerPackages = packages.filter(pkg => 
        pkg.lotId && lotIds.includes(pkg.lotId)
      );
      
      // Build map
      const packagesMap = {};
      const allPackageIds = [];
      partnerPackages.forEach(pkg => {
        if (pkg.id) {
          packagesMap[pkg.id] = pkg;
          allPackageIds.push(pkg.id);
        }
      });
      
      setSubscriptionPackagesMap(packagesMap);
      return allPackageIds;
    } catch {
      toast.error("Failed to load subscription packages");
      return [];
    }
  };

  // Fetch all user subscriptions
  const fetchUserSubscriptions = useCallback(
    async (lotIds = [], packageIds = []) => {
      try {
        setLoading(true);

        if (lotIds.length === 0 || packageIds.length === 0) {
          setUserSubscriptions([]);
          setPagination({ totalPages: 0, totalElements: 0 });
          setLoading(false);
          return;
        }

        // Fetch subscriptions for ALL combinations of lots x packages
        const allPromises = [];
        lotIds.forEach(lotId => {
          packageIds.forEach(packageId => {
            const queryParams = {
              page: 0,
              size: size,
              sortBy: sortBy,
              sortOrder: sortOrder === "asc" ? "ASC" : "DESC",
              parkingLotId: lotId,
              subscriptionPackageId: packageId,
            };
            allPromises.push(
              subscriptionApi.getAllUserSubscriptions(queryParams)
                .then(res => res?.data?.data?.content || [])
                .catch(() => [])
            );
          });
        });

        // Wait for all API calls
        const allResults = await Promise.all(allPromises);
        const allData = allResults.flat();

        // Build parking lots map from subscription data
        const lotsMap = { ...parkingLotsMap };
        allData.forEach((sub) => {
          if (sub.parkingLotId && sub.lotName && !lotsMap[sub.parkingLotId]) {
            lotsMap[sub.parkingLotId] = {
              id: sub.parkingLotId,
              name: sub.lotName,
            };
          }
        });
        if (Object.keys(lotsMap).length > Object.keys(parkingLotsMap).length) {
          setParkingLotsMap(lotsMap);
        }

        // Fetch user details for ALL subscriptions
        const subscriptionsWithUsers = await Promise.all(
          allData.map(async (sub) => {
            if (!sub.userId) return sub;
            
            if (userCache[sub.userId]) {
              return { ...sub, user: userCache[sub.userId] };
            }

            try {
              const userResponse = await adminApi.getUserById(sub.userId);
              const userData = userResponse?.data?.data;
              setUserCache((prev) => ({ ...prev, [sub.userId]: userData }));
              return { ...sub, user: userData };
            } catch {
              return sub;
            }
          })
        );

        setUserSubscriptions(subscriptionsWithUsers);
      } catch {
        toast.error("Failed to load users");
        setUserSubscriptions([]);
      } finally {
        setLoading(false);
      }
    },
    [sortBy, sortOrder, size, userCache]
  );

  // Initial load - fetch parking lots, then packages, then subscriptions
  useEffect(() => {
    const loadData = async () => {
      const lotIds = await fetchPartnerParkingLots();
      if (lotIds.length > 0) {
        const packageIds = await fetchPartnerSubscriptions(lotIds);
        if (packageIds.length > 0) {
          await fetchUserSubscriptions(lotIds, packageIds);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]); // Refetch when sort changes

  // Helper function to refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      const lotIds = await fetchPartnerParkingLots();
      const packageIds = await fetchPartnerSubscriptions(lotIds);
      await fetchUserSubscriptions(lotIds, packageIds);
    } catch {
      toast.error("Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  // Get parking lot name by ID
  const getParkingLotName = (lotId) => {
    const lot = parkingLotsMap[lotId];
    return lot ? lot.name : "N/A";
  };

  // Get subscription package name by ID
  const getSubscriptionPackageName = (packageId) => {
    const pkg = subscriptionPackagesMap[packageId];
    return pkg ? pkg.name : "N/A";
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const colors = {
      PENDING_PAYMENT: "bg-orange-100 text-orange-800",
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      EXPIRED: "bg-red-100 text-red-800",
      CANCELLED: "bg-slate-100 text-slate-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Client-side filtering and pagination
  const filteredUserSubscriptions = useMemo(() => {
    let filtered = userSubscriptions;

    // Apply URL filters first
    if (subscriptionIdFromUrl) {
      filtered = filtered.filter(
        (sub) => sub.subscriptionPackageId === parseInt(subscriptionIdFromUrl)
      );
    }

    if (lotIdFromUrl) {
      filtered = filtered.filter(
        (sub) => sub.parkingLotId === parseInt(lotIdFromUrl)
      );
    }

    // Apply dropdown filters
    if (filterSubscriptionPackage) {
      filtered = filtered.filter(
        (sub) =>
          sub.subscriptionPackageId === parseInt(filterSubscriptionPackage)
      );
    }

    if (filterParkingLot) {
      filtered = filtered.filter(
        (sub) => sub.parkingLotId === parseInt(filterParkingLot)
      );
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      filtered = filtered.filter((sub) => {
        const user = sub.user;
        const lotName = parkingLotsMap[sub.parkingLotId]?.name || "";
        const packageName =
          subscriptionPackagesMap[sub.subscriptionPackageId]?.name || "";

        return (
          user?.fullName?.toLowerCase().includes(keyword) ||
          user?.account?.email?.toLowerCase().includes(keyword) ||
          user?.email?.toLowerCase().includes(keyword) ||
          user?.phone?.toLowerCase().includes(keyword) ||
          sub.vehicleLicensePlate?.toLowerCase().includes(keyword) ||
          lotName.toLowerCase().includes(keyword) ||
          packageName.toLowerCase().includes(keyword)
        );
      });
    }

    // Update pagination
    setPagination({
      totalPages: Math.ceil(filtered.length / size),
      totalElements: filtered.length,
    });

    // Paginate
    const startIdx = page * size;
    const endIdx = startIdx + size;
    return filtered.slice(startIdx, endIdx);
  }, [
    userSubscriptions,
    searchTerm,
    filterSubscriptionPackage,
    filterParkingLot,
    subscriptionIdFromUrl,
    lotIdFromUrl,
    parkingLotsMap,
    subscriptionPackagesMap,
    page,
    size,
  ]);

  return (
    <PartnerTopLayout>
      <div className="fixed inset-0 top-16 bg-gray-50 overflow-hidden">
        <div className="h-full">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
            {/* Header */}
            <div className="pt-6 mb-4 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-1">
                All users who have subscribed to your parking lots
              </p>
              {subscriptionIdFromUrl &&
                subscriptionPackagesMap[subscriptionIdFromUrl] && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                    <i className="ri-filter-3-line"></i>
                    <span className="text-sm font-medium">
                      Filtered by subscription:{" "}
                      <strong>
                        {subscriptionPackagesMap[subscriptionIdFromUrl].name}
                      </strong>
                    </span>
                  </div>
                )}
              {lotIdFromUrl &&
                !subscriptionIdFromUrl &&
                parkingLotsMap[lotIdFromUrl] && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                    <i className="ri-filter-3-line"></i>
                    <span className="text-sm font-medium">
                      Filtered by parking lot:{" "}
                      <strong>{parkingLotsMap[lotIdFromUrl].name}</strong>
                    </span>
                  </div>
                )}
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, vehicle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterSubscriptionPackage("");
                    setFilterParkingLot("");
                    setSortBy("createdAt");
                    setSortOrder("desc");
                    setPage(0);
                    refreshData();
                  }}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i
                    className={`ri-refresh-line ${
                      loading ? "animate-spin" : ""
                    }`}
                  ></i>{" "}
                  Refresh
                </button>

                {/* Filters and Sort */}
                <div className="flex gap-3 items-center flex-wrap">
                  <FunnelIcon className="w-5 h-5 text-gray-500" />

                  {/* Subscription Package Filter */}
                  <select
                    value={filterSubscriptionPackage}
                    onChange={(e) => {
                      setFilterSubscriptionPackage(e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Subscriptions</option>
                    {Object.values(subscriptionPackagesMap).map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>

                  {/* Parking Lot Filter */}
                  <select
                    value={filterParkingLot}
                    onChange={(e) => {
                      setFilterParkingLot(e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Parking Lots</option>
                    {Object.values(parkingLotsMap).map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>

                  {/* Sort Order Button */}
                  <button
                    onClick={() => {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      // Don't reset page - sort on current page
                    }}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? (
                      <>
                        <i className="ri-sort-asc text-lg"></i>
                        <span className="hidden sm:inline">Asc</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-sort-desc text-lg"></i>
                        <span className="hidden sm:inline">Desc</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table - Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredUserSubscriptions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm
                      ? "No users match your search"
                      : "No users found"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    <table className="min-w-full">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Subscription Package
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Parking Lot
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Vehicle
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUserSubscriptions.map((sub, idx) => (
                          <tr
                            key={sub.id || idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
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
                                    )}&background=6366f1&color=fff&bold=true&size=128`
                                  }
                                  alt={sub.user?.fullName || "User"}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://ui-avatars.com/api/?name=User&background=94a3b8&color=fff&bold=true&size=128`;
                                  }}
                                />
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {sub.user?.fullName || "N/A"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {sub.user?.account?.email ||
                                      sub.user?.email ||
                                      "-"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {getSubscriptionPackageName(
                                sub.subscriptionPackageId
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {getParkingLotName(sub.parkingLotId)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-xs text-gray-500 mb-1">
                                  {(() => {
                                    console.log(
                                      "Vehicle Type Value:",
                                      sub.vehicleType,
                                      typeof sub.vehicleType
                                    );
                                    if (
                                      sub.vehicleType === "MOTORBIKE" ||
                                      sub.vehicleType === 1
                                    )
                                      return "🏍️ Motorbike";
                                    if (
                                      sub.vehicleType === "CAR_UP_TO_9_SEATS" ||
                                      sub.vehicleType === 2
                                    )
                                      return "🚗 Car (≤9 seats)";
                                    if (
                                      sub.vehicleType === "BIKE" ||
                                      sub.vehicleType === 3
                                    )
                                      return "🚲 Bike";
                                    if (
                                      sub.vehicleType === "OTHER" ||
                                      sub.vehicleType === 4
                                    )
                                      return "📦 Other";
                                    return `❓ Unknown (${sub.vehicleType})`;
                                  })()}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {sub.vehicleLicensePlate || "-"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div>
                                <p className="text-xs text-gray-500">
                                  From: {formatDate(sub.startDate)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  To: {formatDate(sub.endDate)}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                  sub.status
                                )}`}
                              >
                                {sub.status || "UNKNOWN"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setSelectedUserSubscription(sub);
                                  setShowDetailModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
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

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center py-3 px-6 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-full">
                        <button
                          disabled={page <= 0}
                          onClick={() => setPage((p) => Math.max(p - 1, 0))}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
                        >
                          ← Previous
                        </button>

                        <span className="text-gray-700 text-sm font-medium px-4">
                          Page{" "}
                          <strong className="text-indigo-600">
                            {page + 1}
                          </strong>{" "}
                          of{" "}
                          <strong className="text-indigo-600">
                            {pagination.totalPages}
                          </strong>
                          <span className="text-gray-400 ml-2">
                            ({pagination.totalElements} users)
                          </span>
                        </span>

                        <button
                          disabled={page >= pagination.totalPages - 1}
                          onClick={() => setPage((p) => p + 1)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
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
    </PartnerTopLayout>
  );
}
