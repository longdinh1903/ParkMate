import React from "react";
import { useNavigate } from "react-router-dom";

export default function ConfirmEmail({ email }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
        <span className="text-white text-xl">📧</span>
      </div>

      <h2 className="text-xl font-semibold mb-2">Check your email</h2>
      <p className="text-gray-600 mb-6">
        We’ve sent a confirmation link to{" "}
        <span className="font-semibold">{email || "partner@example.com"}</span>.
        Please verify your account.
      </p>

      {/* Nút Resend */}
      <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 mb-3">
        Resend Email
      </button>

      {/* Nút Back to Login */}
      <button
        onClick={() => navigate("/login")}
        className="w-full border border-gray-300 py-2 rounded-md hover:bg-gray-100"
      >
        Back to Login
      </button>
    </div>
  );
}
