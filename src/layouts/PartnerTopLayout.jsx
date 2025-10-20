// src/layouts/PartnerTopLayout.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/24/outline";

export default function PartnerTopLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 🔹 Navbar cố định trên cùng */}
      <header className="fixed top-0 left-0 w-full z-50 bg-indigo-600 text-white shadow-md h-16 flex items-center px-8">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold">
            P
          </div>
          <span className="text-lg font-semibold">Partner Portal</span>
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

        {/* User info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <UserCircleIcon className="w-6 h-6 text-white" />
          <span className="text-sm font-medium">John Partner</span>
        </div>
      </header>

      {/* 🔹 Nội dung cuộn riêng biệt */}
      <main
        className="flex-1 overflow-y-auto pt-20 px-8 pb-8"
        style={{ height: "100vh" }}
      >
        {children}
      </main>
    </div>
  );
}
