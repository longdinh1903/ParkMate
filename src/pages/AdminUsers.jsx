import { useState, useEffect } from "react";
import AdminLayout from "../layouts/AdminLayout";
import adminApi from "../api/adminApi";
import {
  PlusIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import EditUserModal from "../components/EditUserModal";
import ViewUserModal from "../components/ViewUserModal";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // ✅ Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await adminApi.getAllUser({ page, size, search });
      const responseData = res.data?.data;
      const list = Array.isArray(responseData?.content)
        ? responseData.content
        : Array.isArray(responseData)
        ? responseData
        : [];

      setUsers(list);
      setTotalPages(responseData?.totalPages || 1);
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      showError("Không thể tải danh sách người dùng.");
      setUsers([]);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delay);
  }, [page, search]);

  // ✅ Client-side filter
  const filteredUsers = users.filter((u) => {
    const keyword = search.toLowerCase();
    const email = u.email || u.userEmail || u.account?.email || "";
    const matchesKeyword =
      u.fullName?.toLowerCase().includes(keyword) ||
      `${u.firstName || ""} ${u.lastName || ""}`
        .toLowerCase()
        .includes(keyword) ||
      email.toLowerCase().includes(keyword) ||
      u.phone?.toLowerCase().includes(keyword) ||
      u.address?.toLowerCase().includes(keyword) ||
      u.role?.toLowerCase().includes(keyword);

    const createdAt = new Date(u.createdAt);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
    const matchesDate =
      (!from || createdAt >= from) && (!to || createdAt <= to);

    return matchesKeyword && matchesDate;
  });

  // ✅ Edit User
  const handleEditClick = (user) => {
    const email = user.email || user.userEmail || user.account?.email || "";
    setEditingUser({ ...user, email });
  };

  const handleSaveEdit = async (updatedUser) => {
    try {
      toast.loading("Đang cập nhật người dùng...");
      const payload = {
        userId: updatedUser.userId || updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
      };
      await adminApi.updateUser(payload.userId, payload);
      toast.dismiss();
      showSuccess("Cập nhật người dùng thành công!");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.dismiss();
      console.error("❌ Update failed:", err);
      showError("Cập nhật thất bại!");
    }
  };

  // ✅ View user details
  const handleViewClick = async (user) => {
    try {
      setLoadingView(true);
      const res = await adminApi.getUserById(user.id || user.userId);
      const detail = res.data?.data;
      if (!detail) throw new Error("Empty data");
      setViewingUser(detail);
    } catch (err) {
      console.error("❌ Error fetching user detail:", err);
      showError("Không thể tải chi tiết người dùng!");
    } finally {
      setLoadingView(false);
    }
  };

  // ✅ Import Users
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const toastId = toast.loading("Đang nhập dữ liệu, vui lòng đợi...");
    try {
      await adminApi.importUsers(file);
      toast.success("Import thành công!");
      fetchUsers();
    } catch (err) {
      console.error("❌ Import failed:", err);
      toast.error("Import thất bại! Vui lòng kiểm tra file Excel.");
    } finally {
      toast.dismiss(toastId);
      e.target.value = ""; // reset input
    }
  };

  // ✅ Export Users
  const handleExport = async () => {
    const toastId = toast.loading("Đang xuất file Excel...");
    try {
      const res = await adminApi.exportUsers();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Users.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Đã xuất file Excel thành công!");
    } catch (err) {
      console.error("❌ Export failed:", err);
      toast.error("Xuất file thất bại!");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">User Management</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by any field..."
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

          {/* Date range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showInfo("Chức năng thêm người dùng đang phát triển")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition transform hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-white" />
            Add User
          </button>

          {/* ✅ Import */}
          <label className="flex items-center gap-2 hover:bg-yellow-200 font-medium px-4 py-2 rounded-lg border transition transform hover:scale-105 hover:shadow-md cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5 text-yellow-700" />
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* ✅ Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 hover:bg-green-200 font-medium px-4 py-2 rounded-lg border transition transform hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-green-700" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Full Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Registered At</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u, idx) => {
                const email = u.email || u.userEmail || u.account?.email || "-";
                return (
                  <tr
                    key={idx}
                    className="border-t border-gray-100 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-3 text-gray-500">
                      {page * size + idx + 1}
                    </td>
                    <td className="px-6 py-3 font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.profilePictureUrl ||
                            "https://placehold.co/40x40?text=👤"
                          }
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://placehold.co/40x40?text=👤";
                          }}
                        />
                        <div>
                          <p>{u.fullName || `${u.firstName} ${u.lastName}`}</p>
                          <p className="text-xs text-gray-500">
                            {u.role || "User"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">{email}</td>
                    <td className="px-6 py-3">{u.phone || "-"}</td>
                    <td className="px-6 py-3">{u.address || "-"}</td>
                    <td className="px-6 py-3">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          title="View Details"
                          onClick={() => handleViewClick(u)}
                          className="p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          title="Edit User"
                          onClick={() => handleEditClick(u)}
                          className="p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-yellow-100 transition cursor-pointer"
                        >
                          <PencilSquareIcon className="w-5 h-5 " />
                        </button>
                        <button
                          title="Delete User"
                          onClick={() =>
                            showInfo("Tính năng xóa đang được phát triển")
                          }
                          className="p-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-red-100 transition cursor-pointer"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-6 text-center text-gray-500 italic"
                >
                  Không tìm thấy người dùng.
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
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 cursor-pointer"
        >
          ← Previous
        </button>
        <span className="text-gray-600 text-sm">
          Page <strong>{page + 1}</strong> of {totalPages}
        </span>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 cursor-pointer"
        >
          Next →
        </button>
      </div>

      {/* Modals */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}

      {viewingUser && (
        <ViewUserModal
          userId={viewingUser.userId || viewingUser.id}
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}

      {loadingView && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-indigo-700 font-medium">
            Loading user details...
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
