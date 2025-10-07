import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { name: "Partners", path: "/admin/partners", icon: "ri-building-fill" },
    { name: "Users", path: "/admin/users", icon: "ri-user-3-fill" },
    { name: "Requests", path: "/admin/requests", icon: "ri-file-list-3-fill" },
    {
      name: "Parking Lots",
      path: "/admin/parking-lots",
      icon: "ri-parking-box-fill",
    },
    { name: "Dashboard", path: "/admin/dashboard", icon: "ri-dashboard-fill" },
  ];

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await axios.post("/api/v1/user-service/auth/logout", { refreshToken });
      }
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/admin/login");
    } catch (err) {
      console.error("❌ Logout failed:", err);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`relative bg-indigo-700 text-white flex flex-col py-6 transition-all duration-300 shadow-lg ${
          isExpanded ? "w-64" : "w-20 items-center"
        }`}
      >
        {/* Logo */}
        <div
          className={`flex items-center ${
            isExpanded ? "px-6 justify-start" : "justify-center"
          } mb-6`}
        >
          <i className="ri-parking-fill text-3xl"></i>
          {isExpanded && (
            <span className="ml-3 text-lg font-bold whitespace-nowrap transition-opacity">
              Parking Admin
            </span>
          )}
        </div>

        {/* Menu items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg transition-all duration-300 ${
                    isExpanded ? "px-6 py-3" : "justify-center w-12 h-12"
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-indigo-600 hover:text-white text-gray-200"
                  }`}
                >
                  <i className={`${item.icon} text-2xl`}></i>
                  {isExpanded && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>

                {/* Tooltip (chỉ hiện khi thu gọn) */}
                {!isExpanded && (
                  <div
                    className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 
                    group-hover:opacity-100 pointer-events-none bg-gray-900 text-white text-sm px-3 py-1.5 
                    rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 translate-x-2"
                  >
                    {item.name}
                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: Toggle + Logout */}
        <div
          className={`mt-auto flex flex-col ${
            isExpanded ? "px-6" : "items-center"
          } space-y-3`}
        >
          {/* Toggle button */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <i
              className={`ri-arrow-${
                isExpanded ? "left" : "right"
              }-s-line text-2xl`}
            ></i>
          </button>

          {/* Logout */}
          <div className="relative group">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-12 h-12 rounded-lg text-gray-300 hover:bg-indigo-600 hover:text-white transition"
            >
              <i className="ri-logout-box-r-line text-2xl"></i>
            </button>

            {!isExpanded && (
              <div
                className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 
                pointer-events-none bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg 
                whitespace-nowrap transition-all duration-300 translate-x-2"
              >
                Logout
                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Nội dung trang */}
        <main className="flex-1 p-6 relative">
          {children}

          {/* ✅ Toaster Global cho toàn bộ Admin */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                fontFamily: "Inter, sans-serif",
                borderRadius: "10px",
                fontSize: "14px",
              },
            }}
          />
        </main>
      </div>
    </div>
  );
}
