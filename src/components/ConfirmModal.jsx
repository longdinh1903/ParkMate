import React from "react";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-xl shadow-lg w-[400px] p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
