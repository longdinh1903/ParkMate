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

        // Auto-select first lot if available
        if (lots.length > 0) {
          setSelectedLotId(lots[0].id);
        }
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
        name: "Completed",
        value: stats.completedSessions || 0,
        color: "#10b981",
      },
      { name: "Active", value: stats.activeSessions || 0, color: "#3b82f6" },
    ];
  };

  const getRevenueBarData = () => {
    // Check if API provides revenue trend data
    const revenueTrend = statistics?.revenueTrend || statistics?.dailyRevenue;
    
    if (revenueTrend && Array.isArray(revenueTrend)) {
      // Use real data from API if available
      return revenueTrend.map(item => ({
        day: new Date(item.date).toLocaleDateString("vi-VN", {
          day: "numeric",
          month: "short",
        }),
        revenue: item.totalAmount || item.revenue || 0,
        date: item.date,
      }));
    }

    // If no real data available, return empty array to hide chart
    return [];
  };

  const getVehicleTypeData = () => {
    const stats = statistics?.sessionStatistics || statistics?.sessionStatistic;
    if (!stats) return [];
    return [
      { type: "Motorbike", count: stats.motorbikeCount || 0, color: "#8b5cf6" },
      { type: "Car", count: stats.carCount || 0, color: "#ec4899" },
      { type: "Bike", count: stats.bikeCount || 0, color: "#f59e0b" },
      { type: "Other", count: stats.otherCount || 0, color: "#6b7280" },
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <i className="ri-bar-chart-box-line text-indigo-600"></i>
              Parking Lot Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              View revenue, sessions, and performance statistics
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Parking Lot Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Parking Lot
                </label>
                <select
                  value={selectedLotId || ""}
                  onChange={(e) => setSelectedLotId(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Select a parking lot --</option>
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
                  From
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.from}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.to}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Date Range Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={async () => {
                  // Reset everything to initial state
                  const to = new Date();
                  const from = new Date();
                  from.setDate(from.getDate() - 7);

                  setDateRange({
                    from: from.toISOString().split("T")[0] + "T00:00:00",
                    to: to.toISOString().split("T")[0] + "T23:59:59",
                  });
                  setActiveDateRange(7);

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

                    // Reset to first lot or keep current if it still exists
                    let lotToSelect = selectedLotId;
                    if (lots.length > 0) {
                      // Check if current lot still exists
                      const currentLotExists = lots.find(lot => lot.id === selectedLotId);
                      if (!currentLotExists) {
                        lotToSelect = lots[0].id;
                        setSelectedLotId(lotToSelect);
                      }
                    } else {
                      lotToSelect = null;
                      setSelectedLotId(null);
                    }

                    // Fetch statistics with reset date range and selected lot
                    if (lotToSelect) {
                      setLoading(true);
                      try {
                        const statsResponse = await statisticsApi.getParkingLotStats(
                          lotToSelect,
                          {
                            from: from.toISOString().split("T")[0] + "T00:00:00",
                            to: to.toISOString().split("T")[0] + "T23:59:59",
                          }
                        );

                        const data = statsResponse.data?.data || statsResponse.data;
                        console.log("Statistics data:", data);
                        setStatistics(data);
                      } catch (error) {
                        console.error("Error fetching statistics:", error);
                        showError(
                          error.response?.data?.message ||
                            "Failed to load statistics"
                        );
                      } finally {
                        setLoading(false);
                      }
                    }
                  } catch (error) {
                    console.error("Error refreshing parking lots:", error);
                    showError("Failed to refresh parking lots");
                  }
                }}
                className="px-4 py-2 text-sm rounded-lg transition font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 flex items-center gap-2"
                title="Reset filters and refresh all data"
              >
                <i className="ri-refresh-line"></i>
                Refresh
              </button>
              <button
                onClick={() => setQuickDateRange(0)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium ${
                  activeDateRange === 0
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setQuickDateRange(7)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium ${
                  activeDateRange === 7
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium ${
                  activeDateRange === 30
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className={`px-4 py-2 text-sm rounded-lg transition font-medium ${
                  activeDateRange === 90
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                }`}
              >
                Last 90 Days
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading statistics...</span>
            </div>
          )}

          {/* Statistics Cards */}
          {!loading && statistics && (
            <>
              {/* Charts Section - Hiển thị đầu tiên */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Session Distribution Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-pie-chart-line text-indigo-600"></i>
                    Session Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getSessionPieData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
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

                {/* Vehicle Type Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-car-line text-indigo-600"></i>
                    Vehicle Types
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getVehicleTypeData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6">
                        {getVehicleTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              {getRevenueBarData().length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-line-chart-line text-indigo-600"></i>
                    Revenue Trend
                    {activeDateRange === 0 && " (Today)"}
                    {activeDateRange === 7 && " (Last 7 Days)"}
                    {activeDateRange === 30 && " (Last 30 Days)"}
                    {activeDateRange === 90 && " (Last 90 Days)"}
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getRevenueBarData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        angle={activeDateRange > 7 ? -45 : 0}
                        textAnchor={activeDateRange > 7 ? "end" : "middle"}
                        height={activeDateRange > 7 ? 80 : 30}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-line-chart-line text-indigo-600"></i>
                    Revenue Trend
                  </h3>
                  <div className="flex flex-col items-center justify-center py-12">
                    <i className="ri-line-chart-line text-6xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 text-center">
                      Daily revenue trend data is not available yet.
                      <br />
                      <span className="text-sm">This feature will be available when the API provides detailed revenue breakdown by date.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Session Statistics */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="ri-file-list-3-line text-indigo-600"></i>
                  Session Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Completed Sessions */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                          Completed Sessions
                        </p>
                        <p className="text-5xl font-bold mt-3">
                          {(
                            statistics.sessionStatistics ||
                            statistics.sessionStatistic
                          )?.completedSessions || 0}
                        </p>
                      </div>
                      <div className="bg-white/20 rounded-full p-4">
                        <i className="ri-checkbox-circle-line text-5xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                          Active Sessions
                        </p>
                        <p className="text-5xl font-bold mt-3">
                          {(
                            statistics.sessionStatistics ||
                            statistics.sessionStatistic
                          )?.activeSessions || 0}
                        </p>
                      </div>
                      <div className="bg-white/20 rounded-full p-4">
                        <i className="ri-time-line text-5xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Total Sessions */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium uppercase tracking-wide">
                          Total Sessions
                        </p>
                        <p className="text-5xl font-bold mt-3">
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
                      <div className="bg-white/20 rounded-full p-4">
                        <i className="ri-file-list-line text-5xl"></i>
                      </div>
                    </div>
                  </div>

                  {/* Average Duration */}
                  <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-teal-100 text-sm font-medium uppercase tracking-wide">
                          Avg Duration
                        </p>
                        <p className="text-5xl font-bold mt-3">
                          {(statistics.sessionStatistics || statistics.sessionStatistic)?.averageDurationMinute
                            ? `${Math.round((statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinute)}m`
                            : "N/A"}
                        </p>
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.averageDurationMinuteGrowthRate !== undefined && (
                          <p className={`text-xs mt-2 flex items-center gap-1 ${
                            (statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                          }`}>
                            <i className={`ri-arrow-${
                              (statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate >= 0 ? 'up' : 'down'
                            }-line`}></i>
                            {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-white/20 rounded-full p-4">
                        <i className="ri-time-line text-5xl"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="mb-6">
                <div 
                  onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <i className="ri-money-dollar-circle-line text-3xl"></i>
                        <h2 className="text-2xl font-bold">Revenue Breakdown</h2>
                      </div>
                      <p className="text-orange-100 text-sm">
                        Total Session Revenue: {formatCurrency((statistics.sessionStatistics || statistics.sessionStatistic)?.sessionTotalAmount || 0)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <i className={`ri-arrow-${showRevenueBreakdown ? 'up' : 'down'}-s-line text-3xl`}></i>
                    </div>
                  </div>
                </div>

                {showRevenueBreakdown && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Member Revenue */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                            Member Revenue
                          </p>
                          <div className="bg-white/20 rounded-full p-2">
                            <i className="ri-vip-crown-line text-2xl"></i>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">
                          {formatCurrency(
                            (statistics.sessionStatistics || statistics.sessionStatistic)?.memberTotalAmount || 0
                          )}
                        </p>
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.memberTotalAmountGrowthRate !== undefined && (
                          <p className={`text-xs mt-2 flex items-center gap-1 ${
                            (statistics.sessionStatistics || statistics.sessionStatistic).memberTotalAmountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                          }`}>
                            <i className={`ri-arrow-${
                              (statistics.sessionStatistics || statistics.sessionStatistic).memberTotalAmountGrowthRate >= 0 ? 'up' : 'down'
                            }-line`}></i>
                            {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).memberTotalAmountGrowthRate)}%
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Occasional Revenue */}
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">
                            Occasional Revenue
                          </p>
                          <div className="bg-white/20 rounded-full p-2">
                            <i className="ri-user-line text-2xl"></i>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">
                          {formatCurrency(
                            (statistics.sessionStatistics || statistics.sessionStatistic)?.occasionalTotalAmount || 0
                          )}
                        </p>
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.occasionalTotalAmountGrowthRate !== undefined && (
                          <p className={`text-xs mt-2 flex items-center gap-1 ${
                            (statistics.sessionStatistics || statistics.sessionStatistic).occasionalTotalAmountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                          }`}>
                            <i className={`ri-arrow-${
                              (statistics.sessionStatistics || statistics.sessionStatistic).occasionalTotalAmountGrowthRate >= 0 ? 'up' : 'down'
                            }-line`}></i>
                            {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).occasionalTotalAmountGrowthRate)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle Types */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="ri-car-line text-indigo-600"></i>
                  Vehicle Types
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                  {/* Motorbike Count */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                          Motorbikes
                        </p>
                        <div className="bg-white/20 rounded-full p-2">
                          <i className="ri-motorbike-line text-2xl"></i>
                        </div>
                      </div>
                      <p className="text-4xl font-bold">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.motorbikeCount || 0}
                      </p>
                      {(statistics.sessionStatistics || statistics.sessionStatistic)?.motorbikeCountGrowthRate !== undefined && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          (statistics.sessionStatistics || statistics.sessionStatistic).motorbikeCountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          <i className={`ri-arrow-${
                            (statistics.sessionStatistics || statistics.sessionStatistic).motorbikeCountGrowthRate >= 0 ? 'up' : 'down'
                          }-line`}></i>
                          {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).motorbikeCountGrowthRate)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Car Count */}
                  <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-pink-100 text-xs font-medium uppercase tracking-wide">
                          Cars
                        </p>
                        <div className="bg-white/20 rounded-full p-2">
                          <i className="ri-car-line text-2xl"></i>
                        </div>
                      </div>
                      <p className="text-4xl font-bold">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.carCount || 0}
                      </p>
                      {(statistics.sessionStatistics || statistics.sessionStatistic)?.carCountGrowthRate !== undefined && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          (statistics.sessionStatistics || statistics.sessionStatistic).carCountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          <i className={`ri-arrow-${
                            (statistics.sessionStatistics || statistics.sessionStatistic).carCountGrowthRate >= 0 ? 'up' : 'down'
                          }-line`}></i>
                          {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).carCountGrowthRate)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bike Count */}
                  <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-yellow-100 text-xs font-medium uppercase tracking-wide">
                          Bikes
                        </p>
                        <div className="bg-white/20 rounded-full p-2">
                          <i className="ri-bike-line text-2xl"></i>
                        </div>
                      </div>
                      <p className="text-4xl font-bold">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.bikeCount || 0}
                      </p>
                      {(statistics.sessionStatistics || statistics.sessionStatistic)?.bikeCountGrowthRate !== undefined && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          (statistics.sessionStatistics || statistics.sessionStatistic).bikeCountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          <i className={`ri-arrow-${
                            (statistics.sessionStatistics || statistics.sessionStatistic).bikeCountGrowthRate >= 0 ? 'up' : 'down'
                          }-line`}></i>
                          {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).bikeCountGrowthRate)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Other Count */}
                  <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-100 text-xs font-medium uppercase tracking-wide">
                          Others
                        </p>
                        <div className="bg-white/20 rounded-full p-2">
                          <i className="ri-truck-line text-2xl"></i>
                        </div>
                      </div>
                      <p className="text-4xl font-bold">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.otherCount || 0}
                      </p>
                      {(statistics.sessionStatistics || statistics.sessionStatistic)?.otherCountGrowthRate !== undefined && (
                        <p className={`text-xs mt-2 flex items-center gap-1 ${
                          (statistics.sessionStatistics || statistics.sessionStatistic).otherCountGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                        }`}>
                          <i className={`ri-arrow-${
                            (statistics.sessionStatistics || statistics.sessionStatistic).otherCountGrowthRate >= 0 ? 'up' : 'down'
                          }-line`}></i>
                          {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).otherCountGrowthRate)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="ri-information-line text-indigo-600"></i>
                  Period Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">From:</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(dateRange.from).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">To:</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(dateRange.to).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">
                      Total Sessions:
                    </p>
                    <p className="font-semibold text-gray-900 text-2xl">
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">
                      Avg per Session:
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {(
                        statistics.sessionStatistics ||
                        statistics.sessionStatistic
                      )?.completedSessions > 0
                        ? formatCurrency(
                            ((
                              statistics.sessionStatistics ||
                              statistics.sessionStatistic
                            )?.sessionTotalAmount || 0) /
                              (
                                statistics.sessionStatistics ||
                                statistics.sessionStatistic
                              ).completedSessions
                          )
                        : formatCurrency(0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reservation Statistics */}
              {statistics?.reservationStatistic && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-calendar-check-line text-indigo-600"></i>
                    Reservation Statistics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Pending Reservations */}
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm font-medium uppercase tracking-wide">
                            Pending
                          </p>
                          <p className="text-5xl font-bold mt-3">
                            {statistics.reservationStatistic?.pendingCount || 0}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <i className="ri-time-line text-5xl"></i>
                        </div>
                      </div>
                    </div>

                    {/* Active Reservations */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
                            Active
                          </p>
                          <p className="text-5xl font-bold mt-3">
                            {statistics.reservationStatistic?.activeCount || 0}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <i className="ri-calendar-check-line text-5xl"></i>
                        </div>
                      </div>
                    </div>

                    {/* Completed Reservations */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium uppercase tracking-wide">
                            Completed
                          </p>
                          <p className="text-5xl font-bold mt-3">
                            {statistics.reservationStatistic?.completedCount ||
                              0}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <i className="ri-checkbox-circle-line text-5xl"></i>
                        </div>
                      </div>
                    </div>

                    {/* Expired Reservations */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm font-medium uppercase tracking-wide">
                            Expired
                          </p>
                          <p className="text-5xl font-bold mt-3">
                            {statistics.reservationStatistic?.expiredCount || 0}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <i className="ri-calendar-close-line text-5xl"></i>
                        </div>
                      </div>
                    </div>

                    {/* Cancelled Reservations */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-red-100 text-sm font-medium uppercase tracking-wide">
                            Cancelled
                          </p>
                          <p className="text-5xl font-bold mt-3">
                            {statistics.reservationStatistic?.cancelledCount ||
                              0}
                          </p>
                        </div>
                        <div className="bg-white/20 rounded-full p-4">
                          <i className="ri-close-circle-line text-5xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Revenue */}
                  <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
                          Total Reservation Revenue
                        </p>
                        <p className="text-4xl font-bold text-indigo-600">
                          {formatCurrency(
                            statistics.reservationStatistic?.totalRevenue || 0
                          )}
                        </p>
                      </div>
                      <div className="bg-indigo-100 rounded-full p-4">
                        <i className="ri-money-dollar-circle-line text-5xl text-indigo-600"></i>
                      </div>
                    </div>
                  </div>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <i className="ri-gift-line text-indigo-600"></i>
                        Subscription Packages
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        All subscription packages for your parking lot with
                        revenue details
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-indigo-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Package Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Package Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Active Users
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Total Revenue
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {allPackages.map((pkg, index) => (
                              <tr
                                key={index}
                                className={`hover:bg-gray-50 transition ${
                                  pkg.total === 0 ? "opacity-50" : ""
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <i className="ri-price-tag-3-line text-indigo-600 mr-2"></i>
                                    <span className="text-sm font-medium text-gray-900">
                                      {pkg.packageName}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-semibold text-green-600">
                                    {pkg.price
                                      ? `${pkg.price.toLocaleString()} ₫`
                                      : "-"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                      pkg.total > 0
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    <i className="ri-user-line mr-1"></i>
                                    {pkg.total}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="text-sm font-bold text-purple-600">
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
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <i className="ri-user-line mr-1"></i>
                            Total Active Subscribers:{" "}
                            <strong>
                              {allPackages.reduce(
                                (sum, pkg) => sum + pkg.total,
                                0
                              )}
                            </strong>
                          </p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-800">
                            <i className="ri-money-dollar-circle-line mr-1"></i>
                            Total Subscription Revenue:{" "}
                            <strong>
                              {formatCurrency(
                                allPackages.reduce(
                                  (sum, pkg) => sum + (pkg.totalAmount || 0),
                                  0
                                )
                              )}
                            </strong>
                          </p>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <i className="ri-database-2-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 text-lg font-medium">
                No statistics available
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Try selecting a different date range or parking lot
              </p>
            </div>
          )}

          {/* No Lot Selected */}
          {!loading && !selectedLotId && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <i className="ri-bar-chart-box-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 text-lg font-medium">
                Please select a parking lot
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Choose a parking lot from the dropdown above to view statistics
              </p>
            </div>
          )}
        </div>
      </div>
    </PartnerTopLayout>
  );
}
