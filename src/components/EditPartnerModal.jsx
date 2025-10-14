import { useState } from "react";
import partnerApi from "../api/partnerApi";
import { showError, showSuccess } from "../utils/toastUtils.jsx";

export default function EditPartnerModal({ partner, onClose, onUpdated }) {
  const [form, setForm] = useState({
    companyName: partner.companyName || "",
    taxNumber: partner.taxNumber || "",
    businessLicenseNumber: partner.businessLicenseNumber || "",
    businessLicenseFileUrl: partner.businessLicenseFileUrl || "",
    companyAddress: partner.companyAddress || "",
    companyPhone: partner.companyPhone || "",
    companyEmail: partner.companyEmail || "",
    businessDescription: partner.businessDescription || "",
    status: partner.status || "PENDING",
    suspensionReason: partner.suspensionReason || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = partner.partnerId || partner.id;
      const res = await partnerApi.update(id, form);
      if (res.status === 200) {
        showSuccess("✅ Partner updated successfully!");
        onUpdated();
        onClose();
      } else {
        showError("❌ Failed to update partner.");
      }
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "❌ Update failed!");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-xl shadow-lg w-[600px] p-6">
        <h2 className="text-xl font-semibold text-indigo-700 mb-4">
          Edit Partner
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="companyName"
            placeholder="Company Name"
            value={form.companyName}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          <input
            name="taxNumber"
            placeholder="Tax Number"
            value={form.taxNumber}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          <input
            name="companyEmail"
            placeholder="Email"
            value={form.companyEmail}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          <input
            name="companyPhone"
            placeholder="Phone"
            value={form.companyPhone}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          <input
            name="companyAddress"
            placeholder="Address"
            value={form.companyAddress}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          <input
            name="businessDescription"
            placeholder="Business Description"
            value={form.businessDescription}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />
          {/* <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select> */}

          <textarea
            name="suspensionReason"
            placeholder="Suspension Reason"
            value={form.suspensionReason}
            onChange={handleChange}
            className="border border-gray-300 w-full px-3 py-2 rounded-lg"
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
