import React, { useState, useRef } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import operationalFeeApi from "../api/operationalFeeApi";

export default function AddFeeConfigModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    pricePerSqm: "",
    billingPeriodMonths: "",
    description: "",
    validFrom: "",
    validUntil: "",
  });
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);

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
        showError("Valid From date must be before Valid Until date");
        setLoading(false);
        return;
      }

      const payload = {
        pricePerSqm: parseFloat(form.pricePerSqm),
        billingPeriodMonths: parseInt(form.billingPeriodMonths),
        description: form.description,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
      };

      const res = await operationalFeeApi.create(payload);

      if (res.status === 200 || res.status === 201) {
        showSuccess("✅ Fee configuration created successfully!");
        const created = res.data?.data || res.data;
        // normalize and mark as active so it appears immediately at top
        if (created) {
          if (created.isActive === undefined) created.isActive = true;
          if (!created.status) created.status = "ACTIVE";
          if (!created.validFrom) created.validFrom = new Date().toISOString();
          if (!created.createdAt) created.createdAt = new Date().toISOString();
        }
        // pass created object back to parent so it can update UI optimistically
        onAdded?.(created);
        onClose();
      } else {
        showError("❌ Failed to create fee configuration!");
      }
    } catch (err) {
      console.error("❌ Error creating fee config:", err);
      const msg = err.response?.data?.message || "Failed to create fee configuration.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <i className="ri-money-dollar-circle-line text-2xl text-orange-500"></i>
            Add New Fee Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form id="add-fee-form" ref={formRef} className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per sqm (VND)</label>
              <input
                type="number"
                name="pricePerSqm"
                value={form.pricePerSqm}
                onChange={handleChange}
                required
                step="0.1"
                min="0"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period (Months)</label>
              <input
                type="number"
                name="billingPeriodMonths"
                value={form.billingPeriodMonths}
                onChange={handleChange}
                required
                min="1"
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition bg-gray-50 resize-y max-h-40 overflow-auto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-fee-form"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-add-line"></i>
            <span>{loading ? "Creating..." : "Create"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
