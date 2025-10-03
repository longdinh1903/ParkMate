import { useState } from "react";
import partnerApi from "../api/partnerApi";

export default function AddPartnerModal({ onClose }) {
  const [form, setForm] = useState({
    partnerName: "",
    email: "",
    companyName: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await partnerApi.create(form);
      alert("✅ Partner added successfully!");
      onClose();
    } catch (err) {
      console.error("❌ Error adding partner:", err);
      alert("Failed to add partner");
    }
  };

  return (
    <div className="p-6 w-96">
      <h2 className="text-xl font-bold mb-4">Add New Partner</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="partnerName"
          placeholder="Partner Name"
          value={form.partnerName}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={form.companyName}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
