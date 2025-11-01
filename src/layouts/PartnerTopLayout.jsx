// src/layouts/PartnerTopLayout.jsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { UserCircleIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import authApi from "../api/authApi";

export default function PartnerTopLayout({ children }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get user email from localStorage
  const userEmail = localStorage.getItem("userEmail") || "partner@example.com";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
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
      
      toast.success("✅ Logged out successfully!");
      
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
      
      toast.error("⚠️ Logged out (with errors)");
      setTimeout(() => {
        navigate("/login");
      }, 500);
    }
  };

  return (
    <>
      {/* 🔹 Navbar cố định trên cùng */}
      <header className="fixed top-0 left-0 w-full z-50 bg-indigo-600 text-white shadow-md h-16 flex items-center px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold">
            P
          </div>
          <span className="text-lg font-semibold">Parking Partner</span>
        </div>

        {/* Menu */}
        <nav className="flex items-center gap-8 text-sm font-medium ml-16 flex-1">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `hover:text-indigo-200 transition ${
                isActive ? "underline text-indigo-200" : ""
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/register-lot"
            className={({ isActive }) =>
              `hover:text-indigo-200 transition ${
                isActive ? "underline text-indigo-200" : ""
              }`
            }
          >
            Register Lot
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `hover:text-indigo-200 transition ${
                isActive ? "underline text-indigo-200" : ""
              }`
            }
          >
            Reports
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `hover:text-indigo-200 transition ${
                isActive ? "underline text-indigo-200" : ""
              }`
            }
          >
            Profile
          </NavLink>
        </nav>

        {/* User info with dropdown */}
        <div className="relative flex items-center gap-4 flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <UserCircleIcon className="w-6 h-6 text-white" />
            <span className="text-sm font-medium truncate max-w-[200px]" title={userEmail}>
              {userEmail}
            </span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
              {/* Profile Button */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/profile");
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <UserCircleIcon className="w-5 h-5" />
                <span>Profile</span>
              </button>
              
              <hr className="my-1 border-gray-200" />
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 🔹 Nội dung - không có overflow riêng, scroll toàn trang */}
      <main className="pt-16 bg-gray-50">
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
