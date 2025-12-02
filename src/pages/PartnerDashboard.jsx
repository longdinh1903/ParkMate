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
                className="px-4 py-2 text-sm rounded-lg transition font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 flex items-center gap-2"
                title="Reset all filters and refresh data"
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
              {/* Revenue Cards - 3 cards in a row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-orange-100 text-xs font-medium uppercase tracking-wide">
                        Total Revenue
                      </p>
                      <p className="text-4xl font-bold mt-2">
                        {formatCurrency((statistics.sessionStatistics || statistics.sessionStatistic)?.sessionTotalAmount || 0)}
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <i className="ri-money-dollar-circle-line text-4xl"></i>
                    </div>
                  </div>
                </div>

                {/* Member Revenue */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-purple-100 text-xs font-medium uppercase tracking-wide">
                        Member Revenue
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency((statistics.sessionStatistics || statistics.sessionStatistic)?.memberTotalAmount || 0)}
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
                    <div className="bg-white/20 rounded-full p-3">
                      <i className="ri-vip-crown-line text-4xl"></i>
                    </div>
                  </div>
                </div>

                {/* Occasional Revenue */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">
                        Occasional Revenue
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {formatCurrency((statistics.sessionStatistics || statistics.sessionStatistic)?.occasionalTotalAmount || 0)}
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
                    <div className="bg-white/20 rounded-full p-3">
                      <i className="ri-user-line text-4xl"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Row - Sessions & Average Duration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {/* Active Sessions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-lg p-3">
                      <i className="ri-time-line text-2xl text-blue-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Active Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.activeSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Completed Sessions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-lg p-3">
                      <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.completedSessions || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 rounded-lg p-3">
                      <i className="ri-file-list-line text-2xl text-indigo-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Total Sessions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {((statistics.sessionStatistics || statistics.sessionStatistic)?.completedSessions || 0) +
                          ((statistics.sessionStatistics || statistics.sessionStatistic)?.activeSessions || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Average Duration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 rounded-lg p-3">
                      <i className="ri-timer-line text-2xl text-teal-600"></i>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs font-medium">Avg Duration</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {(statistics.sessionStatistics || statistics.sessionStatistic)?.averageDurationMinute
                          ? `${Math.round((statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinute)}m`
                          : "N/A"}
                      </p>
                      {(statistics.sessionStatistics || statistics.sessionStatistic)?.averageDurationMinuteGrowthRate !== undefined && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                          (statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <i className={`ri-arrow-${
                            (statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate >= 0 ? 'up' : 'down'
                          }-line`}></i>
                          {Math.abs((statistics.sessionStatistics || statistics.sessionStatistic).averageDurationMinuteGrowthRate)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Charts */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="ri-bar-chart-box-line text-indigo-600"></i>
                  Analytics Overview
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Session Distribution Pie Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <i className="ri-pie-chart-line text-indigo-500"></i>
                      Session Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={getSessionPieData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
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

                  {/* Vehicle Type Distribution */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <i className="ri-car-line text-indigo-500"></i>
                      Vehicle Types
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
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



              {/* Reservation Statistics - Collapsible */}
              {statistics?.reservationStatistic && (
                <div className="mb-6">
                  <div
                    onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 rounded-lg p-2">
                          <i className="ri-calendar-check-line text-2xl text-indigo-600"></i>
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">
                            Reservation Statistics
                          </h3>
                          <p className="text-sm text-gray-600">
                            Total: {(statistics.reservationStatistic?.pendingCount || 0) +
                              (statistics.reservationStatistic?.activeCount || 0) +
                              (statistics.reservationStatistic?.completedCount || 0) +
                              (statistics.reservationStatistic?.expiredCount || 0) +
                              (statistics.reservationStatistic?.cancelledCount || 0)} reservations • 
                            Revenue: {formatCurrency(statistics.reservationStatistic?.totalRevenue || 0)}
                          </p>
                        </div>
                      </div>
                      <i className={`ri-arrow-${showRevenueBreakdown ? 'up' : 'down'}-s-line text-2xl text-gray-400`}></i>
                    </div>
                  </div>

                  {showRevenueBreakdown && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {/* Pending */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-yellow-100 rounded p-2">
                              <i className="ri-time-line text-xl text-yellow-600"></i>
                            </div>
                            <p className="text-xs font-medium text-gray-600">Pending</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.pendingCount || 0}
                          </p>
                        </div>

                        {/* Active */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-blue-100 rounded p-2">
                              <i className="ri-calendar-check-line text-xl text-blue-600"></i>
                            </div>
                            <p className="text-xs font-medium text-gray-600">Active</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.activeCount || 0}
                          </p>
                        </div>

                        {/* Completed */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-green-100 rounded p-2">
                              <i className="ri-checkbox-circle-line text-xl text-green-600"></i>
                            </div>
                            <p className="text-xs font-medium text-gray-600">Completed</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.completedCount || 0}
                          </p>
                        </div>

                        {/* Expired */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-orange-100 rounded p-2">
                              <i className="ri-calendar-close-line text-xl text-orange-600"></i>
                            </div>
                            <p className="text-xs font-medium text-gray-600">Expired</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.expiredCount || 0}
                          </p>
                        </div>

                        {/* Cancelled */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-red-100 rounded p-2">
                              <i className="ri-close-circle-line text-xl text-red-600"></i>
                            </div>
                            <p className="text-xs font-medium text-gray-600">Cancelled</p>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.reservationStatistic?.cancelledCount || 0}
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
