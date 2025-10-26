import React, { useEffect, useState } from "react";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import parkingLotApi from "../api/parkingLotApi";
import toast from "react-hot-toast";
import ViewParkingLotModal from "../components/ViewParkingLotModal";
import ParkingLotMapEditor from "../components/ParkingLotMapEditor";

export default function PartnerHome() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 6,
    totalPages: 0,
    totalElements: 0,
  });
  // use a separate page state to behave like admin pages
  const [page, setPage] = useState(0);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLotForMap, setSelectedLotForMap] = useState(null);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [search, setSearch] = useState("");
  // note: server fetch will default to newest-first (createdAt desc)

  // 🧠 Load parking lots
  const fetchMyLots = async (page = 0) => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("❌ Bạn cần đăng nhập để xem danh sách bãi xe!");
      setLoading(false);
      return;
    }

    try {
      const res = await parkingLotApi.getAll({
        page,
        size: pagination.size,
        sortBy: "createdAt",
        sortOrder: "desc",
        ownedByMe: true, // ✅ Thêm ownedByMe: true để lấy danh sách riêng
      });

      console.log("API Response:", res);

      const payload = res?.data?.data;
      const success = res?.data?.success;

      if (!success || !payload) {
        toast.error("❌ Không thể tải danh sách bãi xe!");
        setLots([]);
        return;
      }

      if (payload.content !== undefined) {
        console.log("Parking lots found:", payload.content.length);
        // Log unique status values returned by the API to help debugging
        try {
          const statuses = new Set(
            payload.content.map((l) => {
              const s = l?.status;
              if (s === null || s === undefined) return "<NULL>";
              if (typeof s === "string") return s;
              return s.status || s.name || s.value || s.code || JSON.stringify(s);
            })
          );
          console.log("Received statuses:", Array.from(statuses));
        } catch (err) {
          console.warn("Could not compute statuses set:", err);
        }
        setLots(payload.content);
        setPagination({
          page: payload.number || 0,
          size: payload.size || 6,
          totalPages: payload.totalPages || 0,
          totalElements: payload.totalElements || 0,
        });
      } else if (Array.isArray(payload)) {
        setLots(payload);
        setPagination({
          page: 0,
          size: 6,
          totalPages: 1,
          totalElements: payload.length,
        });
      } else {
        setLots([]);
      }
    } catch (err) {
      console.error("Error fetching lots:", err);
      toast.error("❌ Không thể tải danh sách bãi xe!");
      setLots([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch whenever page changes (Admin-like behavior)
  useEffect(() => {
    fetchMyLots(page);
    // eslint-disable-next-line
  }, [page]);
  // Search is performed client-side (like AdminPartners): we'll filter the current page's items

  const handleViewDetail = async (lot) => {
    // Fetch fresh details by id and open a read-only modal
    setLoading(true);
    try {
      const res = await parkingLotApi.getById(lot.id);
      const data = res?.data?.data;
      if (!data) {
        toast.error("❌ Không thể tải chi tiết bãi xe!");
        return;
      }
      setSelectedLot(data);
      setShowDetailModal(true);
    } catch (err) {
      console.error("Error fetching lot by id:", err);
      toast.error("❌ Không thể tải chi tiết bãi xe!");
    } finally {
      setLoading(false);
    }
  };

  // client-side filtered view (search across main fields similar to AdminPartners)
  const filtered = lots.filter((l) => {
    const keyword = (search || "").toLowerCase();
    if (!keyword) return true;
    return [
      l.name,
      l.city,
      l.streetAddress,
      l.ward,
      l.status && (typeof l.status === "string" ? l.status : JSON.stringify(l.status)),
    ].some((f) => String(f || "").toLowerCase().includes(keyword));
  });

  const getStatusBadge = (status) => {
    // Normalize status that may come as a string or an object.
    const normalize = (s) => {
      if (s === null || s === undefined) return "UNKNOWN";
      if (typeof s === "string") return s.trim().toUpperCase();
      if (typeof s === "object") {
        // common keys that might hold the status value
        const candidate = s.status || s.name || s.value || s.code || s.type;
        if (candidate) return String(candidate).trim().toUpperCase();
        // fallback to JSON string
        try {
          return JSON.stringify(s).toUpperCase();
        } catch {
          return String(s).toUpperCase();
        }
      }
      return String(s).toUpperCase();
    };

    const key = normalize(status);

    const statusMap = {
      // expected canonical values
      APPROVED: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "ri-checkbox-circle-fill",
        label: "Approved",
      },
      // aliases that APIs sometimes return
      APPROVE: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "ri-checkbox-circle-fill",
        label: "Approved",
      },
      ACTIVE: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "ri-checkbox-circle-fill",
        label: "Active",
      },

      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: "ri-time-fill",
        label: "Pending",
      },
      PREPARING: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: "ri-loader-2-fill",
        label: "Preparing",
      },
      PARTNER_CONFIGURATION: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: "ri-tools-fill",
        label: "Partner Config",
      },
      WAITING: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: "ri-time-fill",
        label: "Pending",
      },

      REJECTED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "ri-close-circle-fill",
        label: "Rejected",
      },
      REJECT: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "ri-close-circle-fill",
        label: "Rejected",
      },
      DENIED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "ri-close-circle-fill",
        label: "Denied",
      },
      MAP_DENIED: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: "ri-map-pin-2-fill",
        label: "Map Denied",
      },

      INACTIVE: {
        bg: "bg-red-100",
        text: "text-gray-700",
        icon: "ri-toggle-off-line",
        label: "Inactive",
      },

      UNKNOWN: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: "ri-question-line",
        label: "Unknown",
      },
    };

    const info = statusMap[key] || statusMap.UNKNOWN;
    // show a tooltip with the raw value for easier debugging
    const raw = typeof status === "string" ? status : JSON.stringify(status);
    return (
      <span
        title={raw}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${info.bg} ${info.text}`}
      >
        <i className={info.icon}></i>
        {info.label}
      </span>
    );
  };

  return (
    <PartnerTopLayout>
  <div className="pb-8 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-parking-box-fill text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Parking Lots</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Quản lý các bãi đỗ xe bạn đã đăng ký
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/register-lot")}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
            >
              <i className="ri-add-line text-lg"></i>
              Register New Lot
            </button>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search (search all fields)..."
              className="w-full sm:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {/* sort removed - default server sort is newest-first */}
          </div>

          {/* Table */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Parking Lots List</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalElements} bãi đỗ xe
                </p>
              </div>
              <button
                onClick={() => fetchMyLots(page)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium"
              >
                <i className="ri-refresh-line"></i> Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 mt-3">Loading...</p>
              </div>
            ) : lots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="ri-parking-box-line text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No parking lots found
                </h3>
                <p className="text-gray-500 mb-6">
                  You haven't registered any parking lots yet
                </p>
              </div>
            ) : (
              <>
                <table className="w-full table-auto">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {["STT", "Name", "Address", "Status", "Total Floors", "Actions"].map((h) => (
                          <th
                            key={h}
                            className={`px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider ${
                              h === "Status" || h === "Actions" ? "text-center" : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((lot, idx) => (
                        <tr key={lot.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{page * pagination.size + idx + 1}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">{lot.name}</div>
                            <div className="text-gray-500 text-xs mt-1">{lot.city}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs whitespace-normal break-words">
                            {lot.streetAddress}, {lot.ward}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(lot.status)}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-700">
                            {lot.totalFloors || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewDetail(lot)}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all text-sm font-medium"
                              >
                                <i className="ri-eye-line"></i>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedLotForMap(lot);
                                  setShowMapEditor(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all text-sm font-medium"
                                title="Edit Map"
                              >
                                <i className="ri-map-pin-2-fill"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                {/* Pagination like AdminPartners: simple Prev / Page X / Next */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 px-6">
                    <button
                      disabled={page <= 0}
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      ← Previous
                    </button>

                    <span className="text-gray-600 text-sm">
                      Page <strong>{page + 1}</strong> of {pagination.totalPages}
                    </span>

                    <button
                      disabled={page >= pagination.totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showDetailModal && selectedLot && (
        <ViewParkingLotModal
          lot={selectedLot}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLot(null);
          }}
          onActionDone={() => fetchMyLots(page)}
          // restrict status change options for partners to only ACTIVE and MAP_DENIED
          statusOptions={[
            { key: "ACTIVE", label: "Active", color: "text-green-600" },
            { key: "MAP_DENIED", label: "Map Denied", color: "text-red-600" },
          ]}
        />
      )}
      {showMapEditor && selectedLotForMap && (
        <ParkingLotMapEditor
          lot={selectedLotForMap}
            onClose={() => {
            setShowMapEditor(false);
            setSelectedLotForMap(null);
            // Refresh list as map edits may affect drawn counts
            fetchMyLots(page);
          }}
        />
      )}
    </PartnerTopLayout>
  );
}
