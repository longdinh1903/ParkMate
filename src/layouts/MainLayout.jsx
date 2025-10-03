import React from "react";
import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">{children}</div>
      {/* <footer className="border-t text-center text-gray-500 text-sm py-4">
        © 2024 Parking Admin | Privacy Policy | Terms of Service
      </footer> */}
    </div>
  );
}
