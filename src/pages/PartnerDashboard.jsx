import React, { useState, useEffect } from "react";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import statisticsApi from "../api/statisticsApi";
import parkingLotApi from "../api/parkingLotApi";
import { showError } from "../utils/toastUtils";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PartnerDashboard() {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(7); // Track active quick date range
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    from:
      new Date(new Date().setDate(new Date().getDate() - 7))
        .toISOString()
        .split("T")[0] + "T00:00:00",
    to: new Date().toISOString().split("T")[0] + "T23:59:59",
  });

  // Fetch statistics when lot or date range changes
  useEffect(() => {
    if (selectedLotId) {
      const fetchStatistics = async () => {
        setLoading(true);
        try {
          const response = await statisticsApi.getParkingLotStats(
            selectedLotId,
            {
              from: dateRange.from,
              to: dateRange.to,
            }
          );

          const data = response.data?.data || response.data;
          console.log("Statistics data:", data);
          console.log("sessionStatistics:", data?.sessionStatistics);
          console.log("sessionStatistic:", data?.sessionStatistic);
          console.log("subscriptionStatistic:", data?.subscriptionStatistic);
          console.log(
            "userSubscriptionStatistics:",
            data?.subscriptionStatistic?.userSubscriptionStatistics
          );
          setStatistics(data);
        } catch (error) {
          console.error("Error fetching statistics:", error);
          showError(
            error.response?.data?.message || "Failed to load statistics"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchStatistics();
    }
  }, [selectedLotId, dateRange]);

  // Fetch partner's parking lots
  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const response = await parkingLotApi.getAllByPartner();
        const lots =
          response.data?.data?.content ||
          response.data?.data ||
          response.data ||
          [];
        console.log("Parking lots:", lots);
        setParkingLots(lots);
      } catch (error) {
        console.error("Error fetching parking lots:", error);
        showError("Failed to load parking lots");
      }
    };

    fetchParkingLots();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  // Prepare chart data
  const getSessionPieData = () => {
    const stats = statistics?.sessionStatistics || statistics?.sessionStatistic;
    if (!stats) return [];
    return [
      {
        name: "Hoàn thành",
        value: stats.completedSessions || 0,
        color: "#10b981",
      },
      { name: "Đang hoạt động", value: stats.activeSessions || 0, color: "#3b82f6" },
    ];
  };

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
    setActiveDateRange(null); // Clear active quick range when manually changing dates
  };

  const setQuickDateRange = (days) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    setDateRange({
      from: from.toISOString().split("T")[0] + "T00:00:00",
      to: to.toISOString().split("T")[0] + "T23:59:59",
    });
    setActiveDateRange(days);
  };

  return (
    <PartnerTopLayout>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <i className="ri-bar-chart-box-line text-indigo-600"></i>
              Thống kê
            </h1>
            <p className="text-gray-600 mt-1">Xem báo cáo thống kê và phân tích dữ liệu bãi đỗ xe của bạn</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <i className="ri-filter-3-line text-indigo-600 text-lg"></i>
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn bãi đỗ xe
                </label>
                <select
                  value={selectedLotId || ""}
                  onChange={(e) => setSelectedLotId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all"
                >
                  <option value="">-- Chọn một bãi đỗ xe --</option>
                  {parkingLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.from}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến ngày
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.to}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all"
                />
              </div>
            </div>

            {/* Quick Date Range Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={async () => {
                  // Reset all fields to initial state
                  const to = new Date();
                  const from = new Date();
                  from.setDate(from.getDate() - 7);

                  setDateRange({
                    from: from.toISOString().split("T")[0] + "T00:00:00",
                    to: to.toISOString().split("T")[0] + "T23:59:59",
                  });
                  setActiveDateRange(7);

                  // Clear parking lot selection
                  setSelectedLotId(null);

                  // Clear statistics
                  setStatistics(null);

                  // Clear any expanded sections
                  setShowRevenueBreakdown(false);

                  // Refresh parking lots list
                  try {
                    const response = await parkingLotApi.getAllByPartner();
                    const lots =
                      response.data?.data?.content ||
                      response.data?.data ||
                      response.data ||
                      [];
                    console.log("Refreshed parking lots:", lots);
                    setParkingLots(lots);
                  } catch (error) {
                    console.error("Error refreshing parking lots:", error);
                    showError("Failed to refresh parking lots");
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg transition font-medium bg-green-600 hover:bg-green-500 text-white flex items-center gap-2 cursor-pointer"
                title="Reset all filters and refresh data"
              >
                <i className="ri-refresh-line"></i>
                Làm mới
              </button>
              <button
                onClick={() => setQuickDateRange(0)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                  activeDateRange === 0
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setQuickDateRange(7)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                  activeDateRange === 7
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                7 ngày qua
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                  activeDateRange === 30
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                30 ngày qua
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                  activeDateRange === 90
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                90 ngày qua
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Đang tải thống kê...</span>
            </div>
          )}

          {/* Statistics Cards */}
          {!loading && statistics && (
            <>
              {/* Revenue Cards - 3 cards in a row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Revenue */}
                <div className="relative bg-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
                          💰 Tổng doanh thu
                        </p>
                        <p className="text-4xl font-extrabold mt-1 drop-shadow-lg">
                          {formatCurrency(
                            (
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            )?.sessionTotalAmount || 0
                          )}
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors">
                        <i className="ri-money-dollar-circle-fill text-5xl drop-shadow-lg"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Member Revenue */}
                <div className="relative bg-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-purple-100 text-xs font-semibold uppercase tracking-wider mb-2">
                          👑 Doanh thu thành viên
                        </p>
                        <p className="text-4xl font-extrabold mt-1 drop-shadow-lg">
                          {formatCurrency(
                            (
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            )?.memberTotalAmount || 0
                          )}
                        </p>
                        {(
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.memberTotalAmountGrowthRate !== undefined && (
                          <div
                            className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).memberTotalAmountGrowthRate >= 0
                                ? "bg-green-500/30 text-green-100"
                                : "bg-red-500/30 text-red-100"
                            }`}
                          >
                            <i
                              className={`ri-arrow-${
                                (
                                  statistics.sessionStatistics ||
                                  statistics.sessionStatistic
                                ).memberTotalAmountGrowthRate >= 0
                                  ? "up"
                                  : "down"
                              }-line text-sm`}
                            ></i>
                            {Math.abs(
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).memberTotalAmountGrowthRate
                            ).toFixed(1)}
                            %
                          </div>
                        )}
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors">
                        <i className="ri-vip-crown-fill text-5xl drop-shadow-lg"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Occasional Revenue */}
                <div className="relative bg-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-2">
                          🚶 Doanh thu vãng lai
                        </p>
                        <p className="text-4xl font-extrabold mt-1 drop-shadow-lg">
                          {formatCurrency(
                            (
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            )?.occasionalTotalAmount || 0
                          )}
                        </p>
                        {(
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.occasionalTotalAmountGrowthRate !== undefined && (
                          <div
                            className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).occasionalTotalAmountGrowthRate >= 0
                                ? "bg-green-500/30 text-green-100"
                                : "bg-red-500/30 text-red-100"
                            }`}
                          >
                            <i
                              className={`ri-arrow-${
                                (
                                  statistics.sessionStatistics ||
                                  statistics.sessionStatistic
                                ).occasionalTotalAmountGrowthRate >= 0
                                  ? "up"
                                  : "down"
                              }-line text-sm`}
                            ></i>
                            {Math.abs(
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).occasionalTotalAmountGrowthRate
                            ).toFixed(1)}
                            %
                          </div>
                        )}
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-colors">
                        <i className="ri-user-fill text-5xl drop-shadow-lg"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Row - Sessions & Average Duration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {/* Active Sessions */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-xl p-3.5 group-hover:scale-110 transition-transform duration-300">
                      <i className="ri-time-line text-2xl text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                        Đang hoạt động
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.activeSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completed Sessions */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-xl p-3.5 group-hover:scale-110 transition-transform duration-300">
                      <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                        Hoàn thành
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.completedSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-xl p-3.5 group-hover:scale-110 transition-transform duration-300">
                      <i className="ri-file-list-line text-2xl text-indigo-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                        Tổng phiên
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {((
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.completedSessions || 0) +
                          ((
                            statistics.sessionStatistics ||
                            statistics.sessionStatistic
                          )?.activeSessions || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Average Duration */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-xl hover:border-teal-200 transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 rounded-xl p-3.5 group-hover:scale-110 transition-transform duration-300">
                      <i className="ri-timer-line text-2xl text-teal-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                        Thời lượng TB
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {(
                          statistics.sessionStatistics ||
                          statistics.sessionStatistic
                        )?.averageDurationMinute
                          ? `${Math.round(
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).averageDurationMinute
                            )}m`
                          : "N/A"}
                      </p>
                      {(
                        statistics.sessionStatistics ||
                        statistics.sessionStatistic
                      )?.averageDurationMinuteGrowthRate !== undefined && (
                        <div
                          className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                            (
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            ).averageDurationMinuteGrowthRate >= 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <i
                            className={`ri-arrow-${
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).averageDurationMinuteGrowthRate >= 0
                                ? "up"
                                : "down"
                            }-line`}
                          ></i>
                          {Math.abs(
                            (
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            ).averageDurationMinuteGrowthRate
                          )}
                          %
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-xl p-2.5">
                    <i className="ri-bar-chart-box-line text-2xl text-indigo-600"></i>
                  </div>
                  Phân tích chi tiết
                </h2>
                {/* Session Distribution Pie Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2.5">
                    <div className="bg-indigo-100 rounded-lg p-2">
                      <i className="ri-pie-chart-line text-xl text-indigo-600"></i>
                    </div>
                    Phân bố phiên
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={getSessionPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getSessionPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reservation Statistics - Collapsible */}
              {statistics?.reservationStatistic && (
                <div className="mb-8">
                  <div
                    onClick={() =>
                      setShowRevenueBreakdown(!showRevenueBreakdown)
                    }
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 rounded-xl p-3 group-hover:scale-110 transition-transform duration-300">
                          <i className="ri-calendar-check-line text-3xl text-indigo-600"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            Thống kê đặt chỗ
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                              {(statistics.reservationStatistic?.pendingCount ||
                                0) +
                                (statistics.reservationStatistic?.activeCount ||
                                  0) +
                                (statistics.reservationStatistic
                                  ?.completedCount || 0) +
                                (statistics.reservationStatistic
                                  ?.expiredCount || 0) +
                                (statistics.reservationStatistic
                                  ?.cancelledCount || 0)}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                            <span className="font-semibold text-indigo-600">
                              {formatCurrency(
                                statistics.reservationStatistic?.totalRevenue ||
                                  0
                              )}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>Tổng doanh thu từ đặt chỗ</span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-full p-2 group-hover:bg-indigo-50 transition-colors">
                        <i
                          className={`ri-arrow-${
                            showRevenueBreakdown ? "up" : "down"
                          }-s-line text-2xl text-gray-600 group-hover:text-indigo-600 transition-colors`}
                        ></i>
                      </div>
                    </div>
                  </div>

                  {showRevenueBreakdown && (
                    <div className="mt-5">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Pending */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:border-yellow-200 transition-all duration-300 transform hover:-translate-y-1 group">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                              <i className="ri-time-line text-xl text-yellow-600"></i>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Chờ xử lý
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.pendingCount || 0}
                          </p>
                        </div>

                        {/* Active */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                              <i className="ri-calendar-check-line text-xl text-blue-600"></i>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Đang hoạt động
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.activeCount || 0}
                          </p>
                        </div>

                        {/* Completed */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1 group">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                              <i className="ri-checkbox-circle-line text-xl text-green-600"></i>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Hoàn Thành
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.completedCount ||
                              0}
                          </p>
                        </div>

                        {/* Expired */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform hover:-translate-y-1 group">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                              <i className="ri-calendar-close-line text-xl text-orange-600"></i>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Hết hạn
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.expiredCount || 0}
                          </p>
                        </div>

                        {/* Cancelled */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-xl hover:border-red-200 transition-all duration-300 transform hover:-translate-y-1 group">
                          <div className="flex items-center gap-2.5 mb-3">
                            <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-2.5 group-hover:scale-110 transition-transform">
                              <i className="ri-close-circle-line text-xl text-red-600"></i>
                            </div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Đã hủy
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.cancelledCount ||
                              0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Statistics */}
              {(() => {
                console.log("Rendering subscription section...");
                console.log(
                  "All userSubscriptionStatistics:",
                  statistics?.subscriptionStatistic?.userSubscriptionStatistics
                );
                const allPackages =
                  statistics?.subscriptionStatistic
                    ?.userSubscriptionStatistics || [];
                console.log("All packages:", allPackages);
                const packagesWithUsers = allPackages.filter(
                  (pkg) => pkg.total > 0
                );
                console.log("Packages with users:", packagesWithUsers);

                return (
                  allPackages.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-2.5">
                          <i className="ri-gift-line text-2xl text-purple-600"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Gói đăng ký
                          </h3>
                          <p className="text-sm text-gray-600">
                            Thông tin chi tiết về các gói đăng ký và doanh thu
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200">
                        <div className="overflow-x-auto max-h-[240px] overflow-y-hidden hover:overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Tên gói
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Giá gói
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Người dùng hoạt động
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                  Tổng doanh thu
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {allPackages.map((pkg, index) => (
                                <tr
                                  key={index}
                                  className={`hover:bg-indigo-50/50 transition-colors duration-200 ${
                                    pkg.total === 0 ? "opacity-50" : ""
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-indigo-100 rounded-lg p-1.5">
                                        <i className="ri-price-tag-3-line text-indigo-600"></i>
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {pkg.packageName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-bold text-emerald-600">
                                      {pkg.price
                                        ? `${pkg.price.toLocaleString()} ₫`
                                        : "-"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${
                                        pkg.total > 0
                                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                          : "bg-gray-200 text-gray-600"
                                      }`}
                                    >
                                      <i className="ri-user-line"></i>
                                      {pkg.total}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-extrabold text-purple-600">
                                      {pkg.totalAmount
                                        ? `${pkg.totalAmount.toLocaleString()} ₫`
                                        : "-"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="relative p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                          <div className="relative z-10 flex items-center gap-3">
                            <div className="bg-blue-500 rounded-xl p-3">
                              <i className="ri-user-line text-2xl text-white"></i>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                Tổng người đăng ký
                              </p>
                              <p className="text-2xl font-extrabold text-blue-900">
                                {allPackages.reduce(
                                  (sum, pkg) => sum + pkg.total,
                                  0
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="relative p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/30 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                          <div className="relative z-10 flex items-center gap-3">
                            <div className="bg-purple-500 rounded-xl p-3">
                              <i className="ri-money-dollar-circle-line text-2xl text-white"></i>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">
                                Doanh thu đăng ký
                              </p>
                              <p className="text-2xl font-extrabold text-purple-900">
                                {formatCurrency(
                                  allPackages.reduce(
                                    (sum, pkg) => sum + (pkg.totalAmount || 0),
                                    0
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                );
              })()}
            </>
          )}

          {/* Empty State */}
          {!loading && !statistics && selectedLotId && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-md">
                <i className="ri-database-2-line text-6xl text-gray-400"></i>
              </div>
              <p className="text-gray-900 text-xl font-bold mb-2">
                Không có thống kê
              </p>
              <p className="text-gray-600 text-sm">
                Thử chọn khoảng thời gian hoặc bãi đỗ xe khác
              </p>
            </div>
          )}

          {/* No Lot Selected */}
          {!loading && !selectedLotId && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="bg-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-md">
                <i className="ri-parking-box-line text-6xl text-indigo-600"></i>
              </div>
              <p className="text-gray-900 text-xl font-bold mb-2">
                Chọn bãi đỗ xe
              </p>
              <p className="text-gray-600 text-sm">
                Vui lòng chọn một bãi đỗ xe để xem thống kê
              </p>
            </div>
          )}
        </div>
      </div>
    </PartnerTopLayout>
  );
}
