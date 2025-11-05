import { useState, useEffect } from "react";
import { showSuccess, showError } from "../utils/toastUtils.jsx";

export default function EditUserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    role: "",
  });

  useEffect(() => {
    if (user) setForm(user);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(form);
      showSuccess("User updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      showError("Failed to update user!");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[420px]">
        <h3 className="text-lg font-semibold mb-4 text-orange-700">
          Edit User
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <input
              name="fullName"
              value={form.fullName || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <input
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Address</label>
            <input
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <input
              name="role"
              value={form.role || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
