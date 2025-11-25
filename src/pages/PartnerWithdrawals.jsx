import { useState, useEffect, useCallback } from "react";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import withdrawalApi from "../api/withdrawalApi";
import parkingLotApi from "../api/parkingLotApi";
import {
  TrashIcon,
  PlusIcon,
  EyeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import RequestWithdrawalModal from "../components/RequestWithdrawalModal";
import ConfirmModal from "../components/ConfirmModal";

export default function PartnerWithdrawals() {
  const [activeTab, setActiveTab] = useState("request"); // "request" or "history" or "periods"
  const [withdrawals, setWithdrawals] = useState([]);
  const [allPeriods, setAllPeriods] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLotFilter, setSelectedLotFilter] = useState("");
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  
  // Periods tab filters
  const [periodPage, setPeriodPage] = useState(0);
  const [periodSize] = useState(3);
  const [periodStatusFilter, setPeriodStatusFilter] = useState(""); // "" | "withdrawn" | "available"
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [periodEndDate, setPeriodEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState(null);
  const [viewingWithdrawal, setViewingWithdrawal] = useState(null);

  // ✅ Fetch withdrawals
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await withdrawalApi.getAll({
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      console.log("🔍 Full withdrawal response:", res);
      console.log("🔍 res.data:", res.data);
      console.log("🔍 res.data.data:", res.data?.data);

      // Try different response structures
      let withdrawalsList = [];
      let totalPagesValue = 1;

      // Check if it's in res.data.data
      if (res.data?.data) {
        const data = res.data.data;
        console.log("🔍 Type of data:", typeof data, Array.isArray(data));

        if (Array.isArray(data)) {
          withdrawalsList = data;
        } else if (data.content && Array.isArray(data.content)) {
          console.log("✅ Using data.content array");
          withdrawalsList = data.content;
          totalPagesValue = data.totalPages || 1;
        } else if (typeof data === "object" && data.id) {
          console.log("✅ Single object with id, wrapping");
          withdrawalsList = [data];
        }
      } else if (Array.isArray(res.data)) {
        withdrawalsList = res.data;
      } else if (res.data && typeof res.data === "object" && res.data.id) {
        withdrawalsList = [res.data];
      }

      console.log("✅ Final withdrawals list:", withdrawalsList);
      console.log("✅ Setting", withdrawalsList.length, "withdrawals");

      setWithdrawals(withdrawalsList);
      setTotalPages(totalPagesValue);
      setTotalCount(withdrawalsList.length);
    } catch (err) {
      console.error("❌ Error fetching withdrawals:", err);
      console.error("❌ Error response:", err.response);
      showError("Failed to fetch withdrawals");
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Fetch all periods
  const fetchAllPeriods = useCallback(async () => {
    try {
      setLoadingPeriods(true);
      
      // Fetch periods and parking lots in parallel
      const [periodsRes, lotsRes] = await Promise.all([
        withdrawalApi.getPeriods({ page: 0, size: 1000 }),
        parkingLotApi.getAllByPartner()
      ]);

      const responseData = periodsRes.data?.data || periodsRes.data;
      let periodsList = [];

      if (responseData?.content) {
        periodsList = Array.isArray(responseData.content) ? responseData.content : [];
      } else if (Array.isArray(responseData)) {
        periodsList = responseData;
      }

      setAllPeriods(periodsList);
      
      // Extract parking lots from API response
      const lotsData = lotsRes.data?.data || lotsRes.data;
      let lotsList = [];
      
      if (lotsData?.content) {
        lotsList = Array.isArray(lotsData.content) ? lotsData.content : [];
      } else if (Array.isArray(lotsData)) {
        lotsList = lotsData;
      }
      
      // Filter to only show lots that have periods
      const lotIdsWithPeriods = new Set(periodsList.map(p => p.lotId));
      const filteredLots = lotsList
        .filter(lot => lotIdsWithPeriods.has(lot.id))
        .map(lot => ({ id: lot.id, name: lot.name || `Parking Lot ${lot.id}` }));
      
      setParkingLots(filteredLots);
    } catch (err) {
      console.error("Error fetching periods:", err);
      showError("Failed to load periods");
      setAllPeriods([]);
    } finally {
      setLoadingPeriods(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "periods") {
      fetchAllPeriods();
    }
  }, [activeTab, fetchAllPeriods]);

  // ✅ Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Date format error:", err);
      return "N/A";
    }
  };

  // ✅ Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "0 ₫";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(amount));
    } catch (err) {
      console.error("Currency format error:", err);
      return `${amount} ₫`;
    }
  };

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base =
      "px-3 py-1 text-xs font-semibold rounded-full border inline-block";
    const statusMap = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-300",
      APPROVED: "bg-green-50 text-green-700 border-green-300",
      REJECTED: "bg-red-50 text-red-700 border-red-300",
      COMPLETED: "bg-blue-50 text-blue-700 border-blue-300",
      PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-300",
    };

    const displayText = status
      ? status.charAt(0) + status.slice(1).toLowerCase()
      : "Unknown";

    return (
      <span
        className={`${base} ${
          statusMap[status] || "bg-gray-50 text-gray-600 border-gray-300"
        }`}
      >
        {displayText}
      </span>
    );
  };

  // ✅ Filter data
  const filtered = withdrawals.filter((w) => {
    if (!w) return false;

    // Filter by date range
    if (startDate || endDate) {
      const requestDate = w.requestedAt ? new Date(w.requestedAt) : null;
      if (!requestDate) return false;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (requestDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (requestDate > end) return false;
      }
    }

    // Filter by search keyword
    if (search && search.trim() !== "") {
      const keyword = search.toLowerCase();
      const requestDate = w.requestedAt
        ? formatDate(w.requestedAt).toLowerCase()
        : "";
      const processedDate = w.processedAt
        ? formatDate(w.processedAt).toLowerCase()
        : "";
      const completedDate = w.completedAt
        ? formatDate(w.completedAt).toLowerCase()
        : "";

      return (
        requestDate.includes(keyword) ||
        processedDate.includes(keyword) ||
        completedDate.includes(keyword)
      );
    }

    return true;
  });

  console.log(
    "📊 Withdrawals:",
    withdrawals.length,
    "Filtered:",
    filtered.length
  );

  // ✅ CRUD actions
  const handleView = (withdrawal, e) => {
    e.stopPropagation();
    setViewingWithdrawal(withdrawal);
  };

  const handleDelete = (withdrawal, e) => {
    e.stopPropagation();
    setConfirmingWithdrawal(withdrawal);
  };

  const confirmDelete = async () => {
    const withdrawal = confirmingWithdrawal;
    if (!withdrawal) return;

    try {
      const res = await withdrawalApi.delete(withdrawal.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess("Withdrawal request deleted successfully!");
        fetchWithdrawals();
      } else {
        showError("❌ Failed to delete withdrawal request.");
      }
    } catch (err) {
      console.error("❌ Delete withdrawal error:", err);
      showError(
        err.response?.data?.message || "❌ Failed to delete withdrawal request."
      );
    } finally {
      setConfirmingWithdrawal(null);
    }
  };

  return (
    <PartnerTopLayout>
      {/* 🔹 Header */}
      <div className="bg-indigo-600 text-white py-8 px-6 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BanknotesIcon className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Withdrawal Management</h1>
          </div>
          <p className="text-indigo-100">
            Request and manage your earnings withdrawals
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 min-h-[calc(100vh-13rem)]">
        <div className="max-w-7xl mx-auto px-6 py-6 pb-12">
          
          {/* Tabs Navigation */}
          <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-md border border-gray-200">
            <button
              onClick={() => setActiveTab("request")}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "request"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <PlusIcon className="w-5 h-5" />
                <span>Request Withdrawal</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("periods")}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "periods"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>All Periods</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BanknotesIcon className="w-5 h-5" />
                <span>Withdrawal History</span>
              </div>
            </button>
          </div>

          {/* Request Withdrawal Tab */}
          {activeTab === "request" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <RequestWithdrawalModal
                onClose={() => {}}
                onRequested={() => {
                  setActiveTab("history");
                  fetchWithdrawals();
                }}
                isEmbedded={true}
              />
            </div>
          )}

          {/* All Periods Tab */}
          {activeTab === "periods" && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Parking Lot Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parking Lot</label>
                  <select
                    value={selectedLotFilter}
                    onChange={(e) => {
                      setSelectedLotFilter(e.target.value);
                      setPeriodPage(0);
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  >
                    <option value="">All Parking Lots</option>
                    {parkingLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={periodStatusFilter}
                    onChange={(e) => {
                      setPeriodStatusFilter(e.target.value);
                      setPeriodPage(0);
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={periodStartDate}
                    onChange={(e) => {
                      setPeriodStartDate(e.target.value);
                      setPeriodPage(0);
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={periodEndDate}
                    onChange={(e) => {
                      setPeriodEndDate(e.target.value);
                      setPeriodPage(0);
                    }}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-sm"
                  />
                </div>
              </div>

              {loadingPeriods ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading periods...</p>
                </div>
              ) : (() => {
                // Apply all filters
                let filteredPeriods = allPeriods;

                // Filter by parking lot
                if (selectedLotFilter) {
                  filteredPeriods = filteredPeriods.filter((p) => p.lotId === parseInt(selectedLotFilter));
                }

                // Filter by status
                if (periodStatusFilter === "withdrawn") {
                  filteredPeriods = filteredPeriods.filter((p) => p.isWithdrawn === true);
                } else if (periodStatusFilter === "available") {
                  filteredPeriods = filteredPeriods.filter((p) => p.isWithdrawn === false);
                }

                // Filter by date range
                if (periodStartDate || periodEndDate) {
                  filteredPeriods = filteredPeriods.filter((p) => {
                    const periodStart = new Date(p.periodStartDate);
                    const periodEnd = new Date(p.periodEndDate);

                    if (periodStartDate) {
                      const filterStart = new Date(periodStartDate);
                      if (periodEnd < filterStart) return false;
                    }

                    if (periodEndDate) {
                      const filterEnd = new Date(periodEndDate);
                      if (periodStart > filterEnd) return false;
                    }

                    return true;
                  });
                }

                // Calculate pagination
                const totalItems = filteredPeriods.length;
                const totalPages = Math.ceil(totalItems / periodSize);

                // Get current page items
                const startIdx = periodPage * periodSize;
                const endIdx = startIdx + periodSize;
                const paginatedPeriods = filteredPeriods.slice(startIdx, endIdx);
                
                return filteredPeriods.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {paginatedPeriods.map((period, idx) => (
                        <div
                          key={period.id || idx}
                          className={`border rounded-lg p-4 transition-all ${
                            period.isWithdrawn
                              ? 'bg-gray-50 border-gray-300'
                              : 'bg-white border-indigo-200 hover:shadow-md hover:border-indigo-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            {/* Left: Date and Revenue Breakdown */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📅</span>
                                <div className="font-bold text-gray-900">
                                  {new Date(period.periodStartDate).toLocaleDateString('vi-VN')} → {new Date(period.periodEndDate).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="flex flex-col p-2 bg-blue-50 rounded">
                                  <span className="text-gray-600 mb-1">Reservation</span>
                                  <span className="font-semibold text-blue-700">{formatCurrency(period.reservationRevenue)}</span>
                                </div>
                                <div className="flex flex-col p-2 bg-purple-50 rounded">
                                  <span className="text-gray-600 mb-1">Subscription</span>
                                  <span className="font-semibold text-purple-700">{formatCurrency(period.subscriptionRevenue)}</span>
                                </div>
                                <div className="flex flex-col p-2 bg-green-50 rounded">
                                  <span className="text-gray-600 mb-1">Walk-in</span>
                                  <span className="font-semibold text-green-700">{formatCurrency(period.walkInRevenue)}</span>
                                </div>
                                <div className="flex flex-col p-2 bg-indigo-50 rounded">
                                  <span className="text-gray-600 font-medium mb-1">Gross</span>
                                  <span className="font-bold text-indigo-700">{formatCurrency(period.grossRevenue)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Middle: Platform Fee */}
                            <div className="text-center px-4 border-l border-r border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">Platform Fee</div>
                              <div className="font-bold text-red-600">-{formatCurrency(period.platformFee)}</div>
                            </div>

                            {/* Right: Net Revenue and Status */}
                            <div className="text-right min-w-[140px]">
                              <div className="text-xs text-gray-500 mb-1">Net Revenue</div>
                              <div className="font-bold text-green-600 text-xl mb-2">
                                {formatCurrency(period.netRevenue)}
                              </div>
                              <div>
                                {period.isWithdrawn ? (
                                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs">✓ Withdrawn</span>
                                ) : (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-xs">● Available</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <button
                          disabled={periodPage <= 0}
                          onClick={() => setPeriodPage((p) => Math.max(p - 1, 0))}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                          ← Previous
                        </button>

                        <div className="text-center text-gray-600 text-sm">
                          <div>
                            Page <strong>{periodPage + 1}</strong> of <strong>{totalPages}</strong>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Showing {startIdx + 1}-{Math.min(endIdx, totalItems)} of {totalItems} periods
                          </div>
                        </div>

                        <button
                          disabled={periodPage >= totalPages - 1}
                          onClick={() => setPeriodPage((p) => Math.min(p + 1, totalPages - 1))}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg font-medium">No periods found</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Withdrawal History Tab */}
          {activeTab === "history" && (
            <>
              {/* 🔹 Filters + Actions */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by date (dd/mm/yyyy)..."
                className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-80 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.75 6.75a7.5 7.5 0 0 0 9.9 9.9z"
                />
              </svg>
            </div>
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="Start date"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
                placeholder="End date"
              />
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? (
                <i className="ri-sort-asc text-lg text-gray-600"></i>
              ) : (
                <i className="ri-sort-desc text-lg text-gray-600"></i>
              )}
              <span className="text-sm text-gray-600">
                {sortOrder === "asc" ? "Asc" : "Desc"}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                setSortBy("id");
                setSortOrder("desc");
                setPage(0);
                fetchWithdrawals();
              }}
              className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
              title="Reset filters"
            >
              <i className="ri-refresh-line text-lg text-gray-600"></i>
              <span className="text-sm text-gray-600">Refresh</span>
            </button>
          </div>

          {/* ✅ Actions */}
          <div className="flex items-center gap-2">
          </div>
        </div>

        {/* 🔹 Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <table className="min-w-full table-auto">
            <thead className="bg-indigo-50 text-indigo-700 uppercase text-sm font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-16">#</th>
                <th className="px-6 py-3 text-left">Amount</th>
                <th className="px-6 py-3 text-left">Gross Revenue</th>
                <th className="px-6 py-3 text-left">Platform Fee</th>
                <th className="px-6 py-3 text-left">Request Date</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-6 text-center text-gray-500 italic"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((w, idx) => {
                  console.log("Rendering withdrawal:", idx, w);
                  return (
                    <tr
                      key={w.id || idx}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                    >
                      <td className="px-6 py-3 text-gray-500">
                        {page * size + idx + 1}
                      </td>
                      <td className="px-6 py-3 text-indigo-700 font-bold">
                        {formatCurrency(w.netAmount)}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {formatCurrency(w.totalGrossRevenue)}
                      </td>
                      <td className="px-6 py-3 text-red-600 font-medium">
                        -{formatCurrency(w.totalPlatformFee)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {formatDate(w.requestedAt)}
                      </td>
                      <td className="px-6 py-3">{renderStatus(w.status)}</td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button
                            title="View Details"
                            onClick={(e) => handleView(w, e)}
                            className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          {w.status === "PENDING" && (
                            <button
                              title="Cancel Request"
                              onClick={(e) => handleDelete(w, e)}
                              className="p-2 rounded-full hover:bg-red-100 transition cursor-pointer"
                            >
                              <TrashIcon className="w-5 h-5 text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-6 text-center text-gray-500 italic"
                  >
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔹 Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            ← Previous
          </button>

          <div className="text-center text-gray-600 text-sm">
            <div>
              Page <strong>{page + 1}</strong> of {totalPages}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Total requests:{" "}
              <strong className="text-indigo-700">{totalCount}</strong>
            </div>
          </div>

          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>

        {/* ✅ Modals */}
        {showRequestModal && (
          <RequestWithdrawalModal
            onClose={() => setShowRequestModal(false)}
            onRequested={fetchWithdrawals}
          />
        )}
        {confirmingWithdrawal && (
          <ConfirmModal
            open={!!confirmingWithdrawal}
            title="Cancel Withdrawal Request"
            message="Are you sure you want to cancel this withdrawal request?"
            onConfirm={confirmDelete}
            onCancel={() => setConfirmingWithdrawal(null)}
          />
        )}

        {/* View Modal */}
        {viewingWithdrawal && (
          <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
            <div className="bg-white w-[700px] rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-indigo-600 text-white py-5 px-6">
                <h2 className="text-2xl font-bold">
                  Withdrawal Request Details
                </h2>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Net Amount */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium text-lg">
                      Net Amount:
                    </span>
                    <span className="text-indigo-700 font-bold text-2xl">
                      {formatCurrency(viewingWithdrawal.netAmount)}
                    </span>
                  </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium mb-1">
                      Total Gross Revenue
                    </div>
                    <div className="text-blue-800 font-bold text-lg">
                      {formatCurrency(viewingWithdrawal.totalGrossRevenue)}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-xs text-red-600 font-medium mb-1">
                      Platform Fee
                    </div>
                    <div className="text-red-800 font-bold text-lg">
                      -{formatCurrency(viewingWithdrawal.totalPlatformFee)}
                    </div>
                  </div>
                </div>

                {/* Revenue by Type */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-xs text-purple-600 font-medium mb-1">
                      Reservation
                    </div>
                    <div className="text-purple-800 font-semibold">
                      {formatCurrency(
                        viewingWithdrawal.totalAmountReservation || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-green-600 font-medium mb-1">
                      Subscription
                    </div>
                    <div className="text-green-800 font-semibold">
                      {formatCurrency(
                        viewingWithdrawal.totalAmountSubscription || 0
                      )}
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="text-xs text-amber-600 font-medium mb-1">
                      Walk-In
                    </div>
                    <div className="text-amber-800 font-semibold">
                      {formatCurrency(viewingWithdrawal.totalAmountWalkIn || 0)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span>{renderStatus(viewingWithdrawal.status)}</span>
                </div>

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium text-gray-600">
                      Request Date:
                    </span>
                    <span className="text-gray-800">
                      {formatDate(viewingWithdrawal.requestedAt)}
                    </span>
                  </div>
                  {viewingWithdrawal.processedAt && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">
                        Processed At:
                      </span>
                      <span className="text-gray-800">
                        {formatDate(viewingWithdrawal.processedAt)}
                      </span>
                    </div>
                  )}
                  {viewingWithdrawal.completedAt && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium text-gray-600">
                        Completed At:
                      </span>
                      <span className="text-gray-800">
                        {formatDate(viewingWithdrawal.completedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Transaction Info */}
                {viewingWithdrawal.externalTransactionId && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      Transaction ID
                    </div>
                    <div className="text-gray-800 font-mono text-sm break-all">
                      {viewingWithdrawal.externalTransactionId}
                    </div>
                  </div>
                )}

                {/* Periods */}
                {viewingWithdrawal.periods &&
                  viewingWithdrawal.periods.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Withdrawal Periods ({viewingWithdrawal.periods.length})
                      </h3>
                      <div className="space-y-3 max-h-[200px] overflow-y-auto">
                        {viewingWithdrawal.periods.map((period, idx) => {
                          console.log("Period data:", period);
                          return (
                            <div
                              key={idx}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-semibold text-gray-800">
                                  Period {idx + 1}
                                </div>
                                <div className="text-lg font-bold text-indigo-700">
                                  {formatCurrency(period.amount || period.netRevenue || 0)}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {period.start && period.end ? (
                                  <>
                                    {new Date(period.start).toLocaleDateString("vi-VN")} - {new Date(period.end).toLocaleDateString("vi-VN")}
                                  </>
                                ) : period.periodStartDate && period.periodEndDate ? (
                                  <>
                                    {new Date(period.periodStartDate).toLocaleDateString("vi-VN")} - {new Date(period.periodEndDate).toLocaleDateString("vi-VN")}
                                  </>
                                ) : (
                                  "Date not available"
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
                <button
                  onClick={() => setViewingWithdrawal(null)}
                  className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
            </>
          )}
        </div>
      </div>
    </PartnerTopLayout>
  );
}
