import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../layouts/AdminLayout";
import statisticsApi from "../api/statisticsApi";
import { showError } from "../utils/toastUtils";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0] + "T00:00:00",
    to: new Date().toISOString().split("T")[0] + "T23:59:59",
  });
  const [activeDateRange, setActiveDateRange] = useState(30);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await statisticsApi.getPlatformStats({
        from: dateRange.from,
        to: dateRange.to,
      });
      setStats(response?.data?.data || response?.data);
    } catch (error) {
      console.error("Error fetching platform statistics:", error);
      showError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
    setActiveDateRange(null);
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const COLORS = {
    operational: "#3b82f6",
    subscription: "#a855f7",
    session: "#f97316",
    reservation: "#06b6d4",
  };

  // Partner chart colors - map to Active, Suspended, Pending
  const PARTNER_COLORS = ["#10b981", "#ef4444", "#f59e0b"]; // green, red, yellow
  // Lot chart colors - map to Active, Pending, Maintenance, Preparing
  const LOT_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#f97316"]; // green, yellow, red, orange

  const StatCard = ({ title, value, icon, gradient, subValue, growth, trend, accent }) => (
    <div
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group cursor-pointer border-l-4"
      style={accent ? { borderLeftColor: accent } : {}}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div
          className={`w-14 h-14 rounded-xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
          style={accent ? { boxShadow: `0 6px 12px -6px ${accent}` } : {}}
        >
          <i className={`${icon} text-2xl text-white`}></i>
        </div>
      </div>

      {growth !== undefined && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              trend === "up"
                ? "text-green-600"
                : trend === "down"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {trend === "up" && <i className="ri-arrow-up-line"></i>}
            {trend === "down" && <i className="ri-arrow-down-line"></i>}
            {growth}%
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      {/* Sticky Header Section (full-bleed) */}
      <div className="sticky top-0 z-20 mb-6 -mx-6 px-6">
        <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm py-4 px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <i className="ri-dashboard-fill text-2xl"></i>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">Platform Dashboard</h1>
              <p className="text-sm text-gray-500 mt-0.5 truncate">Comprehensive overview of ParkMate ecosystem performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <i className="ri-calendar-line text-orange-600 text-xl"></i>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={dateRange.from.slice(0, 16)}
                  onChange={(e) => handleDateChange("from", e.target.value + ":00")}
                  className="text-sm bg-transparent border-none p-0 focus:outline-none cursor-pointer"
                  aria-label="From date"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="datetime-local"
                  value={dateRange.to.slice(0, 16)}
                  onChange={(e) => handleDateChange("to", e.target.value + ":00")}
                  className="text-sm bg-transparent border-none p-0 focus:outline-none cursor-pointer"
                  aria-label="To date"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const to = new Date();
                const from = new Date();
                from.setMonth(from.getMonth() - 1);
                setDateRange({
                  from: from.toISOString().split("T")[0] + "T00:00:00",
                  to: to.toISOString().split("T")[0] + "T23:59:59",
                });
                setActiveDateRange(30);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-white border border-gray-200 hover:bg-gray-50 shadow-sm"
              title="Reset filters"
            >
              <i className="ri-refresh-line"></i>
            </button>

            <div className="flex items-center gap-2 bg-white rounded-full p-1.5 border border-gray-100 shadow-sm">
              <button
                onClick={() => setQuickDateRange(0)}
                className={`text-sm px-3 py-1 rounded-full transition ${activeDateRange === 0 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 0}
              >
                Today
              </button>
              <button
                onClick={() => setQuickDateRange(7)}
                className={`text-sm px-3 py-1 rounded-full transition ${activeDateRange === 7 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 7}
              >
                7d
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className={`text-sm px-3 py-1 rounded-full transition ${activeDateRange === 30 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 30}
              >
                30d
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className={`text-sm px-3 py-1 rounded-full transition ${activeDateRange === 90 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 90}
              >
                90d
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 pb-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-4 font-medium">Loading dashboard data...</p>
              </div>
            ) : stats ? (
              <>
                {/* Revenue Overview with Charts */}
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-money-dollar-circle-line text-green-600"></i>
                    Revenue Overview
                  </h2>

                  {/* Revenue Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                      title="Total Platform Revenue"
                      value={formatCurrency(stats.revenue?.totalPlatformRevenue)}
                      icon="ri-hand-coin-fill"
                      gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                      growth={stats.revenue?.platformRevenueGrowthRate}
                      trend={stats.revenue?.platformRevenueGrowthRate > 0 ? 'up' : 'down'}
                    />
                    <StatCard
                      title="Operational Fee"
                      value={formatCurrency(stats.revenue?.totalOperationalFee)}
                      icon="ri-settings-3-fill"
                      gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                      growth={stats.revenue?.operationalGrowthRate}
                      trend={stats.revenue?.operationalGrowthRate > 0 ? 'up' : 'down'}
                    />
                    <StatCard
                      title="Subscription Revenue"
                      value={formatCurrency(stats.revenue?.totalSubscription)}
                      icon="ri-vip-crown-fill"
                      gradient="bg-gradient-to-br from-purple-500 to-pink-600"
                      growth={stats.revenue?.subscriptionGrowthRate}
                      trend={stats.revenue?.subscriptionGrowthRate > 0 ? 'up' : 'down'}
                    />
                    <StatCard
                      title="Session Revenue"
                      value={formatCurrency(stats.revenue?.totalSessionRevenue)}
                      icon="ri-time-fill"
                      gradient="bg-gradient-to-br from-orange-500 to-red-600"
                      growth={stats.revenue?.sessionRevenueGrowthRate}
                      trend={stats.revenue?.sessionRevenueGrowthRate > 0 ? 'up' : 'down'}
                    />
                  </div>

                  {/* Revenue Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="ri-pie-chart-2-line text-orange-600"></i>
                        Revenue Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Operational', value: stats.revenue?.totalOperationalFee || 0 },
                              { name: 'Subscription', value: stats.revenue?.totalSubscription || 0 },
                              { name: 'Session', value: stats.revenue?.totalSessionRevenue || 0 },
                              { name: 'Reservation', value: stats.revenue?.totalReservationRevenue || 0 },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.values(COLORS).map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="ri-bar-chart-box-line text-green-600"></i>
                        Revenue Growth Rate (%)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            { name: 'Operational', growth: stats.revenue?.operationalGrowthRate || 0 },
                            { name: 'Subscription', growth: stats.revenue?.subscriptionGrowthRate || 0 },
                            { name: 'Session', growth: stats.revenue?.sessionRevenueGrowthRate || 0 },
                            { name: 'Reservation', growth: stats.revenue?.reservationGrowthRate || 0 },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip formatter={(value) => `${value}%`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Bar dataKey="growth" radius={[8, 8, 0, 0]}>
                            {Object.values(COLORS).map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Partners Overview with Chart */}
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-building-line text-orange-600"></i>
                    Partners
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Total Partners" value={formatNumber(stats.partners?.total)} icon="ri-building-fill" gradient="bg-gradient-to-br from-blue-500 to-cyan-600" accent="#3b82f6" />
                        <StatCard title="Active Partners" value={formatNumber(stats.partners?.activeTotal)} icon="ri-checkbox-circle-fill" gradient="bg-gradient-to-br from-green-500 to-emerald-600" accent={PARTNER_COLORS[0]} />
                        <StatCard title="Suspended Partners" value={formatNumber(stats.partners?.suspendedTotal)} icon="ri-pause-circle-fill" gradient="bg-gradient-to-br from-red-500 to-rose-600" accent={PARTNER_COLORS[1]} />
                        <StatCard title="Pending Registrations" value={formatNumber(stats.partners?.pendingRegistrations)} icon="ri-time-fill" gradient="bg-gradient-to-br from-yellow-500 to-amber-600" accent={PARTNER_COLORS[2]} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Status</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: stats.partners?.activeTotal || 0 },
                              { name: 'Suspended', value: stats.partners?.suspendedTotal || 0 },
                              { name: 'Pending', value: stats.partners?.pendingRegistrations || 0 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {PARTNER_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Users Overview */}
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-user-3-line text-indigo-600"></i>
                    Users
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Total Users" value={formatNumber(stats.users?.total)} icon="ri-user-3-fill" gradient="bg-gradient-to-br from-indigo-500 to-purple-600" subValue={`${formatNumber(stats.users?.newThisPeriod)} new this period`} />
                  </div>
                </section>

                {/* Parking Lots Overview with Chart */}
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-parking-box-line text-blue-600"></i>
                    Parking Lots
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <StatCard title="Total Lots" value={formatNumber(stats.lots?.total)} icon="ri-parking-box-fill" gradient="bg-gradient-to-br from-blue-500 to-cyan-600" accent="#3b82f6" />
                      <StatCard title="Active Lots" value={formatNumber(stats.lots?.activeTotal)} icon="ri-checkbox-circle-fill" gradient="bg-gradient-to-br from-green-500 to-emerald-600" accent={LOT_COLORS[0]} />
                      <StatCard title="Pending Lots" value={formatNumber(stats.lots?.pendingTotal)} icon="ri-time-fill" gradient="bg-gradient-to-br from-yellow-500 to-amber-600" accent={LOT_COLORS[1]} />
                      <StatCard title="Under Maintenance" value={formatNumber(stats.lots?.underMaintenanceTotal)} icon="ri-tools-fill" gradient="bg-gradient-to-br from-red-500 to-rose-600" accent={LOT_COLORS[2]} />
                      <StatCard title="Preparing" value={formatNumber(stats.lots?.preparingTotal)} icon="ri-loader-fill" gradient="bg-gradient-to-br from-orange-500 to-red-600" accent={LOT_COLORS[3]} />
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lot Status</h3>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: stats.lots?.activeTotal || 0 },
                              { name: 'Pending', value: stats.lots?.pendingTotal || 0 },
                              { name: 'Maintenance', value: stats.lots?.underMaintenanceTotal || 0 },
                              { name: 'Preparing', value: stats.lots?.preparingTotal || 0 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {LOT_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Quick Stats Summary */}
                <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                  <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <i className="ri-pie-chart-fill"></i>
                    Quick Statistics
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.revenue?.totalPlatformRevenue)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-xs text-gray-600 mb-1">Active Partners</p>
                      <p className="text-xl font-bold text-green-600">{formatNumber(stats.partners?.activeTotal)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-xs text-gray-600 mb-1">Total Users</p>
                      <p className="text-xl font-bold text-indigo-600">{formatNumber(stats.users?.total)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-xs text-gray-600 mb-1">Active Lots</p>
                      <p className="text-xl font-bold text-green-600">{formatNumber(stats.lots?.activeTotal)}</p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="text-center py-20">
                <i className="ri-database-2-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">No data available</p>
              </div>
            )}
      </div>
    </AdminLayout>
  );
}
