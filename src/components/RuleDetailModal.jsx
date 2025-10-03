import React from "react";
import Modal from "./Modal";

export default function RuleDetailModal({ rule, onClose }) {
  if (!rule) return null;

  return (
    <Modal isOpen={!!rule} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold mb-4">Rule Detail</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>Area:</strong> {rule.area || "-"}</p>
          <p><strong>Rule Name:</strong> {rule.ruleName || "-"}</p>
          <p><strong>Vehicle Type:</strong> {rule.vehicleType}</p>
          <p><strong>Base Rate (VND):</strong> {rule.baseRate}</p>
          <p><strong>Deposit Rate (VND):</strong> {rule.depositRate || "-"}</p>
          <p><strong>Grace Period (min):</strong> {rule.gracePeriod}</p>
          <p><strong>Free Minutes:</strong> {rule.freeMinutes}</p>
          <p><strong>Valid From:</strong> {rule.validFrom}</p>
          <p><strong>Valid To:</strong> {rule.validTo || "-"}</p>
        </div>

        <div className="mt-4">
          <p className="font-semibold">Rule Description:</p>
          <p className="text-gray-600 whitespace-pre-line">
            {rule.description || "No description provided"}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
