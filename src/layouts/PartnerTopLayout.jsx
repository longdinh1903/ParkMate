// src/layouts/PartnerTopLayout.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import authApi from "../api/authApi";
import partnerApi from "../api/partnerApi";

export default function PartnerTopLayout({ children }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const dropdownRef = useRef(null);
  const managementRef = useRef(null);

  // Get user email from localStorage
  const userEmail = localStorage.getItem("userEmail") || "partner@example.com";

  // Check registration status on mount
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const email = localStorage.getItem("userEmail");
        const cachedStatus = localStorage.getItem("registrationStatus"); // ✅ Get cached status
        
        // Nếu không có token hoặc email, không check status (có thể là chưa login)
        if (!token || !email) {
          setIsApproved(false);
          return;
        }

        console.log("🎨 PartnerTopLayout: Checking status for email:", email);
        console.log("🎨 PartnerTopLayout: Cached status:", cachedStatus);

        // ✅ Nếu có cached status = APPROVED, set ngay
        if (cachedStatus === "APPROVED") {
          console.log("✅ PartnerTopLayout: Using cached APPROVED status");
          setIsApproved(true);
          return; // ✅ Return sớm, không cần call API
        }

        // Nếu chưa có cached status hoặc không phải APPROVED, check API
        const response = await partnerApi.getRequests({});
        
        // Handle multiple response structures
        let registrationsList = [];
        if (response?.data?.content) {
          registrationsList = response.data.content;
        } else if (response?.data?.data?.content) {
          registrationsList = response.data.data.content;
        } else if (Array.isArray(response?.data?.data)) {
          registrationsList = response.data.data;
        } else if (Array.isArray(response?.data)) {
          registrationsList = response.data;
        }

        const registration = registrationsList.find(
          (req) => req.companyEmail === email || req.contactPersonEmail === email
        );

        console.log("🎨 PartnerTopLayout: Found registration:", registration);

        if (registration && registration.status === "APPROVED") {
          console.log("✅ PartnerTopLayout: Status is APPROVED");
          setIsApproved(true);
        } else {
          console.log("❌ PartnerTopLayout: Status is not APPROVED");
          setIsApproved(false);
        }
      } catch (error) {
        console.error("🎨 PartnerTopLayout: Error checking registration status:", error);
        
        // ✅ Fallback to cached status on error
        const cachedStatus = localStorage.getItem("registrationStatus");
        if (cachedStatus === "APPROVED") {
          console.log("✅ PartnerTopLayout: Using cached status on error");
          setIsApproved(true);
        } else {
          setIsApproved(false);
        }
      }
    };

    checkRegistrationStatus();
  }, [userEmail]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        managementRef.current &&
        !managementRef.current.contains(event.target)
      ) {
        setShowManagementMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        await authApi.logout(refreshToken);
      }

      // Clear all auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("partnerId");
      localStorage.removeItem("registrationId");
      localStorage.removeItem("registrationStatus");

      toast.success("✅ Đăng xuất thành công!");

      // Redirect to login
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.error("Logout error:", err);
      // Even if API fails, clear local data and redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("partnerId");
      localStorage.removeItem("registrationId");
      localStorage.removeItem("registrationStatus");

      toast.error("⚠️ Đăng xuất (có lỗi)");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    }
  };

  return (
    <>
      {/* 🔹 Navbar cố định trên cùng */}
      <header className="fixed top-0 left-0 w-full z-50 bg-indigo-600 text-white shadow-lg h-16 flex items-center px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <i className="ri-parking-fill text-white text-lg"></i>
          </div>
          <span className="text-lg font-bold">Park<span className="text-indigo-400">Mate</span></span>
        </div>

        {/* Menu */}
        <nav className="flex items-center gap-2 text-sm font-medium ml-12 flex-1">
          <NavLink
            to="/home"
            onClick={(e) => {
              if (!isApproved) {
                e.preventDefault();
                toast.error("Vui lòng đợi tài khoản được duyệt để truy cập trang này");
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white/20 text-white font-semibold shadow-sm" 
                  : "hover:bg-white/10 text-white/90 hover:text-white"
              } ${!isApproved ? "opacity-50 cursor-not-allowed" : ""}`
            }
          >
            <i className="ri-home-4-line text-lg"></i>
            Trang chủ
          </NavLink>
          <NavLink
            to="/register-lot"
            onClick={(e) => {
              if (!isApproved) {
                e.preventDefault();
                toast.error("Vui lòng đợi tài khoản được duyệt để truy cập trang này");
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white/20 text-white font-semibold shadow-sm" 
                  : "hover:bg-white/10 text-white/90 hover:text-white"
              } ${!isApproved ? "opacity-50 cursor-not-allowed" : ""}`
            }
          >
            <i className="ri-parking-box-line text-lg"></i>
            Đăng ký bãi
          </NavLink>
          <NavLink
            to="/withdrawals"
            onClick={(e) => {
              if (!isApproved) {
                e.preventDefault();
                toast.error("Vui lòng đợi tài khoản được duyệt để truy cập trang này");
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white/20 text-white font-semibold shadow-sm" 
                  : "hover:bg-white/10 text-white/90 hover:text-white"
              } ${!isApproved ? "opacity-50 cursor-not-allowed" : ""}`
            }
          >
            <i className="ri-money-dollar-circle-line text-lg"></i>
            Rút tiền
          </NavLink>

          {/* Management Dropdown */}
          <div className="relative" ref={managementRef}>
            <button
              onClick={() => {
                if (!isApproved) {
                  toast.error("Vui lòng đợi tài khoản được duyệt để truy cập trang này");
                  return;
                }
                setShowManagementMenu(!showManagementMenu);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                showManagementMenu 
                  ? "bg-white/20 text-white font-semibold shadow-sm" 
                  : "hover:bg-white/10 text-white/90 hover:text-white"
              } ${!isApproved ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <i className="ri-settings-3-line text-lg"></i>
              Quản lý
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform duration-200 ${
                  showManagementMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showManagementMenu && isApproved && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <NavLink
                  to="/subscriptions"
                  onClick={() => setShowManagementMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 transition-all ${
                      isActive ? "bg-indigo-100 font-semibold text-indigo-700" : ""
                    }`
                  }
                >
                  <i className="ri-vip-crown-line text-lg"></i>
                  Gói đăng ký
                </NavLink>
                <NavLink
                  to="/users"
                  onClick={() => setShowManagementMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 transition-all ${
                      isActive ? "bg-indigo-100 font-semibold text-indigo-700" : ""
                    }`
                  }
                >
                  <i className="ri-user-3-line text-lg"></i>
                  Người dùng
                </NavLink>
                <NavLink
                  to="/sessions"
                  onClick={() => setShowManagementMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 transition-all ${
                      isActive ? "bg-indigo-100 font-semibold text-indigo-700" : ""
                    }`
                  }
                >
                  <i className="ri-login-box-line text-lg"></i>
                  Ra/Vào
                </NavLink>
                <NavLink
                  to="/reservations"
                  onClick={() => setShowManagementMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-indigo-50 transition-all ${
                      isActive ? "bg-indigo-100 font-semibold text-indigo-700" : ""
                    }`
                  }
                >
                  <i className="ri-calendar-check-line text-lg"></i>
                  Đặt chỗ
                </NavLink>
              </div>
            )}
          </div>

          <NavLink
            to="/dashboard"
            onClick={(e) => {
              if (!isApproved) {
                e.preventDefault();
                toast.error("Vui lòng đợi tài khoản được duyệt để truy cập trang này");
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive 
                  ? "bg-white/20 text-white font-semibold shadow-sm" 
                  : "hover:bg-white/10 text-white/90 hover:text-white"
              } ${!isApproved ? "opacity-50 cursor-not-allowed" : ""}`
            }
          >
            <i className="ri-bar-chart-box-line text-lg"></i>
            Thống kê
          </NavLink>
        </nav>

        {/* User info with dropdown */}
        <div
          className="relative flex items-center gap-4 flex-shrink-0"
          ref={dropdownRef}
        >
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <UserCircleIcon className="w-6 h-6 text-white" />
            <span
              className="text-sm font-medium truncate max-w-[200px]"
              title={userEmail}
            >
              {userEmail}
            </span>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 ">
              {/* Profile Button */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/partner-profile");
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <UserCircleIcon className="w-5 h-5" />
                <span>Hồ sơ</span>
              </button>

              <hr className="my-1 border-gray-200" />

              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 🔹 Nội dung - không có overflow riêng, scroll toàn trang */}
      <main className="pt-16 bg-gray-50 min-h-screen">
        {children}

        {/* Toaster Global */}
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
    </>
  );
}
