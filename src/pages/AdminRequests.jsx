import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import partnerApi from "../api/partnerApi";
import parkingLotApi from "../api/parkingLotApi";
import Modal from "../components/Modal";
import AddPartnerModal from "../components/AddPartnerModal";
import ViewPartnerModal from "../components/ViewPartnerModal"; // ✅ thêm modal hiển thị chi tiết

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState("partner");
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [viewingPartner, setViewingPartner] = useState(null); // ✅ lưu thông tin partner đang xem
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Fetch data
  const fetchData = async () => {
    try {
      const res =
        activeTab === "partner"
          ? await partnerApi.getRequests({
              page,
              size,
              sortBy: "createdAt",
              sortOrder: "asc",
            })
          : await parkingLotApi.getRequests({
              page,
              size,
              sortBy: "createdAt",
              sortOrder: "asc",
            });

      const data = res.data?.data;
      setRequests(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, page, size]);

  // ✅ Handle Approve / Reject
  const handleAction = async (id, action) => {
    try {
      let payload;

      if (action === "approve") {
        payload = {
          status: "APPROVED",
          approvalNotes: "All documents verified successfully",
          reviewerId: 2,
          valid: true,
        };
      } else if (action === "reject") {
        const reason = prompt("Nhập lý do từ chối:");
        if (!reason) return;
        payload = {
          status: "REJECTED",
          rejectionReason: reason,
          reviewerId: 2,
          valid: true,
        };
      }

      await partnerApi.updateStatus(id, payload);
      alert(`✅ ${action === "approve" ? "Approved" : "Rejected"} successfully!`);
      fetchData();
    } catch (err) {
      console.error(`❌ Error when ${action}:`, err);
      alert(`Failed to ${action}. Check console for details.`);
    }
  };

  // ✅ Handle View (call API by ID)
  const handleView = async (id) => {
    try {
      const res = await partnerApi.getById(id);
      setViewingPartner(res.data?.data || null);
    } catch (err) {
      console.error("❌ Error fetching partner details:", err);
      alert("Failed to fetch partner details");
    }
  };

  // ✅ Filter client-side
  const filtered = requests.filter((r) => {
    const matchSearch =
      r.contactPersonName?.toLowerCase().includes(search.toLowerCase()) ||
      r.contactPersonEmail?.toLowerCase().includes(search.toLowerCase()) ||
      r.companyEmail?.toLowerCase().includes(search.toLowerCase()) ||
      r.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status ? r.status?.toLowerCase() === status.toLowerCase() : true;
    return matchSearch && matchStatus;
  });

  // ✅ Render actions
  const renderActions = (r) => {
    if (r.status === "PENDING") {
      return (
        <>
          <button
            className="text-green-600 hover:underline"
            onClick={() => handleAction(r.id, "approve")}
          >
            Approve
          </button>
          <button
            className="text-red-600 hover:underline"
            onClick={() => handleAction(r.id, "reject")}
          >
            Reject
          </button>
          <button
            className="text-indigo-600 hover:underline"
            onClick={() => handleView(r.id)} // ✅ gọi API getById
          >
            View
          </button>
        </>
      );
    }
    return (
      <button
        className="text-indigo-600 hover:underline"
        onClick={() => handleView(r.id)} // ✅ gọi API getById
      >
        View
      </button>
    );
  };

  return (
    <AdminLayout>
      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6">
        <button
          className={`pb-2 ${
            activeTab === "partner"
              ? "border-b-2 border-indigo-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => {
            setActiveTab("partner");
            setPage(0);
          }}
        >
          Partner Account Requests
        </button>
        <button
          className={`pb-2 ${
            activeTab === "parkingLot"
              ? "border-b-2 border-indigo-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => {
            setActiveTab("parkingLot");
            setPage(0);
          }}
        >
          Parking Lot Requests
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Search by Partner Name / Email / Company..."
          className="border px-3 py-2 rounded-md w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded-md"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2">Partner</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Submitted At</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{r.contactPersonName}</td>
                  <td className="px-4 py-2">{r.contactPersonEmail || r.companyEmail}</td>
                  <td className="px-4 py-2">{r.companyName}</td>
                  <td className="px-4 py-2">{r.companyPhone}</td>
                  <td className="px-4 py-2">
                    {r.submittedAt
                      ? new Date(r.submittedAt).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2 flex gap-2">{renderActions(r)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Add Partner Modal */}
      <Modal isOpen={showAddPartner} onClose={() => setShowAddPartner(false)}>
        <AddPartnerModal onClose={() => setShowAddPartner(false)} />
      </Modal>

      {/* ✅ View Partner Modal */}
      <Modal isOpen={!!viewingPartner} onClose={() => setViewingPartner(null)}>
        {viewingPartner && (
          <ViewPartnerModal
            partner={viewingPartner}
            onClose={() => setViewingPartner(null)}
          />
        )}
      </Modal>
    </AdminLayout>
  );
}
