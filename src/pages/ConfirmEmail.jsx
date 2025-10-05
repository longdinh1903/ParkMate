import React, { useState } from "react";
import OtpPopup from "../components/OtpPopup";

export default function ConfirmEmail({ email }) {
  const [showOtp, setShowOtp] = useState(false);

  return (
    <div className="flex flex-col items-center text-center">
      <button
        onClick={() => setShowOtp(true)}
        className="w-full border border-indigo-500 py-2 rounded-md text-indigo-600 hover:bg-indigo-50 mb-3"
      >
        Enter OTP
      </button>

      {showOtp && (
        <OtpPopup
          email={email}
          onVerified={() => alert("🎉 Verified!")}
        />
      )}
    </div>
  );
}
