import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({ isOpen = true, onClose, children, title, maxWidth = "max-w-2xl" }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl ${maxWidth} w-full mx-4 max-h-[90vh] overflow-y-auto animate-fadeInScale`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={title ? "p-6" : ""}>
          {children}
        </div>
      </div>
    </div>
  );
}
