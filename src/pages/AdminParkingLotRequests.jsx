import { useState, useEffect, useCallback } from "react";
import parkingLotApi from "../api/parkingLotApi";
import floorApi from "../api/floorApi";
import ConfirmModal from "../components/ConfirmModal";
import ViewParkingLotModal from "../components/ViewParkingLotModal";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function AdminParkingLotRequests() {
  const [requests, setRequests] = useState([]);
  const [floorCounts, setFloorCounts] = useState({}); // Store drawn floor counts
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewingLot, setViewingLot] = useState(null);
  const [confirmingLot, setConfirmingLot] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await parkingLotApi.getAll({
        page,
        size,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      const data = res.data?.data;
      const lots = Array.isArray(data?.content) ? data.content : data || [];
      setRequests(lots);
      setTotalPages(data?.totalPages || 1);
      setTotalCount(data?.totalElements || lots.length);

      // Initialize floor counts with 'undefined' for loading state
      const initialCounts = {};
      lots.forEach((lot) => {
        initialCounts[lot.id] = undefined;
      });
      setFloorCounts(initialCounts);

      // Fetch floor counts for each parking lot
      const counts = {};
      await Promise.all(
        lots.map(async (lot) => {
          try {
            console.log(
              `🔍 Fetching floors for lot ID: ${lot.id}, Name: ${lot.name}`
            );
            const floorsRes = await floorApi.getByLotId(lot.id);
            console.log(`📦 Raw response for ${lot.name}:`, floorsRes);

            // Try multiple ways to extract floors array
            const floors =
              floorsRes.data?.data?.content ||
              floorsRes.data?.data ||
              floorsRes.data?.content ||
              floorsRes.data ||
              [];

            const floorCount = Array.isArray(floors) ? floors.length : 0;
            counts[lot.id] = floorCount;
            console.log(
              `✅ Lot "${lot.name}": ${floorCount} floors drawn`,
              floors
            );
          } catch (error) {
            console.error(`❌ Error fetching floors for ${lot.name}:`, error);
            console.error(`   Error details:`, error.response?.data);
            counts[lot.id] = 0;
          }
        })
      );
      console.log("📊 Final floor counts:", counts);
      setFloorCounts(counts);
    } catch (err) {
      console.error("❌ Error fetching parking lots:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ View details popup
  const handleView = async (id) => {
    try {
      const res = await parkingLotApi.getById(id);
      const lotData = res.data?.data;
      setViewingLot(lotData || null);
    } catch (err) {
      console.error("❌ Error fetching details:", err);
      showError("Không thể tải thông tin bãi đỗ xe!");
    }
  };

  // ✅ Delete confirm
  const handleDelete = (item) => setConfirmingLot(item);

  const confirmDelete = async () => {
    const lot = confirmingLot;
    if (!lot) return;
    try {
      const res = await parkingLotApi.deleteRegister(lot.id);
      if (res.status === 200 || res.status === 204) {
        showSuccess(`🗑️ Đã xóa "${lot.name}" thành công!`);
        fetchData();
      } else showError("❌ Xóa thất bại.");
    } catch (err) {
      console.error("❌ Error deleting lot:", err);
      showError(err.response?.data?.message || "❌ Xóa bãi đỗ xe thất bại.");
    } finally {
      setConfirmingLot(null);
    }
  };

  // ✅ Filter
  const filtered = requests.filter((r) => {
    const keyword = search.toLowerCase();
    const matchSearch =
      r.name?.toLowerCase().includes(keyword) ||
      r.streetAddress?.toLowerCase().includes(keyword) ||
      r.ward?.toLowerCase().includes(keyword) ||
      r.city?.toLowerCase().includes(keyword) ||
      r.status?.toLowerCase().includes(keyword);

    const matchStatus = status
      ? r.status?.toLowerCase() === status.toLowerCase()
      : true;

    const createdAt = new Date(r.createdAt || r.updatedAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const matchDate = (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchSearch && matchStatus && matchDate;
  });

  // ✅ Render status badge
  const renderStatus = (status) => {
    const base =
      "px-2 py-1 text-xs font-semibold rounded-md border inline-block";
    const s = status?.toUpperCase();
    const colorMap = {
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-300",
      PREPARING: "bg-orange-50 text-orange-700 border-orange-300",
      PARTNER_CONFIGURATION: "bg-indigo-50 text-indigo-700 border-indigo-300",
      ACTIVE: "bg-green-50 text-green-700 border-green-300",
      INACTIVE: "bg-gray-50 text-gray-600 border-gray-300",
      MAP_DENIED: "bg-red-50 text-red-700 border-red-300",
      REJECTED: "bg-red-50 text-red-700 border-red-300",
      PENDING_PAYMENT: "bg-purple-50 text-purple-700 border-purple-300",
    };

    // Map to Vietnamese
    const statusMap = {
      PENDING: "Chờ Duyệt",
      PREPARING: "Đang Chuẩn Bị",
      PARTNER_CONFIGURATION: "Cấu Hình Đối Tác",
      ACTIVE: "Hoạt Động",
      INACTIVE: "Ngừng Hoạt Động",
      MAP_DENIED: "Từ Chối Bản Đồ",
      REJECTED: "Bị Từ Chối",
      PENDING_PAYMENT: "Chờ Thanh Toán",
    };

    const displayText = statusMap[s] || "Không xác định";

    return (
      <span
        className={`${base} ${
          colorMap[s] || "bg-gray-50 text-gray-600 border-gray-300"
        }`}
      >
        {displayText}
      </span>
    );
  };

  // ✅ Import Excel
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showSuccess("📤 Đang nhập dữ liệu...");
      await parkingLotApi.importExcel(file);
      showSuccess("✅ Nhập Excel thành công!");
      fetchData();
    } catch (err) {
      console.error("❌ Import error:", err);
      showError(err.response?.data?.message || "Nhập file Excel thất bại!");
    } finally {
      e.target.value = null;
    }
  };

  // ✅ Export Excel
  const handleExport = async () => {
    try {
      showSuccess("📥 Đang xuất file Excel...");
      const res = await parkingLotApi.exportExcel();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ParkingLots_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess("✅ Xuất file Excel thành công!");
    } catch (err) {
      console.error("❌ Export error:", err);
      showError("Xuất file thất bại!");
    }
  };

  return (
    <>
      {/* 🔹 Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, thành phố, phường, hoặc trạng thái..."
              className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-80 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
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

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all appearance-none bg-white pr-10 cursor-pointer"
            >
              <option value="createdAt">Ngày Tạo</option>
              <option value="name">Tên</option>
              <option value="city">Thành Phố</option>
              <option value="status">Trạng Thái</option>
              <option value="totalFloors">Tổng Số Tầng</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title={sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
          >
            {sortOrder === "asc" ? (
              <i className="ri-sort-asc text-lg text-gray-600"></i>
            ) : (
              <i className="ri-sort-desc text-lg text-gray-600"></i>
            )}
            <span className="text-sm text-gray-600">
              {sortOrder === "asc" ? "Tăng dần" : "Giảm dần"}
            </span>
          </button>

          {/* Status filter */}
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tất Cả Trạng Thái</option>
            {[
              { value: "Chờ Duyệt", label: "Chờ Duyệt" },
              { value: "Preparing", label: "Đang Chuẩn Bị" },
              { value: "Partner Configuration", label: "Cấu Hình Đối Tác" },
              { value: "Active", label: "Hoạt Động" },
              { value: "Inactive", label: "Ngừng Hoạt Động" },
              { value: "Map Denied", label: "Từ Chối Bản Đồ" },
              { value: "Rejected", label: "Bị Từ Chối" },
              { value: "Pending_Payment", label: "Chờ Thanh Toán" },
            ].map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 transition-all cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setStartDate("");
              setEndDate("");
              setSortBy("createdAt");
              setSortOrder("desc");
              setPage(0);
              fetchData();
            }}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            title="Làm mới bộ lọc"
          >
            <i className="ri-refresh-line text-lg text-gray-600"></i>
            <span className="text-sm text-gray-600">Làm Mới</span>
          </button>
        </div>

        {/* ✅ Import / Export */}
        <div className="flex gap-2">
          {/* Import */}
          <label className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Nhập Excel
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          {/* Export */}
          <button
            className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition cursor-pointer"
            onClick={handleExport}
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-orange-50 text-orange-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Tên</th>
              <th className="px-6 py-3 text-left">Địa Chỉ</th>
              <th className="px-6 py-3 text-left">Phường</th>
              <th className="px-6 py-3 text-left">Thành Phố</th>
              <th className="px-6 py-3 text-left">Số Tầng</th>
              <th className="px-6 py-3 text-left">Giờ Mở - Đóng</th>
              <th className="px-6 py-3 text-left">Trạng Thái</th>
              <th className="px-6 py-3 text-center">Thao Tác</th>
            </tr>
          </thead>

          <tbody className="text-gray-700 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-500 italic"
                >
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((lot, idx) => (
                <tr
                  key={lot.id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-3 text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3 font-medium">{lot.name}</td>
                  <td className="px-6 py-3">{lot.streetAddress}</td>
                  <td className="px-6 py-3">{lot.ward}</td>
                  <td className="px-6 py-3">{lot.city}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-medium">
                        {lot.totalFloors} tầng
                      </span>
                      <span className="text-gray-300">•</span>
                      {floorCounts[lot.id] !== undefined ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            floorCounts[lot.id] === 0
                              ? "bg-gray-100 text-gray-600"
                              : floorCounts[lot.id] >= lot.totalFloors
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                          title={`${
                            floorCounts[lot.id]
                          } tầng đã vẽ trong tổng số ${lot.totalFloors}`}
                        >
                          {floorCounts[lot.id] === 0
                            ? "❌ Chưa vẽ"
                            : floorCounts[lot.id] >= lot.totalFloors
                            ? `✅ ${floorCounts[lot.id]} đã vẽ`
                            : `⚠️ ${floorCounts[lot.id]}/${
                                lot.totalFloors
                              } đã vẽ`}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-full animate-pulse">
                          Đang tải...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {lot.is24Hour
                      ? "Mở cửa 24/7"
                      : `${lot.operatingHoursStart || "-"} - ${
                          lot.operatingHoursEnd || "-"
                        }`}
                  </td>
                  <td className="px-6 py-3">{renderStatus(lot.status)}</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        title="Xem Chi Tiết"
                        onClick={() => handleView(lot.id)}
                        className="p-2 rounded-full hover:bg-indigo-100 transition cursor-pointer"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa Yêu Cầu"
                        onClick={() => handleDelete(lot)}
                        className="p-2 rounded-full hover:bg-red-100 transition cursor-pointer"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  Không tìm thấy bãi đỗ xe nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          ← Trước
        </button>
        <div className="text-center text-gray-600 text-sm">
          <div>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tổng yêu cầu:{" "}
            <strong className="text-orange-700">{totalCount}</strong>
          </div>
        </div>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          Sau →
        </button>
      </div>

      {/* Confirm Delete Modal */}
      {confirmingLot && (
        <ConfirmModal
          open={!!confirmingLot}
          title="Xác Nhận Xóa"
          message={`Bạn có chắc chắn muốn xóa "${confirmingLot?.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingLot(null)}
        />
      )}

      {/* View Lot Modal (render modal component directly to avoid nested overlays) */}
      {viewingLot && (
        <ViewParkingLotModal
          lot={viewingLot}
          onClose={() => setViewingLot(null)}
          onActionDone={fetchData}
          showDrawMapButton={true}
          showResetMapButton={true}
          showPaymentBanner={false}
          showAssignDevicesButton={true}
          statusOptions={[
            { key: "PREPARING", label: "Đang Chuẩn Bị", color: "text-yellow-600" },
            {
              key: "PARTNER_CONFIGURATION",
              label: "Cấu Hình Đối Tác",
              color: "text-blue-600",
            },
            { key: "REJECTED", label: "Bị Từ Chối", color: "text-red-600" },
          ]}
        />
      )}
    </>
  );
}
