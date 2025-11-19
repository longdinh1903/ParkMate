import React, { useState, useEffect } from "react";
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
      const msg = err.response?.data?.message || "Failed to update fee configuration.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white w-[500px] rounded-xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-orange-700 mb-4">
          ✏️ Edit Fee Configuration
        </h2>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per sqm (VND)
            </label>
            <input
              type="number"
              name="pricePerSqm"
              value={form.pricePerSqm}
              onChange={handleChange}
              required
              step="0.1"
              min="0"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
          </div>

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
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="3"
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
          </div>

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
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
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
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
