import React, { useState } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import partnerApi from "../api/partnerApi";

export default function AddPartnerModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    companyName: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFileUrl: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    businessDescription: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await partnerApi.create({
        approvalRequestId: 123, // 👈 giá trị tạm (backend yêu cầu có)
        ...form,
      });

      if (res.status === 200 || res.status === 201) {
        showSuccess("✅ Partner created successfully!");
        onAdded();
        onClose();
      } else {
        showError("❌ Failed to create partner!");
      }
    } catch (err) {
      console.error("❌ Error creating partner:", err);
      const msg = err.response?.data?.message || "Failed to create partner.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white w-[500px] rounded-xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-orange-700 mb-4">
          ➕ Add New Partner
        </h2>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {[
            { label: "Company Name", name: "companyName" },
            { label: "Tax Number", name: "taxNumber" },
            { label: "License Number", name: "businessLicenseNumber" },
            { label: "License File URL", name: "businessLicenseFileUrl" },
            { label: "Phone", name: "companyPhone" },
            { label: "Email", name: "companyEmail" },
            { label: "Address", name: "companyAddress" },
            { label: "Description", name: "businessDescription" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {f.label}
              </label>
              <input
                type="text"
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none transition"
              />
            </div>
          ))}

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
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
