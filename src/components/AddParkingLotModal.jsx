import { useState } from "react";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import parkingLotApi from "../api/parkingLotApi";

export default function AddParkingLotModal({ open, onClose, onCreated, partnerId }) {
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
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      showInfo("🚀 Creating parking lot...");

      const payload = {
        ...form,
        totalFloors: parseInt(form.totalFloors),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        lotCapacityRequests: [
          {
            capacity: 50,
            vehicleType: "CAR_UP_TO_9_SEATS",
            supportElectricVehicle: false,
          },
        ],
        pricingRuleCreateRequests: [
          {
            ruleName: "Standard Weekday Pricing",
            vehicleType: "CAR_UP_TO_9_SEATS",
            baseRate: 15000,
            depositFee: 50000,
            initialCharge: 5000,
            initialDurationMinute: 30,
            freeMinute: 15,
            gracePeriodMinute: 10,
            validFrom: "2025-01-01T00:00:00",
            validTo: "2025-12-31T23:59:59",
            areaId: 1,
          },
        ],
      };

      await parkingLotApi.register(partnerId, payload);

      showSuccess("✅ Parking lot created successfully!");
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("❌ Error creating parking lot:", err);
      showError(err.response?.data?.message || "Failed to create parking lot!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-indigo-700 mb-4">
          ➕ Add New Parking Lot
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              required
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              placeholder="Street Address"
              required
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="ward"
              value={form.ward}
              onChange={handleChange}
              placeholder="Ward"
              required
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              required
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="Latitude"
              required
              type="number"
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="Longitude"
              required
              type="number"
              className="border rounded-lg px-3 py-2 w-full"
            />
            <input
              name="totalFloors"
              value={form.totalFloors}
              onChange={handleChange}
              placeholder="Total Floors"
              required
              type="number"
              min="1"
              className="border rounded-lg px-3 py-2 w-full"
            />
            <label className="flex items-center gap-2">
              <input
                name="is24Hour"
                type="checkbox"
                checked={form.is24Hour}
                onChange={handleChange}
              />
              24 Hours
            </label>
          </div>

          {!form.is24Hour && (
            <div className="grid grid-cols-2 gap-3">
              <input
                name="operatingHoursStart"
                type="time"
                value={form.operatingHoursStart}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
              <input
                name="operatingHoursEnd"
                type="time"
                value={form.operatingHoursEnd}
                onChange={handleChange}
                required
                className="border rounded-lg px-3 py-2 w-full"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
