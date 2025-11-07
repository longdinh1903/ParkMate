import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EllipsisVerticalIcon, EyeIcon, MapPinIcon } from "@heroicons/react/24/outline";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import parkingLotApi from "../api/parkingLotApi";
import toast from "react-hot-toast";
import ViewParkingLotModal from "../components/ViewParkingLotModal";
import ParkingLotMapEditor from "../components/ParkingLotMapEditor";

export default function PartnerHome() {
  const navigate = useNavigate();
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
  const [statusFilter, setStatusFilter] = useState(""); // "" means "All Status"
  const [sortBy, setSortBy] = useState("createdAt"); // field to sort by
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const [openDropdownId, setOpenDropdownId] = useState(null); // Track open dropdown
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
        sortBy: sortBy,
        sortOrder: sortOrder,
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
              return (
                s.status || s.name || s.value || s.code || JSON.stringify(s)
              );
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

  // Fetch whenever page or sort changes
  useEffect(() => {
    fetchMyLots(page);
    // eslint-disable-next-line
  }, [page, sortBy, sortOrder]);
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
    // Filter by search keyword
    const keyword = (search || "").toLowerCase();
    const matchesSearch =
      !keyword ||
      [
        l.name,
        l.city,
        l.streetAddress,
        l.ward,
        l.district,
        l.totalFloors,
        l.status &&
          (typeof l.status === "string" ? l.status : JSON.stringify(l.status)),
      ].some((f) =>
        String(f || "")
          .toLowerCase()
          .includes(keyword)
      );

    // Filter by status
    if (statusFilter && statusFilter !== "") {
      const normalizeStatus = (s) => {
        if (s === null || s === undefined) return "UNKNOWN";
        if (typeof s === "string") return s.trim().toUpperCase();
        if (typeof s === "object") {
          const candidate = s.status || s.name || s.value || s.code || s.type;
          if (candidate) return String(candidate).trim().toUpperCase();
        }
        return String(s).toUpperCase();
      };

      const lotStatus = normalizeStatus(l.status);
      const filterStatus = statusFilter.toUpperCase();

      if (lotStatus !== filterStatus) {
        return false;
      }
    }

    return matchesSearch;
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
        bg: "bg-blue-100",
        text: "text-blue-600",
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
      <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50" style={{ overflowY: 'auto' }}>
        <div className="max-w-7xl mx-auto px-6 py-6 min-h-full">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-parking-box-fill text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  My Parking Lots
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Quản lý các bãi đỗ xe bạn đã đăng ký
                </p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = "/register-lot")}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-add-line text-lg"></i>
              Register New Lot
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="w-full sm:flex-1 relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (all fields)..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="PARTNER_CONFIGURATION">
                Partner Configuration
              </option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAP_DENIED">Map Denied</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Sort By Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="createdAt">Created Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="totalFloors">Total Floors</option>
            </select>

            {/* Sort Order Button */}
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              {sortOrder === "asc" ? (
                <>
                  <i className="ri-sort-asc text-lg"></i>
                  <span className="hidden sm:inline">Asc</span>
                </>
              ) : (
                <>
                  <i className="ri-sort-desc text-lg"></i>
                  <span className="hidden sm:inline">Desc</span>
                </>
              )}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Parking Lots List
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalElements} bãi đỗ xe
                </p>
              </div>
              <button
                onClick={() => {
                  // Reset all filters to default
                  setSearch("");
                  setStatusFilter("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                  setPage(0);
                  fetchMyLots(0);
                }}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all flex items-center gap-2 font-medium cursor-pointer"
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
                  <thead className="bg-indigo-50">
                    <tr>
                      {[
                        "#",
                        "Name",
                        "Address",
                        "Status",
                        "Total Floors",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider ${
                            h === "Status" || h === "Actions"
                              ? "text-center"
                              : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((lot, idx) => (
                      <tr
                        key={lot.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {page * pagination.size + idx + 1}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {lot.name}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {lot.city}
                          </div>
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
                          <div className="flex items-center justify-center">
                            {/* Dropdown Menu */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === lot.id ? null : lot.id);
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Actions"
                                id={`dropdown-button-${lot.id}`}
                              >
                                <EllipsisVerticalIcon className="w-5 h-5" />
                              </button>
                              
                              {/* Dropdown Panel - Fixed positioning to avoid overflow issues */}
                              {openDropdownId === lot.id && (
                                <>
                                  {/* Overlay to close dropdown */}
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setOpenDropdownId(null)}
                                  />
                                  
                                  {/* Menu */}
                                  <div 
                                    className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
                                    style={{
                                      top: document.getElementById(`dropdown-button-${lot.id}`)?.getBoundingClientRect().bottom + 4 || 0,
                                      left: document.getElementById(`dropdown-button-${lot.id}`)?.getBoundingClientRect().right - 192 || 0,
                                    }}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetail(lot);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLotForMap(lot);
                                        setShowMapEditor(true);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                    >
                                      <MapPinIcon className="w-4 h-4" />
                                      Edit Map
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/subscriptions?lotId=${lot.id}`);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center gap-2 transition-colors"
                                    >
                                      <i className="ri-file-list-3-line text-base"></i>
                                      View Subscriptions
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/sessions?lotId=${lot.id}`);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                                    >
                                      <i className="ri-timer-line text-base"></i>
                                      View Sessions
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/reservations?lotId=${lot.id}`);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                                    >
                                      <i className="ri-calendar-line text-base"></i>
                                      View Reservations
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center py-4 px-6 bg-gray-50 border-t border-gray-200">
                    <button
                      disabled={page <= 0}
                      onClick={() => setPage((p) => Math.max(p - 1, 0))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      ← Previous
                    </button>

                    <span className="text-gray-700 text-sm font-medium px-4">
                      Page <strong className="text-indigo-600">{page + 1}</strong> of{" "}
                      <strong className="text-indigo-600">{pagination.totalPages}</strong>
                      <span className="text-gray-400 ml-2">
                        ({pagination.totalElements} parking lots)
                      </span>
                    </span>

                    <button
                      disabled={page >= pagination.totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
