import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import subscriptionApi from "../api/subscriptionApi";
import parkingLotApi from "../api/parkingLotApi";
import toast from "react-hot-toast";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import AddSubscriptionModal from "../components/AddSubscriptionModal";
import EditSubscriptionModal from "../components/EditSubscriptionModal";
import ViewSubscriptionModal from "../components/ViewSubscriptionModal";
import ConfirmModal from "../components/ConfirmModal";

export default function PartnerSubscriptions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lotIdFromUrl = searchParams.get("lotId"); // Get lotId from URL query param
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [parkingLotsMap, setParkingLotsMap] = useState({}); // Changed to object map for easier lookup
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");
  const [filterDurationType, setFilterDurationType] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [size] = useState(6); // 9 items per page (3x3 grid)
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalElements: 0,
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Fetch all subscriptions
  const fetchSubscriptions = useCallback(async (currentPage = 0) => {
    try {
      setLoading(true);
      
      // Query params for pagination and sorting
      const queryParams = {
        page: currentPage,
        size: size,
        sortBy: sortBy,
        sortOrder: sortOrder === "asc" ? "ASC" : "DESC",
      };
      
      // Filter params in request body
      const filterParams = {
        ownedByMe: true, // Get subscriptions for current partner only
      };
      
      // Add lotId filter from URL if present
      if (lotIdFromUrl) {
        filterParams.lotId = lotIdFromUrl;
      }
      
      // Không gửi searchTerm qua API - sẽ filter client-side
      
      // Add vehicle type filter if selected
      if (filterVehicleType) {
        filterParams.vehicleType = filterVehicleType;
      }
      
      // Add duration type filter if selected
      if (filterDurationType) {
        filterParams.durationType = filterDurationType;
      }
      
      const response = await subscriptionApi.getAll(queryParams, filterParams);

      const payload = response?.data?.data;
      const success = response?.data?.success;

      if (!success || !payload) {
        toast.error("Đã có lỗi khi tải các gói đăng ký");
        setSubscriptions([]);
        return;
      }

      if (payload.content !== undefined) {
        setSubscriptions(payload.content);
        setPagination({
          totalPages: payload.totalPages || 0,
          totalElements: payload.totalElements || 0,
        });
      } else {
        // Fallback for non-paginated response
        const data = Array.isArray(payload) ? payload : [];
        setSubscriptions(data);
        setPagination({
          totalPages: 1,
          totalElements: data.length,
        });
      }
    } catch {
      toast.error("Đã có lỗi khi tải các gói đăng ký");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [size, sortBy, sortOrder, filterVehicleType, filterDurationType, lotIdFromUrl]);

  // Fetch parking lots to get names by IDs from subscriptions
  const fetchParkingLotsForSubscriptions = async (subs) => {
    try {
      // Get unique lot IDs from subscriptions
      const lotIds = [
        ...new Set(subs.map((sub) => sub.lotId).filter((id) => id)),
      ];

      // Fetch each parking lot by ID
      const lotsMap = {};
      await Promise.all(
        lotIds.map(async (lotId) => {
          try {
            const response = await parkingLotApi.getById(lotId);
            // Handle different response structures
            if (response.data) {
              if (response.data.name) {
                lotsMap[lotId] = response.data;
              } else if (response.data.data && response.data.data.name) {
                lotsMap[lotId] = response.data.data;
              }
            }
          } catch {
            // Silently fail for individual lot fetches
          }
        })
      );

      setParkingLotsMap(lotsMap);
    } catch {
      // Fail silently if parking lots can't be loaded
    }
  };

  useEffect(() => {
    fetchSubscriptions(page);
  }, [page, sortBy, sortOrder, filterVehicleType, filterDurationType, lotIdFromUrl, fetchSubscriptions]); // searchTerm không cần vì filter client-side

  // Fetch parking lots when subscriptions change
  useEffect(() => {
    if (subscriptions.length > 0) {
      fetchParkingLotsForSubscriptions(subscriptions);
    }
  }, [subscriptions]);

  // Handle delete
  const handleDelete = async () => {
    try {
      await subscriptionApi.delete(selectedSubscription.id);
      toast.success("Đã xóa gói đăng ký thành công!");
      fetchSubscriptions(page);
      setShowDeleteModal(false);
    } catch {
      toast.error("Đã có lỗi khi xóa gói đăng ký");
    }
  };

  // Get parking lot name by ID from map
  const getParkingLotName = (lotId) => {
    const lot = parkingLotsMap[lotId];
    return lot ? lot.name : null;
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Get badge color based on vehicle type
  const getVehicleTypeBadge = (type) => {
    const colors = {
      MOTORBIKE: "bg-green-100 text-green-800",
      CAR_UP_TO_9_SEATS: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Get badge color based on duration type
  const getDurationBadge = (type) => {
    const colors = {
      MONTHLY: "bg-orange-100 text-orange-800",
      QUARTERLY: "bg-teal-100 text-teal-800",
      YEARLY: "bg-indigo-100 text-indigo-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // Format vehicle type to Vietnamese
  const getVehicleTypeLabel = (type) => {
    const labels = {
      CAR_UP_TO_9_SEATS: "Ô tô (≤9 chỗ)",
      MOTORBIKE: "Xe máy",
      BIKE: "Xe đạp",
      OTHER: "Khác",
    };
    return labels[type] || type;
  };

  // Format duration type to Vietnamese
  const getDurationTypeLabel = (type) => {
    const labels = {
      MONTHLY: "Theo tháng",
      QUARTERLY: "Theo quý",
      YEARLY: "Theo năm",
    };
    return labels[type] || type;
  };

  // ✅ Client-side filtering for search
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchTerm.trim()) return true;
    
    const keyword = searchTerm.toLowerCase();
    return (
      sub.name?.toLowerCase().includes(keyword) ||
      sub.description?.toLowerCase().includes(keyword) ||
      sub.vehicleType?.toLowerCase().includes(keyword) ||
      sub.durationType?.toLowerCase().includes(keyword) ||
      getParkingLotName(sub.parkingLotId)?.toLowerCase().includes(keyword)
    );
  });

  return (
    <PartnerTopLayout>
      <div className="fixed inset-0 top-16 bg-gray-50 overflow-hidden">
        <div className="h-full">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
            {/* Header */}
            <div className="pt-6 mb-4 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Gói đăng ký gói thành viên
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý các gói đăng ký bãi đỗ xe theo tháng, quý và năm
              </p>
              {lotIdFromUrl && parkingLotsMap[lotIdFromUrl] && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                  <i className="ri-filter-3-line"></i>
                  <span className="text-sm font-medium">
                    Đã lọc theo bãi đỗ xe: <strong>{parkingLotsMap[lotIdFromUrl].name}</strong>
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
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  // Reset all filters and refetch
                  setSearchTerm("");
                  setFilterVehicleType("");
                  setFilterDurationType("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                  setPage(0);
                  // Clear URL params (remove lotId filter)
                  navigate("/subscriptions", { replace: true });
                  // Manually trigger fetch with current page
                  fetchSubscriptions(0);
                }}
                disabled={loading}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i> Làm mới
              </button>

              {/* Sort and Actions */}
              <div className="flex gap-3 items-center flex-wrap">
                <FunnelIcon className="w-5 h-5 text-gray-500" />

                {/* Vehicle Type Filter */}
                <select
                  value={filterVehicleType}
                  onChange={(e) => {
                    setFilterVehicleType(e.target.value);
                    setPage(0); // Reset to first page
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tất cả loại xe</option>
                  <option value="MOTORBIKE">Xe máy</option>
                  <option value="CAR_UP_TO_9_SEATS">Ôtô (tối đa 9 chỗ)</option>
                </select>

                {/* Duration Filter */}
                <select
                  value={filterDurationType}
                  onChange={(e) => {
                    setFilterDurationType(e.target.value);
                    setPage(0); // Reset to first page
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tất cả thời hạn</option>
                  <option value="MONTHLY">Theo tháng</option>
                  <option value="QUARTERLY">Theo quý</option>
                  <option value="YEARLY">Theo năm</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                >
                  <option value="createdAt">Ngày tạo</option>
                  <option value="name">Tên</option>
                  <option value="price">Giá</option>
                  <option value="vehicleType">Loại xe</option>
                  <option value="durationType">Thời hạn</option>
                </select>

                {/* Sort Order Button */}
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  title={sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
                >
                  {sortOrder === "asc" ? (
                    <>
                      <i className="ri-sort-asc text-lg"></i>
                      <span className="hidden sm:inline">Tăng</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-sort-desc text-lg"></i>
                      <span className="hidden sm:inline">Giảm</span>
                    </>
                  )}
                </button>

                {/* Add Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                  Thêm gói
                </button>
              </div>
            </div>
          </div>

          {/* Subscriptions Grid - Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500 text-lg">
                  {searchTerm ? "Không có gói đăng ký nào khớp với tìm kiếm" : "Không tìm thấy gói đăng ký nào"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Tạo gói đầu tiên
                  </button>
                )}
              </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col h-[280px]"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {subscription.name}
                        </h3>
                        {getParkingLotName(subscription.lotId) && (
                          <p className="text-xs text-indigo-600 mt-1 truncate">
                            📍 {getParkingLotName(subscription.lotId)}
                          </p>
                        )}
                      </div>
                      
                      {/* Dropdown Menu */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === subscription.id ? null : subscription.id);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                          title="Actions"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown Panel */}
                        {openDropdownId === subscription.id && (
                          <>
                            {/* Overlay to close dropdown */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            
                            {/* Menu */}
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden cursor-pointer">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubscription(subscription);
                                  setShowViewModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <EyeIcon className="w-4 h-4" />
                                Xem chi tiết
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/users?subscriptionId=${subscription.id}&lotId=${subscription.lotId}`);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <UserGroupIcon className="w-4 h-4" />
                                Xem người dùng
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubscription(subscription);
                                  setShowEditModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSubscription(subscription);
                                  setShowDeleteModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200 transition-colors cursor-pointer"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVehicleTypeBadge(
                          subscription.vehicleType
                        )}`}
                      >
                        {getVehicleTypeLabel(subscription.vehicleType)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDurationBadge(
                          subscription.durationType
                        )}`}
                      >
                        {getDurationTypeLabel(subscription.durationType)}
                      </span>
                      {/* Active Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          subscription.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {subscription.isActive ? "● Hoạt động" : "○ Không hoạt động"}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="h-8 overflow-hidden mb-2">
                      <p className="text-gray-600 text-xs leading-tight line-clamp-2">
                        {subscription.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-4 pb-3 pt-0 border-t border-gray-100">
                    {/* Price */}
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">Giá</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {formatPrice(subscription.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6">
                <div className="flex justify-between items-center py-3 px-6 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-full">
                  <button
                    disabled={page <= 0}
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
                  >
                    ← Trước
                  </button>

                  <span className="text-gray-700 text-sm font-medium px-4">
                    Trang <strong className="text-indigo-600">{page + 1}</strong> /{" "}
                    <strong className="text-indigo-600">{pagination.totalPages}</strong> 
                    <span className="text-gray-400 ml-2">
                      ({pagination.totalElements} gói)
                    </span>
                  </span>

                  <button
                    disabled={page >= pagination.totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
                  >
                    Sau →
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

      {/* Modals */}
      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchSubscriptions(page);
            setShowAddModal(false);
          }}
        />
      )}

      {showEditModal && selectedSubscription && (
        <EditSubscriptionModal
          subscription={selectedSubscription}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSubscription(null);
          }}
          onSuccess={() => {
            fetchSubscriptions(page);
            setShowEditModal(false);
            setSelectedSubscription(null);
          }}
        />
      )}

      {showViewModal && selectedSubscription && (
        <ViewSubscriptionModal
          subscription={selectedSubscription}
          parkingLotName={getParkingLotName(selectedSubscription.lotId)}
          onClose={() => {
            setShowViewModal(false);
            setSelectedSubscription(null);
          }}
        />
      )}

      {showDeleteModal && selectedSubscription && (
        <ConfirmModal
          title="Xóa gói đăng ký"
          message={`Bạn có chắc chắn muốn xóa "${selectedSubscription.name}"? Hành động này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedSubscription(null);
          }}
        />
      )}
    </PartnerTopLayout>
  );
}
