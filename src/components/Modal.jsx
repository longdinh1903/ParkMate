import React from "react";

export default function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Nền mờ sáng với blur */}
      <div
        className="absolute inset-0 bg-white/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Nội dung popup */}
      <div className="relative bg-white rounded-lg shadow-lg z-50 w-full max-w-md p-6 animate-fade-in">
        {/* Nút X ở góc phải */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>

        {children}
      </div>
    </div>
  );
}
