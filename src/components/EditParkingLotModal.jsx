import { useState, useEffect } from "react";
import { showSuccess, showError } from "../utils/toastUtils.jsx";
import parkingLotApi from "../api/parkingLotApi";

export default function EditParkingLotModal({ open, onClose, lot, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    streetAddress: "",
    ward: "",
    city: "",
    latitude: "",
    longitude: "",
    totalFloors: "",
    operatingHoursStart: "",
    operatingHoursEnd: "",
    is24Hour: false,
    status: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lot) {
      setForm({
        name: lot.name || "",
        streetAddress: lot.streetAddress || "",
        ward: lot.ward || "",
        city: lot.city || "",
        latitude: lot.latitude || "",
        longitude: lot.longitude || "",
        totalFloors: lot.totalFloors || "",
        operatingHoursStart: lot.operatingHoursStart || "",
        operatingHoursEnd: lot.operatingHoursEnd || "",
        is24Hour: lot.is24Hour || false,
        status: lot.status || "PENDING",
        reason: "",
      });
    }
  }, [lot]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lot) return;

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        streetAddress: form.streetAddress,
        ward: form.ward,
        city: form.city,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        totalFloors: parseInt(form.totalFloors) || 0,
        operatingHoursStart: form.operatingHoursStart,
        operatingHoursEnd: form.operatingHoursEnd,
        is24Hour: form.is24Hour,
        status: form.status,
      };
      if (["REJECTED", "MAP_DENIED"].includes(form.status))
        payload.reason = form.reason;

      const res = await parkingLotApi.update(lot.id, payload);

      if (res.status === 200 || res.status === 204) {
        showSuccess(`✅ Updated "${form.name}" successfully!`);
        onUpdated();
        onClose();
      } else {
        showError("❌ Failed to update parking lot.");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        "❌ Error occurred while updating parking lot.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] p-6 overflow-y-auto max-h-[90vh] animate-fadeIn">
        <h2 className="text-xl font-semibold text-orange-700 mb-4">
          Edit Parking Lot
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={form.streetAddress}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ward</label>
              <input
                type="text"
                name="ward"
                value={form.ward}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Floors</label>
              <input
                type="number"
                name="totalFloors"
                value={form.totalFloors}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Opening Time (HH:mm:ss)
              </label>
              <input
                type="text"
                name="operatingHoursStart"
                placeholder="06:00:00"
                value={form.operatingHoursStart}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Closing Time (HH:mm:ss)
              </label>
              <input
                type="text"
                name="operatingHoursEnd"
                placeholder="23:00:00"
                value={form.operatingHoursEnd}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* 24 Hour */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="is24Hour"
              checked={form.is24Hour}
              onChange={handleChange}
              className="h-4 w-4 text-orange-600 border-gray-300 rounded"
            />
            <label className="text-sm font-medium text-gray-700">24 Hour</label>
          </div>

          

          {/* Reason */}
          {["REJECTED", "MAP_DENIED"].includes(form.status) && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reason (required for REJECTED or MAP_DENIED)
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-orange-400"
                rows={3}
                required
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
