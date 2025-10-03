import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import partnerApi from "../api/partnerApi";
import parkingLotApi from "../api/parkingLotApi";
import Modal from "../components/Modal";
import AddPartnerModal from "../components/AddPartnerModal";

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState("partner");
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showAddPartner, setShowAddPartner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let res;
        if (activeTab === "partner") {
          res = await partnerApi.getRequests();
        } else {
          res = await parkingLotApi.getRequests();
        }
        setRequests(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching requests:", err);
      }
    };
    fetchData();
  }, [activeTab]);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.partnerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status ? r.status === status : true;
    return matchSearch && matchStatus;
  });

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
          onClick={() => setActiveTab("partner")}
        >
          Partner Account Requests
        </button>
        <button
          className={`pb-2 ${
            activeTab === "parkingLot"
              ? "border-b-2 border-indigo-600 font-semibold"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("parkingLot")}
        >
          Parking Lot Requests
        </button>
      </div>

      {/* Partner Tab Header */}
      {activeTab === "partner" && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">Partner Account Requests</h2>
            <p className="text-gray-500 text-sm">
              Review and manage partner account registration requests
            </p>
          </div>
          <button
            onClick={() => setShowAddPartner(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            + New Partner
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="text"
          placeholder="Search by Partner Name or Email..."
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
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <input type="date" className="border px-3 py-2 rounded-md" />
        <select className="border px-3 py-2 rounded-md">
          <option>Sort by Date</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              {activeTab === "partner" ? (
                <>
                  <th className="px-4 py-2">Partner</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Submitted At</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2">Partner</th>
                  <th className="px-4 py-2">Parking Lot</th>
                  <th className="px-4 py-2">Location</th>
                  <th className="px-4 py-2">Spaces</th>
                  <th className="px-4 py-2">Submitted At</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition">
                  {activeTab === "partner" ? (
                    <>
                      <td className="px-4 py-2">{r.partnerName}</td>
                      <td className="px-4 py-2">{r.email}</td>
                      <td className="px-4 py-2">{r.companyName}</td>
                      <td className="px-4 py-2">{r.phone}</td>
                      <td className="px-4 py-2">
                        {new Date(r.submittedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-2">{r.status}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button className="text-green-600 hover:underline">
                          Approve
                        </button>
                        <button className="text-red-600 hover:underline">
                          Reject
                        </button>
                        <button className="text-indigo-600 hover:underline">
                          View
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2">{r.partnerName}</td>
                      <td className="px-4 py-2">{r.lotName}</td>
                      <td className="px-4 py-2">{r.city}</td>
                      <td className="px-4 py-2">{r.spaces}</td>
                      <td className="px-4 py-2">
                        {new Date(r.submittedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-2">{r.status}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button className="text-green-600 hover:underline">
                          Approve
                        </button>
                        <button className="text-red-600 hover:underline">
                          Reject
                        </button>
                        <button className="text-indigo-600 hover:underline">
                          View
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Partner Modal */}
      <Modal isOpen={showAddPartner} onClose={() => setShowAddPartner(false)}>
        <AddPartnerModal onClose={() => setShowAddPartner(false)} />
      </Modal>
    </AdminLayout>
  );
}
