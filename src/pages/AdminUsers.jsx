import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import adminApi from "../api/adminApi";
import {
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ Fetch users
  const fetchUsers = async () => {
    try {
      const res = await adminApi.getAllUser({ page, size, search });
      const data = res.data?.data || [];
      setUsers(Array.isArray(data) ? data : []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delay);
  }, [page, search]);

  // ✅ Lọc client-side theo ngày
  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();
    const matchesKeyword =
      u.fullName?.toLowerCase().includes(keyword) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword);

    const createdAt = new Date(u.createdAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;

    const matchesDate =
      (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchesKeyword && matchesDate;
  });

  return (
    <AdminLayout>
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">User Management</h2>
      </div>

      {/* 🔹 Filters + Import/Export */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        {/* Left side: Search + Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 🔍 Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              className="border border-gray-300 pl-10 pr-4 py-2 rounded-lg w-80 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
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

          {/* 📅 Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("🟣 Add User clicked")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add User
          </button>
          <button
            onClick={() => alert("🟡 Import clicked")}
            className="flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border border-yellow-200 transition"
          >
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import
          </button>
          <button
            onClick={() => alert("🟢 Export clicked")}
            className="flex items-center gap-2 bg-green-100 text-green-700 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border border-green-200 transition"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Export
          </button>
        </div>
      </div>

      {/* 🔹 Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Full Name</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Registered At</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-100 hover:bg-indigo-50 transition-all"
                >
                  <td className="px-6 py-3 font-medium text-gray-500">
                    {page * size + idx + 1}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          u.profilePictureUrl ||
                          "https://placehold.co/40x40?text=👤"
                        }
                        alt="avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/40x40?text=👤";
                        }}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                      <div>
                        <p className="font-semibold">
                          {u.fullName || `${u.firstName} ${u.lastName}`}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {u.role || "User"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">{u.phone || "-"}</td>
                  <td className="px-6 py-3">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        title="Edit User"
                        className="p-2 rounded-full bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete User"
                        className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
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
                  colSpan="6"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          ← Previous
        </button>
        <span className="text-gray-600 text-sm">
          Page <strong>{page + 1}</strong> of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-indigo-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>
    </AdminLayout>
  );
}
