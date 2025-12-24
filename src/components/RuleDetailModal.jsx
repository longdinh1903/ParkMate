import React from "react";
import Modal from "./Modal";

export default function RuleDetailModal({ rule, onClose }) {
  if (!rule) return null;

  return (
    <Modal isOpen={!!rule} onClose={onClose}>
      <div className="p-6 space-y-4 bg-white rounded-2xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">
          🧾 Thông tin chi tiết
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <p>
            <strong>Tên quy tắc:</strong> {rule.ruleName || "-"}
          </p>
          <p>
            <strong>Loại xe:</strong> {rule.vehicleType || "-"}
          </p>
          <p>
            <strong>Phí ban đầu (VND):</strong>{" "}
            {rule.initialCharge ? rule.initialCharge.toLocaleString() : "-"}
          </p>
          <p>
            <strong>Thời gian ban đầu (phút):</strong>{" "}
            {rule.initialDurationMinute || "-"}
          </p>
          <p>
            <strong>Phí bước (VND):</strong>{" "}
            {rule.stepRate ? rule.stepRate.toLocaleString() : "-"}
          </p>
          <p>
            <strong>Bước nhảy (phút):</strong> {rule.stepMinute || "-"}
          </p>
          <p>
            <strong>Hiệu lực từ:</strong>{" "}
            {rule.validFrom
              ? new Date(rule.validFrom).toLocaleString("vi-VN")
              : "-"}
          </p>
          <p>
            <strong>Hiệu lực đến:</strong>{" "}
            {rule.validTo
              ? new Date(rule.validTo).toLocaleString("vi-VN")
              : "-"}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
