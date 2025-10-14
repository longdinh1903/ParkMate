import React, { useEffect, useState } from "react";
import adminApi from "../api/adminApi";
import { showError } from "../utils/toastUtils";

export default function ViewUserModal({ userId, user, onClose }) {
  const [data, setData] = useState(user || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getUserById(userId);
        setData(res.data?.data || null);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        showError("Không thể tải thông tin người dùng!");
      } finally {
        setLoading(false);
      }
    };
    // Nếu chưa có dữ liệu thì gọi API
    if (!user) fetchUser();
  }, [userId]);

  if (!data && !loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative p-6">
          <h2 className="text-lg font-semibold text-indigo-700 mb-4">
            User Details
          </h2>
          <p className="text-center text-red-500 italic">
            Không tìm thấy người dùng này.
          </p>
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
        <div className="bg-white px-6 py-4 rounded-lg shadow-md text-indigo-700">
          Đang tải thông tin người dùng...
        </div>
      </div>
    );

  // ✅ Helper Badge
  const Badge = ({ text, color }) => (
    <span
      className={`px-3 py-1 text-sm font-medium rounded-full ${
        color === "green"
          ? "bg-green-100 text-green-700"
          : color === "red"
          ? "bg-red-100 text-red-700"
          : color === "yellow"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {text}
    </span>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6 text-indigo-500"
            >
              <path
                fillRule="evenodd"
                d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 1116 0H4z"
                clipRule="evenodd"
              />
            </svg>
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 text-gray-700 text-sm space-y-8">
          {/* Profile Header */}
          <div className="text-center">
            <img
              src={
                data.profilePicturePresignedUrl ||
                data.profilePictureUrl ||
                "https://placehold.co/100x100?text=👤"
              }
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-200 mx-auto mb-3"
            />
            <h3 className="text-lg font-semibold">{data.fullName}</h3>
            <p className="text-gray-500">{data.email}</p>
            <div className="flex justify-center gap-3 mt-2">
              <Badge text={data.role || "USER"} color="gray" />
              <Badge
                text={data.status || "UNKNOWN"}
                color={
                  data.status === "ACTIVE"
                    ? "green"
                    : data.status === "INACTIVE"
                    ? "red"
                    : "yellow"
                }
              />
            </div>
          </div>

          {/* Contact & Address */}
          <section>
            <h4 className="text-indigo-600 font-semibold border-b border-indigo-200 pb-1 mb-3">
              Contact & Address
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Phone</p>
                <p>{data.phone || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Address</p>
                <p>{data.address || "-"}</p>
              </div>
            </div>
          </section>

          {/* Personal & ID */}
          <section>
            <h4 className="text-indigo-600 font-semibold border-b border-indigo-200 pb-1 mb-3">
              Personal & ID
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Date of Birth</p>
                <p>{formatDate(data.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">ID Number</p>
                <p>{data.idNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Issue Place</p>
                <p>{data.issuePlace || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Issue Date</p>
                <p>{formatDate(data.issueDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Expiry Date</p>
                <p>{formatDate(data.expiryDate)}</p>
              </div>
            </div>

            {/* ID Photos */}
            {(data.frontPhotoPresignedUrl || data.backPhotoPresignedUrl) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {data.frontPhotoPresignedUrl && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Front of ID</p>
                    <img
                      src={data.frontPhotoPresignedUrl}
                      alt="Front ID"
                      className="w-full h-40 object-cover rounded-md border"
                    />
                  </div>
                )}
                {data.backPhotoPresignedUrl && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Back of ID</p>
                    <img
                      src={data.backPhotoPresignedUrl}
                      alt="Back ID"
                      className="w-full h-40 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h4 className="text-indigo-600 font-semibold border-b border-indigo-200 pb-1 mb-3">
              History
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Created At</p>
                <p>{formatDate(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Updated At</p>
                <p>{formatDate(data.updatedAt)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
