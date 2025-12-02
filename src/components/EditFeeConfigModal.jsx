import React, { useState, useEffect, useRef } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import operationalFeeApi from "../api/operationalFeeApi";

export default function EditFeeConfigModal({ feeConfig, onClose, onUpdated }) {
  const [form, setForm] = useState({
    pricePerSqm: "",
    billingPeriodMonths: "",
    description: "",
    validFrom: "",
    validUntil: "",
  });
  const [loading, setLoading] = useState(false);
  const priceRef = useRef(null);
  const formatVnd = (val) => {
    if (val === "" || val === undefined || val === null) return "";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(Number(val));
    } catch {
      return "";
    }
  };

  const modalRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (feeConfig) {
      // Format datetime for input type="datetime-local"
      const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };

      setForm({
        pricePerSqm: feeConfig.pricePerSqm || "",
        billingPeriodMonths: feeConfig.billingPeriodMonths || "",
        description: feeConfig.description || "",
        validFrom: formatDateTime(feeConfig.validFrom),
        validUntil: formatDateTime(feeConfig.validUntil),
      });
    }
  }, [feeConfig]);

  // Close modal on ESC key and trap focus on open
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    // focus first input
    setTimeout(() => priceRef.current?.focus(), 10);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate dates
      if (new Date(form.validFrom) >= new Date(form.validUntil)) {
        setLoading(false);
        showError("Valid From date must be before Valid Until date");
        return;
      }

      const payload = {
        pricePerSqm: parseFloat(form.pricePerSqm),
        billingPeriodMonths: parseInt(form.billingPeriodMonths),
        description: form.description,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
      };

      const res = await operationalFeeApi.update(feeConfig.id, payload);

      if (res.status === 200) {
        showSuccess("✅ Fee configuration updated successfully!");
        onUpdated();
        onClose();
      } else {
        showError("❌ Failed to update fee configuration!");
      }
    } catch (err) {
      console.error("❌ Error updating fee config:", err);
      const msg =
        err.response?.data?.message || "Failed to update fee configuration.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 max-h-[80vh] overflow-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <i className="ri-money-dollar-circle-line text-orange-500 text-xl" />
            Edit Fee Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 text-sm text-gray-700">
          <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per sqm (VND)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ₫
                </span>
                <input
                  type="number"
                  name="pricePerSqm"
                  value={form.pricePerSqm}
                  onChange={handleChange}
                  ref={priceRef}
                  required
                  step="0.1"
                  min="0"
                  className="w-full border border-gray-300 px-10 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Price per square meter (VND){" "}
                {form.pricePerSqm && (
                  <span className="ml-2 font-medium text-gray-700">
                    • {formatVnd(form.pricePerSqm)}
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Period (Months)
                </label>
                <input
                  type="number"
                  name="billingPeriodMonths"
                  value={form.billingPeriodMonths}
                  onChange={handleChange}
                  required
                  min="1"
                  aria-label="Billing Period in months"
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short note about the fee"
                rows={3}
                aria-label="Description"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50 resize-y max-h-40 overflow-auto"
              />
            </div>

            {/* removed duplicate description block */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="datetime-local"
                  name="validFrom"
                  value={form.validFrom}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="datetime-local"
                  name="validUntil"
                  value={form.validUntil}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
                />
              </div>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-save-line"></i>
            {loading ? "Updating..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
