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
        const userData = res.data?.data || null;
        console.log("👤 User data from API:", userData);
        setData(userData);
      } catch (err) {
        console.error("❌ Error fetching user:", err);
        showError("Không thể tải thông tin người dùng!");
      } finally {
        setLoading(false);
      }
    };
    // Nếu chưa có dữ liệu thì gọi API
    if (!user) fetchUser();
  }, [userId, user]);

  if (!data && !loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative p-6">
          <h2 className="text-lg font-semibold text-orange-700 mb-4">
            User Details
          </h2>
          <p className="text-center text-red-500 italic">
            Không tìm thấy người dùng này.
          </p>
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition cursor-pointer"
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
        <div className="bg-white px-6 py-4 rounded-lg shadow-md text-orange-700">
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
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6 text-orange-500"
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
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 text-gray-700 text-sm space-y-8 custom-scrollbar">
          {/* Profile Header */}
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={
                  data.profilePicturePresignedUrl ||
                  data.profilePictureUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Anonymous"
                  )}&background=FF8901&color=fff&bold=true&size=256`
                }
                alt={data.fullName || "User"}
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 shadow-lg mx-auto mb-3"
                onError={(e) => {
                  console.log("❌ Avatar image failed to load:", e.target.src);
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=Anonymous&background=94a3b8&color=fff&bold=true&size=256`;
                }}
                onLoad={() => {
                  console.log(
                    "✅ Avatar loaded successfully:",
                    data.profilePicturePresignedUrl || data.profilePictureUrl
                  );
                }}
              />
              {(data.status === "ACTIVE" || data.account?.status === "ACTIVE") && (
                <span className="absolute bottom-3 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></span>
              )}
            </div>
            <h3 className="text-lg font-semibold">
              {data.fullName ||
                `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
                "Anonymous User"}
            </h3>
            <p className="text-gray-500">
              {data.phoneNumber || data.phone || "No phone number"}
            </p>
            <div className="flex justify-center gap-3 mt-2">
              <Badge
                text={data.role || data.account?.role || "USER"}
                color="gray"
              />
              {data.nationality && (
                <Badge text={data.nationality} color="green" />
              )}
              {(data.status || data.account?.status) && (
                <Badge
                  text={data.status || data.account?.status}
                  color={
                    (data.status || data.account?.status) === "ACTIVE"
                      ? "green"
                      : "red"
                  }
                />
              )}
            </div>
          </div>

          {/* Contact & Address */}
          <section>
            <h4 className="text-orange-600 font-semibold border-b border-orange-200 pb-1 mb-3">
              Contact & Address
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Phone Number</p>
                <p className="font-medium">
                  {data.phoneNumber || data.phone || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">First Name</p>
                <p className="font-medium">{data.firstName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Last Name</p>
                <p className="font-medium">{data.lastName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Gender</p>
                <p className="font-medium">{data.gender || "-"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Address</p>
                <p className="font-medium">{data.address || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Nationality</p>
                <p className="font-medium">{data.nationality || "-"}</p>
              </div>
            </div>
          </section>

          {/* Personal & ID */}
          <section>
            <h4 className="text-orange-600 font-semibold border-b border-orange-200 pb-1 mb-3">
              Personal & Identity Card
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Date of Birth</p>
                <p className="font-medium">{formatDate(data.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">ID Number</p>
                <p className="font-medium">{data.idNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Issue By</p>
                <p className="font-medium">
                  {data.issueBy || data.issuePlace || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Issue Date</p>
                <p className="font-medium">
                  {formatDate(data.issueOn || data.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Expired Date</p>
                <p className="font-medium">
                  {formatDate(data.expiredDate || data.expiryDate)}
                </p>
              </div>
            </div>

            {/* ID Photos */}
            {(data.frontPhotoPresignedUrl || data.backPhotoPresignedUrl) && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {data.frontPhotoPresignedUrl && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Front of ID Card
                    </p>
                    <img
                      src={data.frontPhotoPresignedUrl}
                      alt="Front ID"
                      className="w-full h-40 object-cover rounded-md border hover:scale-105 transition-transform cursor-pointer"
                      onClick={() =>
                        window.open(data.frontPhotoPresignedUrl, "_blank")
                      }
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/400x250?text=Front+ID";
                      }}
                    />
                  </div>
                )}
                {data.backPhotoPresignedUrl && (
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Back of ID Card
                    </p>
                    <img
                      src={data.backPhotoPresignedUrl}
                      alt="Back ID"
                      className="w-full h-40 object-cover rounded-md border hover:scale-105 transition-transform cursor-pointer"
                      onClick={() =>
                        window.open(data.backPhotoPresignedUrl, "_blank")
                      }
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://placehold.co/400x250?text=Back+ID";
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h4 className="text-orange-600 font-semibold border-b border-orange-200 pb-1 mb-3">
              Account Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs">Email Address</p>
                <p className="font-medium">
                  {data.account?.email || data.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Created At</p>
                <p className="font-medium">{formatDateTime(data.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Updated At</p>
                <p className="font-medium">{formatDateTime(data.updatedAt)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
            >
              <span>Close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
