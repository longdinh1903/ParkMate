import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-indigo-100">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
