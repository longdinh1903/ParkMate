// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">P</span>
        </div>
        <span className="text-lg font-semibold text-gray-700">
          Parking Partner
        </span>
      </div>

      {/* Menu */}
      <div className="flex space-x-6 text-gray-600">
        <Link to="/home" className="hover:text-indigo-600">
          Home
        </Link>
        <Link to="/register-lot" className="hover:text-indigo-600">
          Register Lot
        </Link>
        <Link to="/reports" className="hover:text-indigo-600">
          Reports
        </Link>
        <Link to="/profile" className="hover:text-indigo-600">
          Profile
        </Link>
      </div>

      {/* User */}
      <div className="flex items-center space-x-2">
        <img
          src="https://i.pravatar.cc/40"
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="text-gray-700">John Partner</span>
      </div>
    </nav>
  );
}
