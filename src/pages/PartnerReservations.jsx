import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import reservationApi from "../api/reservationApi";
import parkingLotApi from "../api/parkingLotApi";
import ViewReservationDetailModal from "../components/ViewReservationDetailModal";
import toast from "react-hot-toast";

export default function PartnerReservations() {
  const [searchParams] = useSearchParams();
  const lotIdFromUrl = searchParams.get("lotId");

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parkingLotsMap, setParkingLotsMap] = useState({});

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterParkingLot, setFilterParkingLot] = useState(lotIdFromUrl || "");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("reservedFrom");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(0);
  const size = 7;

  const [selectedReservation, setSelectedReservation] = useState(null);

  // Fetch partner's parking lots
  const fetchPartnerParkingLots = useCallback(async () => {
    try {
      const response = await parkingLotApi.getAll({ ownedByMe: true, size: 1000 });
      const lots = response?.data?.data?.content || response?.data?.data || [];
      
      const lotIds = lots.map((lot) => lot.id);

      const lotsMap = {};
      lots.forEach((lot) => {
        lotsMap[lot.id] = lot;
      });
      setParkingLotsMap(lotsMap);

      return lotIds;
    } catch (error) {
      console.error("Error fetching partner parking lots:", error);
      toast.error("Không thể tải danh sách bãi xe");
      return [];
    }
  }, []);

  // Fetch reservations
  const fetchReservations = useCallback(async (currentPage, lotIds) => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        size: size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      };

      // Filter by status
      if (filterStatus) {
        params.status = filterStatus;
      }

      // Filter by specific parking lot or all partner's lots
      const targetLotId = filterParkingLot || (lotIdFromUrl && lotIds.includes(parseInt(lotIdFromUrl)) ? lotIdFromUrl : null);
      
      let response;
      if (targetLotId) {
        response = await reservationApi.getByLotId(targetLotId, params);
      } else {
        // If no specific lot, we need to filter by partner's lots
        // Since API might not support multiple lotIds, we'll fetch all and filter client-side
        params.size = 1000; // Get more results to filter
        response = await reservationApi.getAll(params);
      }

      const data = response?.data?.data;
      let allReservations = data?.content || data || [];

      // Client-side filter by partner's lots if needed
      if (!targetLotId && lotIds.length > 0) {
        allReservations = allReservations.filter((r) => lotIds.includes(r.parkingLotId));
      }

      setReservations(allReservations);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Không thể tải danh sách đặt chỗ");
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder, filterStatus, filterParkingLot, lotIdFromUrl]);

  // Initial load
  useEffect(() => {
    const initData = async () => {
      const lotIds = await fetchPartnerParkingLots();
      if (lotIds.length > 0) {
        await fetchReservations(0, lotIds);
      } else {
        setLoading(false);
      }
    };
    initData();
  }, [fetchPartnerParkingLots, fetchReservations]);

  // Client-side filtering and pagination
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((r) => {
        const lotName = parkingLotsMap[r.parkingLotId]?.name || "";
        return (
          r.vehicleLicensePlate?.toLowerCase().includes(search) ||
          lotName.toLowerCase().includes(search) ||
          r.status?.toLowerCase().includes(search)
        );
      });
    }

    // Date range filter (by reservedFrom)
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((r) => {
        if (!r.reservedFrom) return false;
        const reservedDate = new Date(r.reservedFrom);
        return reservedDate >= fromDate;
      });
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => {
        if (!r.reservedFrom) return false;
        const reservedDate = new Date(r.reservedFrom);
        return reservedDate <= toDate;
      });
    }

    // Paginate
    const start = page * size;
    const end = start + size;
    return filtered.slice(start, end);
  }, [reservations, searchTerm, page, parkingLotsMap, filterDateFrom, filterDateTo]);

  // Helper functions
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 ring-green-600/20";
      case "CANCELLED":
        return "bg-red-100 text-red-700 ring-red-600/20";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 ring-yellow-600/20";
      case "ACTIVE":
        return "bg-blue-100 text-blue-700 ring-blue-600/20";
      case "EXPIRED":
        return "bg-orange-100 text-orange-700 ring-orange-600/20";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-600/20";
    }
  };

  const refreshData = async () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterParkingLot(lotIdFromUrl || "");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortBy("reservedFrom");
    setSortOrder("desc");
    setPage(0);
    
    const lotIds = await fetchPartnerParkingLots();
    if (lotIds.length > 0) {
      await fetchReservations(0, lotIds);
    }
  };

  return (
    <PartnerTopLayout>
      <div className="fixed inset-0 top-16 bg-gray-50 overflow-hidden">
        <div className="h-full">
          <div className="max-w-7xl mx-auto px-6 h-full flex flex-col">
            {/* Header */}
            <div className="pt-6 mb-4 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900">Đặt Chỗ</h1>
              <p className="text-gray-600 mt-1">
                Quản lý đặt chỗ đỗ xe cho các bãi xe của bạn
              </p>
              {lotIdFromUrl && parkingLotsMap[lotIdFromUrl] && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                  <i className="ri-filter-3-line"></i>
                  <span className="text-sm font-medium">
                    Lọc theo bãi xe: <strong>{parkingLotsMap[lotIdFromUrl].name}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 flex-shrink-0">
              {/* Row 1: Search + Refresh */}
              <div className="flex gap-4 items-center mb-4">
                {/* Search - takes most space */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo biển số xe, bãi xe..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i> Làm Mới
                </button>
              </div>

              {/* Row 2: Filters and Sort */}
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
                  <option value="PENDING">Chờ Xử Lý</option>
                  <option value="ACTIVE">Đang Hoạt Động</option>
                  <option value="COMPLETED">Hoàn Thành</option>
                  <option value="EXPIRED">Hết Hạn</option>
                  <option value="CANCELLED">Đã Hủy</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                >
                  <option value="reservedFrom">Thời Gian Bắt Đầu</option>
                  <option value="reservedUntil">Thời Gian Kết Thúc</option>
                  <option value="totalFee">Tổng Phí</option>
                  <option value="status">Trạng Thái</option>
                </select>

                {/* Sort Order Button */}
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <i className="ri-calendar-line text-6xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-lg">
                    {searchTerm ? "Không tìm thấy đặt chỗ nào phù hợp" : "Không có đặt chỗ nào"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    <table className="w-full table-auto">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Biển Số Xe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Bãi Xe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Thời Gian Đặt
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Tổng Phí
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Trạng Thái
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Thao Tác
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReservations.map((reservation, idx) => (
                          <tr key={reservation.id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {page * size + idx + 1}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">
                                {reservation.vehicleLicensePlate || "-"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {parkingLotsMap[reservation.parkingLotId]?.name || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <p className="text-xs text-gray-500">Từ: {formatDateTime(reservation.reservedFrom)}</p>
                              <p className="text-xs text-gray-500">Đến: {formatDateTime(reservation.reservedUntil)}</p>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <p className="font-semibold text-gray-900">
                                {reservation.totalFee ? `${reservation.totalFee.toLocaleString()} ₫` : "-"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusBadge(reservation.status)}`}>
                                {reservation.status === "PENDING" ? "Chờ Xử Lý" :
                                 reservation.status === "ACTIVE" ? "Đang Hoạt Động" :
                                 reservation.status === "COMPLETED" ? "Hoàn Thành" :
                                 reservation.status === "EXPIRED" ? "Hết Hạn" :
                                 reservation.status === "CANCELLED" ? "Đã Hủy" : reservation.status || "KHÔNG XÁC ĐỊNH"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setSelectedReservation(reservation)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all text-sm font-medium"
                              >
                                <i className="ri-eye-line"></i>
                                Xem Chi Tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {Math.ceil(reservations.length / size) > 1 && (
                    <div className="flex justify-between items-center py-3 px-6 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-full">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        ← Trước
                      </button>
                      <span className="text-gray-700 text-sm font-medium px-4">
                        Trang <strong className="text-indigo-600">{page + 1}</strong> / {" "}
                        <strong className="text-indigo-600">{Math.max(1, Math.ceil(reservations.length / size))}</strong>
                        <span className="text-gray-400 ml-2">
                          ({reservations.length} đặt chỗ)
                        </span>
                      </span>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= Math.ceil(reservations.length / size) - 1}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Sau →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {selectedReservation && (
        <ViewReservationDetailModal
          reservation={selectedReservation}
          parkingLotName={parkingLotsMap[selectedReservation.parkingLotId]?.name || "Không rõ"}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </PartnerTopLayout>
  );
}
