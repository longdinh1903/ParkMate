import React from "react";
import Modal from "./Modal";

export default function RuleDetailModal({ rule, onClose }) {
  if (!rule) return null;

  return (
    <Modal isOpen={!!rule} onClose={onClose}>
      <div className="p-6 space-y-4 bg-white rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">
          🧾 Pricing Rule Detail
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <p>
            <strong>Rule Name:</strong> {rule.ruleName || "-"}
          </p>
          <p>
            <strong>Vehicle Type:</strong> {rule.vehicleType || "-"}
          </p>
          <p>
            <strong>Step Rate (VND):</strong>{" "}
            {rule.stepRate ? rule.stepRate.toLocaleString() : "-"}
          </p>
          <p>
            <strong>Step Minute:</strong> {rule.stepMinute || "-"}
          </p>
          <p>
            <strong>Initial Charge (VND):</strong>{" "}
            {rule.initialCharge ? rule.initialCharge.toLocaleString() : "-"}
          </p>
          <p>
            <strong>Initial Duration (minutes):</strong>{" "}
            {rule.initialDurationMinute || "-"}
          </p>
          <p>
            <strong>Valid From:</strong>{" "}
            {rule.validFrom
              ? new Date(rule.validFrom).toLocaleString("vi-VN")
              : "-"}
          </p>
          <p>
            <strong>Valid To:</strong>{" "}
            {rule.validTo
              ? new Date(rule.validTo).toLocaleString("vi-VN")
              : "-"}
          </p>
          <p>
            <strong>Area ID:</strong> {rule.areaId || "-"}
          </p>
        </div>

        {/* Optional Description Section */}
        {rule.description && (
          <div className="mt-4">
            <p className="font-semibold">Rule Description:</p>
            <p className="text-gray-600 whitespace-pre-line">
              {rule.description}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
