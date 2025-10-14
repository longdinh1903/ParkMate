import React, { useState } from "react";
import authApi from "../api/authApi";

export default function OtpPopup({ email, onVerified, onClose }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = async () => {
    if (!otp) {
      setMessage("⚠️ Please enter the OTP");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const res = await authApi.verifyOtp(otp);
      console.log("Verify response:", res.data);

      if (res.data.success) {
        setMessage("✅ Email verified successfully!");
        setTimeout(() => {
          onVerified && onVerified();
          handleClose(); // ✅ tự đóng popup khi verified
        }, 1200);
      } else {
        setMessage("❌ Invalid OTP, please try again.");
      }
    } catch (err) {
      console.error("❌ OTP verification failed:", err);
      setMessage("❌ Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setMessage("");
      const res = await authApi.resendEmail(email);
      console.log("Resend response:", res.data);
      setMessage("📧 A new OTP has been sent to your email.");
    } catch (err) {
      console.error("❌ Resend failed:", err);
      setMessage("❌ Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  // ✅ Hàm này giúp đóng popup và reset lại state
  const handleClose = () => {
    setOtp("");
    setMessage("");
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center relative animate-fadeIn">
        {/* ✖ Nút đóng popup */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✖
        </button>

        {/* Icon */}
        <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-full bg-indigo-100">
          <span className="text-indigo-600 text-2xl">📧</span>
        </div>

        <h3 className="text-xl font-semibold mb-2">Verify Your Email</h3>
        <p className="text-gray-500 text-sm mb-4">
          We sent a 6-digit code to <br />
          <span className="font-medium text-indigo-600">{email}</span>
        </p>

        {/* OTP Input */}
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP code"
          className="border p-2 w-full rounded-md mb-3 text-center tracking-widest"
        />

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={resending}
          className="mt-3 w-full border border-indigo-500 text-indigo-600 py-2 rounded-md hover:bg-indigo-50 disabled:opacity-50"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>

        {/* Message */}
        {message && (
          <p
            className={`text-sm mt-3 ${
              message.startsWith("✅") || message.startsWith("📧")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
