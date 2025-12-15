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
    from:
      new Date(new Date().setMonth(new Date().getMonth() - 1))
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
      showError("Không thể tải thống kê tổng quan");
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

  const StatCard = ({
    title,
    value,
    icon,
    gradient,
    subValue,
    growth,
    trend,
    accent,
  }) => (
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
          <span className="text-xs text-gray-500">so với kỳ trước</span>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <i className="ri-dashboard-3-line text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tổng quan hệ thống</h1>
            <p className="text-gray-500 mt-1">Theo dõi thống kê và doanh thu nền tảng</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <i className="ri-calendar-2-line text-orange-600 text-lg"></i>
              <select
                value={
                  activeDateRange === "month"
                    ? new Date(dateRange.from).getMonth() + 1
                    : ""
                }
                onChange={(e) => {
                  const selectedMonth = parseInt(e.target.value);
                  if (!selectedMonth) return;

                  const year = new Date().getFullYear();

                  // First day of selected month at 00:00:00
                  const firstDay = new Date(
                    year,
                    selectedMonth - 1,
                    1,
                    0,
                    0,
                    0
                  );

                  // Last day of selected month at 23:59:59
                  const lastDay = new Date(year, selectedMonth, 0, 23, 59, 59);

                  // Format dates in local timezone (not UTC)
                  const formatLocalDateTime = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const hours = String(date.getHours()).padStart(2, "0");
                    const minutes = String(date.getMinutes()).padStart(2, "0");
                    const seconds = String(date.getSeconds()).padStart(2, "0");
                    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                  };

                  setDateRange({
                    from: formatLocalDateTime(firstDay),
                    to: formatLocalDateTime(lastDay),
                  });
                  setActiveDateRange("month");
                }}
                className="text-sm bg-transparent border-none outline-none cursor-pointer font-medium text-gray-700"
              >
                <option value="">Lọc Theo Tháng</option>
                <option value="1">Tháng 1</option>
                <option value="2">Tháng 2</option>
                <option value="3">Tháng 3</option>
                <option value="4">Tháng 4</option>
                <option value="5">Tháng 5</option>
                <option value="6">Tháng 6</option>
                <option value="7">Tháng 7</option>
                <option value="8">Tháng 8</option>
                <option value="9">Tháng 9</option>
                <option value="10">Tháng 10</option>
                <option value="11">Tháng 11</option>
                <option value="12">Tháng 12</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Từ ngày
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.from.slice(0, 16)}
                  onChange={(e) =>
                    handleDateChange("from", e.target.value + ":00")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Đến ngày
                </label>
                <input
                  type="datetime-local"
                  value={dateRange.to.slice(0, 16)}
                  onChange={(e) =>
                    handleDateChange("to", e.target.value + ":00")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
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
              className="px-4 py-2 text-sm rounded-lg transition font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 flex items-center gap-2 cursor-pointer"
              title="Đặt lại về 30 ngày trước"
            >
              <i className="ri-refresh-line"></i>
              Làm mới
            </button>

            {/* Quick Date Range Buttons */}
            <button
              onClick={() => setQuickDateRange(0)}
              className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                activeDateRange === 0
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setQuickDateRange(7)}
              className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                activeDateRange === 7
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setQuickDateRange(30)}
              className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                activeDateRange === 30
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700"
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setQuickDateRange(90)}
              className={`px-4 py-2 text-sm rounded-lg transition font-medium cursor-pointer ${
                activeDateRange === 90
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700"
              }`}
            >
              90 ngày qua
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-8 pb-8">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-100"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-orange-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium animate-pulse">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : stats ? (
          <>
            {/* Revenue Overview with Charts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-green-100 rounded-xl p-2.5">
                  <i className="ri-money-dollar-circle-line text-2xl text-green-600"></i>
                </div>
                Tổng Quan Doanh Thu
              </h2>

              {/* Total Revenue Card - Highlighted */}
              <div className="mb-8">
                <div className="relative bg-orange-500 rounded-2xl shadow-xl p-8 text-white transform hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-2">
                          💰 Tổng Doanh Thu Nền Tảng
                        </p>
                        <h3 className="text-5xl font-extrabold mb-2 drop-shadow-lg">
                          {formatCurrency(stats.revenue?.totalPlatformRevenue)}
                        </h3>
                        {stats.revenue?.platformRevenueGrowthRate !==
                          undefined && (
                          <div
                            className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold ${
                              stats.revenue?.platformRevenueGrowthRate >= 0
                                ? "bg-green-500/30 text-green-100"
                                : "bg-red-500/30 text-red-100"
                            }`}
                          >
                            <i
                              className={`ri-arrow-${
                                stats.revenue?.platformRevenueGrowthRate >= 0
                                  ? "up"
                                  : "down"
                              }-line text-sm`}
                            ></i>
                            {Math.abs(stats.revenue?.platformRevenueGrowthRate)}
                            %
                          </div>
                        )}
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 group-hover:bg-white/30 transition-colors">
                        <i className="ri-hand-coin-fill text-6xl drop-shadow-lg"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2.5">
                    <div className="bg-orange-100 rounded-lg p-2">
                      <i className="ri-pie-chart-2-line text-xl text-orange-600"></i>
                    </div>
                    Phân Bổ Doanh Thu
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Phí Vận Hành",
                            value: stats.revenue?.totalOperationalFee || 0,
                          },
                          {
                            name: "Gói Đăng Ký",
                            value: stats.revenue?.totalSubscription || 0,
                          },
                          {
                            name: "Phiên Đỗ Xe",
                            value: stats.revenue?.totalSessionRevenue || 0,
                          },
                          {
                            name: "Đặt Chỗ",
                            value: stats.revenue?.totalReservationRevenue || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.values(COLORS).map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2.5">
                    <div className="bg-green-100 rounded-lg p-2">
                      <i className="ri-bar-chart-box-line text-xl text-green-600"></i>
                    </div>
                    Chi Tiết & Tăng Trưởng Doanh Thu
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[
                        {
                          name: "Phí Vận Hành",
                          amount: stats.revenue?.totalOperationalFee || 0,
                          growth: stats.revenue?.operationalGrowthRate || 0,
                        },
                        {
                          name: "Gói Đăng Ký",
                          amount: stats.revenue?.totalSubscription || 0,
                          growth: stats.revenue?.subscriptionGrowthRate || 0,
                        },
                        {
                          name: "Phiên Đỗ Xe",
                          amount: stats.revenue?.totalSessionRevenue || 0,
                          growth: stats.revenue?.sessionRevenueGrowthRate || 0,
                        },
                        {
                          name: "Đặt Chỗ",
                          amount: stats.revenue?.totalReservationRevenue || 0,
                          growth: stats.revenue?.reservationGrowthRate || 0,
                        },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="amount"
                        name="Số Tiền"
                        radius={[8, 8, 0, 0]}
                      >
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="bg-orange-100 rounded-xl p-2.5">
                  <i className="ri-building-line text-2xl text-orange-600"></i>
                </div>
                Đối Tác & Bãi Đỗ Xe
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Partners Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <i className="ri-building-fill text-xl text-blue-600"></i>
                      </div>
                      Trạng Thái Đối Tác
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Tổng
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatNumber(stats.partners?.total)}
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Hoạt Động",
                            value: stats.partners?.activeTotal || 0,
                          },
                          {
                            name: "Tạm Ngưng",
                            value: stats.partners?.suspendedTotal || 0,
                          },
                          {
                            name: "Chờ Duyệt",
                            value: stats.partners?.pendingRegistrations || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {PARTNER_COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Parking Lots Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <i className="ri-parking-box-fill text-xl text-blue-600"></i>
                      </div>
                      Trạng Thái Bãi Đỗ Xe
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Tổng
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatNumber(stats.lots?.total)}
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Hoạt Động",
                            value: stats.lots?.activeTotal || 0,
                          },
                          {
                            name: "Chờ Duyệt",
                            value: stats.lots?.pendingTotal || 0,
                          },
                          {
                            name: "Bảo Trì",
                            value: stats.lots?.underMaintenanceTotal || 0,
                          },
                          {
                            name: "Đang Chuẩn Bị",
                            value: stats.lots?.preparingTotal || 0,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {LOT_COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Platform Summary - Compact */}
            <section className="bg-indigo-50 rounded-2xl p-8 border border-indigo-200 shadow-lg">
              <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
                <div className="bg-white rounded-xl p-2.5">
                  <i className="ri-apps-line text-2xl text-indigo-600"></i>
                </div>
                Tóm Tắt Nền Tảng
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="relative bg-white rounded-xl p-5 border border-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-indigo-100 rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                        <i className="ri-user-3-fill text-2xl text-indigo-600"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Người Dùng
                        </p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {formatNumber(stats.users?.total)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatNumber(stats.users?.newThisPeriod)} mới
                    </p>
                  </div>
                </div>
                <div className="relative bg-white rounded-xl p-5 border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-green-100 rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                        <i className="ri-building-fill text-2xl text-green-600"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Đối Tác
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatNumber(stats.partners?.activeTotal)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatNumber(stats.partners?.pendingRegistrations)} chờ
                      duyệt
                    </p>
                  </div>
                </div>
                <div className="relative bg-white rounded-xl p-5 border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-blue-100 rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                        <i className="ri-parking-box-fill text-2xl text-blue-600"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Bãi Hoạt Động
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(stats.lots?.activeTotal)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      trong {formatNumber(stats.lots?.total)} tổng số
                    </p>
                  </div>
                </div>
                <div className="relative bg-white rounded-xl p-5 border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-orange-100 rounded-xl p-2.5 group-hover:scale-110 transition-transform">
                        <i className="ri-money-dollar-circle-fill text-2xl text-orange-600"></i>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Doanh Thu
                        </p>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(
                            stats.revenue?.totalPlatformRevenue
                          ).slice(0, -2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">tổng nền tảng</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="bg-gray-50 rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-md">
              <i className="ri-database-2-line text-6xl text-gray-400"></i>
            </div>
            <p className="text-gray-900 text-xl font-bold mb-2">
              Không có dữ liệu
            </p>
            <p className="text-gray-600 text-sm">Vui lòng thử lại sau</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
