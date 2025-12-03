import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import sessionApi from "../api/sessionApi";
import parkingLotApi from "../api/parkingLotApi";
import ViewSessionDetailModal from "../components/ViewSessionDetailModal";
import toast from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function PartnerSessions() {
  const [searchParams] = useSearchParams();
  const lotIdFromUrl = searchParams.get("lotId");

  const [sessions, setSessions] = useState([]);
  const [parkingLotsMap, setParkingLotsMap] = useState({});
  const [partnerLotIds, setPartnerLotIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReferenceType, setFilterReferenceType] = useState("");
  const [filterParkingLot, setFilterParkingLot] = useState(lotIdFromUrl || "");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("entryTime");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(0);
  const [size] = useState(7);

  // Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Fetch partner's parking lots
  const fetchPartnerParkingLots = async () => {
    try {
      console.log("Fetching partner's parking lots...");
      const response = await parkingLotApi.getAllByPartner();
      const payload = response?.data?.data;
      
      if (payload) {
        const lots = payload.content || payload;
        const lotIds = Array.isArray(lots) ? lots.map(lot => lot.id) : [];
        console.log("Partner's parking lot IDs:", lotIds);
        setPartnerLotIds(lotIds);
        
        const lotsMap = {};
        lots.forEach(lot => {
          lotsMap[lot.id] = lot;
        });
        setParkingLotsMap(lotsMap);
        
        return lotIds;
      }
      return [];
    } catch (error) {
      console.error("Error fetching partner's parking lots:", error);
      toast.error("Failed to load parking lots");
      return [];
    }
  };

  // Fetch sessions
  const fetchSessions = useCallback(async (currentPage = 0, lotIds = []) => {
    try {
      setLoading(true);

      if (lotIds.length === 0) {
        console.log("No parking lots found for this partner");
        setSessions([]);
        setLoading(false);
        return;
      }

      const queryParams = {
        page: currentPage,
        size: 9999, // Get all to filter client-side
        sortBy: sortBy,
        sortOrder: sortOrder === "asc" ? "ASC" : "DESC",
      };

      // Add status filter
      if (filterStatus) {
        queryParams.status = filterStatus;
      }

      // Add reference type filter
      if (filterReferenceType) {
        queryParams.referenceType = filterReferenceType;
      }

      // Add parking lot filter if selected
      if (filterParkingLot) {
        queryParams.lotId = filterParkingLot;
      }

      console.log("Fetching sessions with params:", queryParams);

      const response = await sessionApi.getAllSessions(queryParams);
      console.log("Sessions response:", response);

      const payload = response?.data?.data;
      const success = response?.data?.success;

      if (!success || !payload) {
        toast.error("Failed to load sessions");
        setSessions([]);
        return;
      }

      if (payload.content !== undefined) {
        console.log("Sessions found:", payload.content.length);

        // Filter by partner's parking lot IDs
        const filteredByPartnerLots = payload.content.filter(session => {
          return lotIds.includes(session.lotId);
        });
        console.log(`Filtered: ${filteredByPartnerLots.length} sessions belonging to partner's parking lots`);

        setSessions(filteredByPartnerLots);
      } else {
        const data = Array.isArray(payload) ? payload : [];
        const filteredByPartnerLots = data.filter(session => 
          lotIds.includes(session.lotId)
        );
        
        setSessions(filteredByPartnerLots);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, filterStatus, filterReferenceType, filterParkingLot]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      const lotIds = await fetchPartnerParkingLots();
      if (lotIds.length > 0) {
        await fetchSessions(page, lotIds);
      } else {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (partnerLotIds.length > 0) {
      setPage(0);
      fetchSessions(0, partnerLotIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, filterStatus, filterReferenceType, filterParkingLot, partnerLotIds]);

  // Client-side search and pagination
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Apply search
    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      filtered = filtered.filter((session) => {
        const licensePlate = session.licensePlate?.toLowerCase() || "";
        const lotName = parkingLotsMap[session.lotId]?.name?.toLowerCase() || "";
        const userId = session.userId?.toString() || "";
        
        return (
          licensePlate.includes(keyword) ||
          lotName.includes(keyword) ||
          userId.includes(keyword)
        );
      });
    }

    // Status filter (client-side)
    if (filterStatus) {
      filtered = filtered.filter((session) => session.status === filterStatus);
    }

    // Reference type filter (client-side)
    if (filterReferenceType) {
      filtered = filtered.filter((session) => session.referenceType === filterReferenceType);
    }

    // Parking lot filter (client-side)
    if (filterParkingLot) {
      filtered = filtered.filter((session) => session.lotId === parseInt(filterParkingLot));
    }

    // Date range filter (by entryTime)
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((session) => {
        if (!session.entryTime) return false;
        const entryDate = new Date(session.entryTime);
        return entryDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((session) => {
        if (!session.entryTime) return false;
        const entryDate = new Date(session.entryTime);
        return entryDate <= toDate;
      });
    }

    return filtered;
  }, [sessions, searchTerm, parkingLotsMap, filterDateFrom, filterDateTo, filterStatus, filterReferenceType, filterParkingLot]);

  // Paginate filtered sessions
  const paginatedSessions = useMemo(() => {
    const start = page * size;
    const end = start + size;
    return filteredSessions.slice(start, end);
  }, [filteredSessions, page, size]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    return {
      totalPages: Math.ceil(filteredSessions.length / size),
      totalElements: filteredSessions.length,
    };
  }, [filteredSessions, size]);

  // Helper functions
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
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
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700";
      case "MANUAL_COMPLETED":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getReferenceTypeBadge = (type) => {
    switch (type) {
      case "WALK_IN":
        return { color: "bg-orange-100 text-orange-700", icon: "🚶", label: "Vãng Lai" };
      case "RESERVATION":
        return { color: "bg-blue-100 text-blue-700", icon: "📅", label: "Đặt Trước" };
      case "SUBSCRIPTION":
        return { color: "bg-purple-100 text-purple-700", icon: "🎫", label: "Đăng Ký" };
      default:
        return { color: "bg-gray-100 text-gray-700", icon: "❓", label: type };
    }
  };

  const refreshData = async () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterReferenceType("");
    setFilterParkingLot(lotIdFromUrl || "");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("entryTime");
    setSortOrder("desc");
    setPage(0);
    
    const lotIds = await fetchPartnerParkingLots();
    if (lotIds.length > 0) {
      await fetchSessions(0, lotIds);
    }
  };

  return (
    <PartnerTopLayout>
      <div className="fixed inset-0 top-16 bg-gray-50 overflow-hidden">
        <div className="h-full">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
            {/* Header */}
            <div className="pt-6 mb-4 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900">Phiên Gửi Xe</h1>
              <p className="text-gray-600 mt-1">
                Tất cả phiên gửi xe (vào/ra) tại bãi đỗ xe của bạn
              </p>
              {lotIdFromUrl && parkingLotsMap[lotIdFromUrl] && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                  <i className="ri-filter-3-line"></i>
                  <span className="text-sm font-medium">
                    Đang lọc theo bãi xe: <strong>{parkingLotsMap[lotIdFromUrl].name}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
              {/* Row 1: Search + Refresh + Sort Order */}
              <div className="flex gap-3 items-center mb-4">
                {/* Search - takes most space */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo biển số xe, bãi đỗ xe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Sort Order Button */}
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  title={sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
                >
                  {sortOrder === "asc" ? (
                    <>
                      <i className="ri-sort-asc text-lg"></i>
                      <span>Tăng</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-sort-desc text-lg"></i>
                      <span>Giảm</span>
                    </>
                  )}
                </button>

                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i> Làm Mới
                </button>
              </div>

              {/* Row 2: Filters */}
              <div className="flex gap-3 items-end flex-wrap">
                <FunnelIcon className="w-5 h-5 text-gray-500 mb-2" />

                {/* Date From Filter */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-medium">Từ Ngày</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setPage(0);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Date To Filter */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1 font-medium">Đến Ngày</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setPage(0);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Parking Lot Filter */}
                <select
                  value={filterParkingLot}
                  onChange={(e) => setFilterParkingLot(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tất Cả Bãi Xe</option>
                  {Object.values(parkingLotsMap).map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>

                {/* Reference Type Filter */}
                <select
                  value={filterReferenceType}
                  onChange={(e) => {
                    setFilterReferenceType(e.target.value);
                    setPage(0);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tất Cả Loại</option>
                  <option value="WALK_IN">🚶 Vãng Lai</option>
                  <option value="RESERVATION">📅 Đặt Trước</option>
                  <option value="SUBSCRIPTION">🎫 Đăng Ký</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPage(0);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Tất Cả Trạng Thái</option>
                  <option value="ACTIVE">Đang Hoạt Động</option>
                  <option value="COMPLETED">Hoàn Thành</option>
                  <option value="MANUAL_COMPLETED">Hoàn Thành Thủ Công</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer cursor-pointer"
                >
                  <option value="entryTime">Thời Gian Vào</option>
                  <option value="exitTime">Thời Gian Ra</option>
                  <option value="status">Trạng Thái</option>
                  <option value="totalAmount">Tổng Tiền</option>
                  <option value="durationMinute">Thời Lượng</option>
                </select>
              </div>
            </div>

            {/* Sessions Table - Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : paginatedSessions.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm || filterStatus || filterReferenceType || filterParkingLot || filterDateFrom || filterDateTo
                      ? "Không có phiên nào khớp với bộ lọc" 
                      : "Không tìm thấy phiên gửi xe"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    <table className="w-full table-auto">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Phương Tiện
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Bãi Đỗ Xe
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Loại
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Thời Gian Vào/Ra
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                            Thời Lượng
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Số Tiền
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                            Trạng Thái
                          </th>
                          <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                            Hành Động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedSessions.map((session, idx) => {
                          const refType = getReferenceTypeBadge(session.referenceType);
                          return (
                            <tr key={session.id || idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                                {page * size + idx + 1}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {session.licensePlate || "-"}
                                </p>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">
                                {parkingLotsMap[session.lotId]?.name || "-"}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${refType.color}`}>
                                  {refType.icon} {refType.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-xs whitespace-nowrap">
                                <p className="text-gray-500">Vào: {formatDateTime(session.entryTime)}</p>
                                <p className="text-gray-500">Ra: {formatDateTime(session.exitTime)}</p>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900 whitespace-nowrap">
                                {session.durationMinute ? `${session.durationMinute} phút` : calculateDuration(session.entryTime, session.exitTime)}
                              </td>
                              <td className="px-3 py-4 text-center whitespace-nowrap">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {session.totalAmount ? `${session.totalAmount.toLocaleString()} ₫` : "-"}
                                </p>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                                  {session.status || "UNKNOWN"}
                                </span>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-center">
                                <button
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setShowDetailModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all text-xs font-medium"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                  Xem Chi Tiết
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paginationInfo.totalPages > 1 && (
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
                          <strong className="text-indigo-600">{paginationInfo.totalPages}</strong> 
                          <span className="text-gray-400 ml-2">
                            ({paginationInfo.totalElements} phiên)
                          </span>
                        </span>

                        <button
                          disabled={page >= paginationInfo.totalPages - 1}
                          onClick={() => setPage((p) => p + 1)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium cursor-pointer"
                        >
                          Tiếp →
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
      {showDetailModal && selectedSession && (
        <ViewSessionDetailModal
          session={selectedSession}
          parkingLotName={parkingLotsMap[selectedSession.lotId]?.name || "Unknown"}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSession(null);
          }}
        />
      )}
    </PartnerTopLayout>
  );
}
