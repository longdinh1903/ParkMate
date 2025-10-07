import React from "react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
      {/* Nền tối mờ + blur nhẹ */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[3px] transition-all duration-300"
        onClick={onClose}
      ></div>

      {/* Popup container */}
      <div
        className="
          relative z-50 bg-white 
          rounded-2xl shadow-2xl border border-gray-100 
          w-full max-w-lg 
          animate-slide-up 
          transform transition-all duration-300
        "
      >
        {/* Nút đóng */}
        {/* <button
          onClick={onClose}
          className="
            absolute top-3 right-3 text-gray-400 
            hover:text-gray-600 transition-colors text-xl
          "
        >
          <i className="ri-close-line"></i>
        </button> */}

        {/* Nội dung */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}