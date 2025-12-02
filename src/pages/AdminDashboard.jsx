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
          <span className="text-xs text-gray-500">so với kỳ trước</span>
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
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 truncate">Tổng Quan Hệ Thống</h1>
              <p className="text-sm text-gray-500 mt-0.5 truncate">Tổng quan toàn diện về hiệu suất hệ sinh thái ParkMate</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <i className="ri-calendar-2-line text-indigo-600 text-lg"></i>
              <select
                value={activeDateRange === 'month' ? new Date(dateRange.from).getMonth() + 1 : ''}
                onChange={(e) => {
                  const selectedMonth = parseInt(e.target.value);
                  if (!selectedMonth) return;
                  
                  const year = new Date().getFullYear();
                  
                  // First day of selected month at 00:00:00
                  const firstDay = new Date(year, selectedMonth - 1, 1, 0, 0, 0);
                  
                  // Last day of selected month at 23:59:59
                  const lastDay = new Date(year, selectedMonth, 0, 23, 59, 59);
                  
                  // Format dates in local timezone (not UTC)
                  const formatLocalDateTime = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
                  };
                  
                  setDateRange({
                    from: formatLocalDateTime(firstDay),
                    to: formatLocalDateTime(lastDay),
                  });
                  setActiveDateRange('month');
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
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <i className="ri-calendar-line text-orange-600 text-lg"></i>
              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={dateRange.from.slice(0, 16)}
                  onChange={(e) => handleDateChange("from", e.target.value + ":00")}
                  className="text-xs w-36 bg-transparent border-none p-0 focus:outline-none cursor-pointer font-medium"
                  aria-label="Từ ngày"
                />
                <span className="text-gray-400 text-sm">→</span>
                <input
                  type="datetime-local"
                  value={dateRange.to.slice(0, 16)}
                  onChange={(e) => handleDateChange("to", e.target.value + ":00")}
                  className="text-xs w-36 bg-transparent border-none p-0 focus:outline-none cursor-pointer font-medium"
                  aria-label="Đến ngày"
                />
              </div>
            </div>

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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition"
              title="Đặt lại về 30 ngày trước"
            >
              <i className="ri-refresh-line"></i>
              <span className="hidden sm:inline">Đặt Lại</span>
            </button>

            {/* Quick Date Range Buttons */}
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-100 shadow-sm">
              <button
                onClick={() => setQuickDateRange(0)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition font-medium ${activeDateRange === 0 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 0}
              >
                Hôm Nay
              </button>
              <button
                onClick={() => setQuickDateRange(7)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition font-medium ${activeDateRange === 7 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 7}
              >
                7 ngày
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition font-medium ${activeDateRange === 30 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 30}
              >
                30 ngày
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition font-medium ${activeDateRange === 90 ? 'bg-indigo-600 text-white shadow' : 'text-indigo-600 hover:bg-indigo-50'}`}
                aria-pressed={activeDateRange === 90}
              >
                90 ngày
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
                <p className="text-gray-600 mt-4 font-medium">Đang tải dữ liệu tổng quan...</p>
              </div>
            ) : stats ? (
              <>
                {/* Revenue Overview with Charts */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line text-green-600"></i>
                      Tổng Quan Doanh Thu
                    </h2>
                  </div>

                  {/* Total Revenue Card - Highlighted */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium uppercase tracking-wide mb-2">
                            Tổng Doanh Thu Nền Tảng
                          </p>
                          <h3 className="text-5xl font-bold mb-2">
                            {formatCurrency(stats.revenue?.totalPlatformRevenue)}
                          </h3>
                          {stats.revenue?.platformRevenueGrowthRate !== undefined && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className={`flex items-center gap-1 text-sm font-semibold ${
                                stats.revenue?.platformRevenueGrowthRate >= 0 ? 'text-green-200' : 'text-red-200'
                              }`}>
                                <i className={`ri-arrow-${stats.revenue?.platformRevenueGrowthRate >= 0 ? 'up' : 'down'}-line`}></i>
                                {Math.abs(stats.revenue?.platformRevenueGrowthRate)}%
                              </span>
                              <span className="text-green-100 text-sm">so với kỳ trước</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-white/20 rounded-full p-6">
                          <i className="ri-hand-coin-fill text-6xl"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="ri-pie-chart-2-line text-orange-600"></i>
                        Phân Bổ Doanh Thu
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Phí Vận Hành', value: stats.revenue?.totalOperationalFee || 0 },
                              { name: 'Gói Đăng Ký', value: stats.revenue?.totalSubscription || 0 },
                              { name: 'Phiên Đỗ Xe', value: stats.revenue?.totalSessionRevenue || 0 },
                              { name: 'Đặt Chỗ', value: stats.revenue?.totalReservationRevenue || 0 },
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
                          <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="ri-bar-chart-box-line text-green-600"></i>
                        Chi Tiết & Tăng Trưởng Doanh Thu
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={[
                            { 
                              name: 'Phí Vận Hành', 
                              amount: stats.revenue?.totalOperationalFee || 0,
                              growth: stats.revenue?.operationalGrowthRate || 0 
                            },
                            { 
                              name: 'Gói Đăng Ký', 
                              amount: stats.revenue?.totalSubscription || 0,
                              growth: stats.revenue?.subscriptionGrowthRate || 0 
                            },
                            { 
                              name: 'Phiên Đỗ Xe', 
                              amount: stats.revenue?.totalSessionRevenue || 0,
                              growth: stats.revenue?.sessionRevenueGrowthRate || 0 
                            },
                            { 
                              name: 'Đặt Chỗ', 
                              amount: stats.revenue?.totalReservationRevenue || 0,
                              growth: stats.revenue?.reservationGrowthRate || 0 
                            },
                          ]}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'amount') return formatCurrency(value);
                              return `${value}%`;
                            }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                          />
                          <Legend />
                          <Bar dataKey="amount" name="Số Tiền" radius={[8, 8, 0, 0]}>
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <i className="ri-building-line text-orange-600"></i>
                      Đối Tác & Bãi Đỗ Xe
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Partners Chart */}
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <i className="ri-building-fill text-blue-600"></i>
                          Trạng Thái Đối Tác
                        </h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tổng</p>
                          <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.partners?.total)}</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Hoạt Động', value: stats.partners?.activeTotal || 0 },
                              { name: 'Tạm Ngưng', value: stats.partners?.suspendedTotal || 0 },
                              { name: 'Chờ Duyệt', value: stats.partners?.pendingRegistrations || 0 },
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
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Parking Lots Chart */}
                    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <i className="ri-parking-box-fill text-blue-600"></i>
                          Trạng Thái Bãi Đỗ Xe
                        </h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tổng</p>
                          <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.lots?.total)}</p>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Hoạt Động', value: stats.lots?.activeTotal || 0 },
                              { name: 'Chờ Duyệt', value: stats.lots?.pendingTotal || 0 },
                              { name: 'Bảo Trì', value: stats.lots?.underMaintenanceTotal || 0 },
                              { name: 'Đang Chuẩn Bị', value: stats.lots?.preparingTotal || 0 },
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
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>

                {/* Platform Summary - Compact */}
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                  <h2 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <i className="ri-apps-line"></i>
                    Tóm Tắt Nền Tảng
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-indigo-100 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-100 rounded-lg p-2">
                          <i className="ri-user-3-fill text-xl text-indigo-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tổng Người Dùng</p>
                          <p className="text-xl font-bold text-indigo-600">{formatNumber(stats.users?.total)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formatNumber(stats.users?.newThisPeriod)} mới</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-green-100 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 rounded-lg p-2">
                          <i className="ri-building-fill text-xl text-green-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Đối Tác</p>
                          <p className="text-xl font-bold text-green-600">{formatNumber(stats.partners?.activeTotal)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formatNumber(stats.partners?.pendingRegistrations)} chờ duyệt</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-blue-100 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 rounded-lg p-2">
                          <i className="ri-parking-box-fill text-xl text-blue-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Bãi Đang Hoạt Động</p>
                          <p className="text-xl font-bold text-blue-600">{formatNumber(stats.lots?.activeTotal)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">trong {formatNumber(stats.lots?.total)} tổng số</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-orange-100 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-orange-100 rounded-lg p-2">
                          <i className="ri-money-dollar-circle-fill text-xl text-orange-600"></i>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Doanh Thu</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.revenue?.totalPlatformRevenue).slice(0, -2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">tổng nền tảng</p>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="text-center py-20">
                <i className="ri-database-2-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Không có dữ liệu</p>
              </div>
            )}
      </div>
    </AdminLayout>
  );
}
