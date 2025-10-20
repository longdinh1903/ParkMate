import React, { useState } from "react";
import PartnerTopLayout from "../layouts/PartnerTopLayout";
import parkingLotApi from "../api/parkingLotApi";
import Modal from "../components/Modal";
import AddRuleModal from "../components/AddRuleModal";
import RuleDetailModal from "../components/RuleDetailModal";
import LocationPickerMap from "../components/LocationPickerMap";
import toast from "react-hot-toast";

export default function RegisterLot() {
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

  const [capacityForm, setCapacityForm] = useState({
    capacity: "",
    vehicleType: "",
    supportElectricVehicle: false,
  });

  const [capacities, setCapacities] = useState([]);
  const [rules, setRules] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const getPartnerIdFromStorage = () => {
    const partnerId = localStorage.getItem("partnerId");
    if (!partnerId) {
      toast.error("❌ Không tìm thấy Partner ID. Vui lòng đăng nhập lại!");
      return null;
    }
    return partnerId;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleCapacityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCapacityForm({
      ...capacityForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAddCapacity = () => {
    if (!capacityForm.capacity || !capacityForm.vehicleType) {
      toast.error("⚠️ Hãy nhập đầy đủ Capacity và Vehicle Type!");
      return;
    }
    setCapacities([...capacities, { ...capacityForm }]);
    setCapacityForm({
      capacity: "",
      vehicleType: "",
      supportElectricVehicle: false,
    });
    toast.success("✅ Đã thêm Capacity!");
  };

  const handleRemoveCapacity = (index) => {
    setCapacities(capacities.filter((_, i) => i !== index));
    toast("🗑️ Đã xóa Capacity!");
  };

  const handleAddRule = (rule) => {
    setRules([...rules, rule]);
    toast.success("✅ Đã thêm Pricing Rule!");
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
    toast("🗑️ Đã xóa Pricing Rule!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const partnerId = getPartnerIdFromStorage();
    if (!partnerId) return;

    if (!form.name || !form.city || !form.latitude || !form.longitude) {
      toast.error("⚠️ Vui lòng nhập đầy đủ thông tin cơ bản!");
      return;
    }
    if (capacities.length === 0) {
      toast.error("⚠️ Vui lòng thêm ít nhất 1 cấu hình Capacity!");
      return;
    }
    if (rules.length === 0) {
      toast.error("⚠️ Vui lòng thêm ít nhất 1 Pricing Rule!");
      return;
    }

    const payload = {
      name: form.name.trim(),
      streetAddress: form.streetAddress.trim(),
      ward: form.ward.trim(),
      city: form.city.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      totalFloors: parseInt(form.totalFloors),
      operatingHoursStart: form.operatingHoursStart,
      operatingHoursEnd: form.operatingHoursEnd,
      is24Hour: form.is24Hour,
      lotCapacityRequests: capacities.map((c) => ({
        capacity: parseInt(c.capacity),
        vehicleType: c.vehicleType,
        supportElectricVehicle: c.supportElectricVehicle,
      })),
      pricingRuleCreateRequests: rules.map((r) => ({
        ruleName: r.ruleName,
        vehicleType: r.vehicleType,
        stepRate: parseInt(r.stepRate),
        stepMinute: parseInt(r.stepMinute),
        initialCharge: parseInt(r.initialCharge),
        initialDurationMinute: parseInt(r.initialDurationMinute),
        validFrom: r.validFrom ? new Date(r.validFrom).toISOString() : null,
        validTo: r.validTo ? new Date(r.validTo).toISOString() : null,
        areaId: parseInt(r.areaId),
      })),
    };

    const loadingId = toast.loading("🚗 Đang gửi yêu cầu đăng ký...");
    try {
      const res = await parkingLotApi.register(payload);
      if (res.status === 200 || res.status === 201) {
        toast.dismiss(loadingId);
        toast.success("🎉 Đăng ký bãi xe thành công!");
        setForm({
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
        setCapacities([]);
        setRules([]);
      } else {
        toast.dismiss(loadingId);
        toast.error("⚠️ Đăng ký thất bại. Vui lòng kiểm tra lại dữ liệu.");
      }
    } catch (error) {
      console.error("❌ Error submitting:", error);
      toast.dismiss(loadingId);
      toast.error("❌ Đăng ký thất bại! Vui lòng thử lại.");
    }
  };

  return (
    <PartnerTopLayout>
      <div className="w-full max-w-[95%] xl:max-w-10xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Register New Parking Lot
        </h1>
        <p className="text-gray-500 mb-6">
          Điền đầy đủ thông tin bên dưới để đăng ký bãi đỗ xe mới.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-2xl border border-gray-100 p-8 space-y-8"
        >
          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center gap-2">
              🏙️ Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {["name", "streetAddress", "ward", "city"].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">
                    {field.replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    type="text"
                    name={field}
                    placeholder={`Enter ${field}`}
                    value={form[field]}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                </div>
              ))}

              {/* Lat / Lng */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="flex justify-center mt-5">
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-2.5 rounded-full shadow hover:from-indigo-700 hover:to-indigo-600 transition-all"
              >
                📍 Chọn vị trí trên bản đồ
              </button>
            </div>

            {/* Floor & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Total Floors
                </label>
                <input
                  type="number"
                  name="totalFloors"
                  value={form.totalFloors}
                  onChange={handleChange}
                  placeholder="Total Floors"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Start (HH:mm:ss)
                </label>
                <input
                  type="text"
                  name="operatingHoursStart"
                  value={form.operatingHoursStart}
                  onChange={handleChange}
                  placeholder="07:00:00"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  End (HH:mm:ss)
                </label>
                <input
                  type="text"
                  name="operatingHoursEnd"
                  value={form.operatingHoursEnd}
                  onChange={handleChange}
                  placeholder="22:00:00"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                name="is24Hour"
                checked={form.is24Hour}
                onChange={handleChange}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-gray-700 text-sm">24-hour Operation</span>
            </label>
          </section>

          {/* Capacity Section */}
          <section>
            <h2 className="text-lg font-semibold text-indigo-700 mb-3">
              🚗 Capacity Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <input
                type="number"
                name="capacity"
                placeholder="Capacity"
                value={capacityForm.capacity}
                onChange={handleCapacityChange}
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400"
              />
              <select
                name="vehicleType"
                value={capacityForm.vehicleType}
                onChange={handleCapacityChange}
                className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Select Vehicle Type</option>
                <option value="CAR_UP_TO_9_SEATS">Car (≤9 seats)</option>
                <option value="MOTORBIKE">Motorbike</option>
                <option value="BIKE">Bike</option>
                <option value="OTHER">Other</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="supportElectricVehicle"
                  checked={capacityForm.supportElectricVehicle}
                  onChange={handleCapacityChange}
                />
                Support EV
              </label>
            </div>
            <button
              type="button"
              onClick={handleAddCapacity}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              + Add Capacity
            </button>

            {capacities.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700 text-center">
                    <tr>
                      <th className="px-3 py-2 border">Vehicle Type</th>
                      <th className="px-3 py-2 border">Capacity</th>
                      <th className="px-3 py-2 border">EV</th>
                      <th className="px-3 py-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capacities.map((c, i) => (
                      <tr key={i} className="text-center hover:bg-gray-50">
                        <td className="border px-3 py-2">{c.vehicleType}</td>
                        <td className="border px-3 py-2">{c.capacity}</td>
                        <td className="border px-3 py-2">
                          {c.supportElectricVehicle ? "Yes" : "No"}
                        </td>
                        <td className="border px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveCapacity(i)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Pricing Rules */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-indigo-700">
                💰 Pricing Rules
              </h2>
              <button
                type="button"
                onClick={() => setShowRuleModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                + Add Rule
              </button>
            </div>

            {rules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700 text-center">
                    <tr>
                      <th className="px-3 py-2 border">Rule Name</th>
                      <th className="px-3 py-2 border">Vehicle Type</th>
                      <th className="px-3 py-2 border">Step Rate</th>
                      <th className="px-3 py-2 border">Step Minute</th>
                      <th className="px-3 py-2 border">Valid From</th>
                      <th className="px-3 py-2 border">Valid To</th>
                      <th className="px-3 py-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r, idx) => (
                      <tr
                        key={idx}
                        className="text-center hover:bg-gray-50 transition"
                      >
                        <td className="border px-3 py-2">{r.ruleName}</td>
                        <td className="border px-3 py-2">{r.vehicleType}</td>
                        <td className="border px-3 py-2">{r.stepRate}</td>
                        <td className="border px-3 py-2">{r.stepMinute}</td>
                        <td className="border px-3 py-2">{r.validFrom}</td>
                        <td className="border px-3 py-2">{r.validTo}</td>
                        <td className="border px-3 py-2 flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRule(r)}
                            className="text-indigo-600 hover:underline"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">
                No pricing rules added yet.
              </p>
            )}
          </section>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition"
              onClick={() => toast("🚫 Đã hủy đăng ký")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Submit Registration
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)}>
        <AddRuleModal
          onSave={handleAddRule}
          onClose={() => setShowRuleModal(false)}
        />
      </Modal>

      <RuleDetailModal
        rule={selectedRule}
        onClose={() => setSelectedRule(null)}
      />

      {/* Map Modal */}
      <Modal isOpen={showMap} onClose={() => setShowMap(false)}>
        <div className="p-4 w-[700px] max-w-full">
          <h2 className="text-lg font-semibold mb-3 text-indigo-700">
            📍 Chọn vị trí bãi đỗ xe
          </h2>
          <p className="text-gray-500 text-sm mb-2">
            Bấm vào vị trí trên bản đồ để lấy tọa độ.
          </p>
          <LocationPickerMap
            onSelect={(latlng) => {
              setForm({
                ...form,
                latitude: latlng.lat.toFixed(6),
                longitude: latlng.lng.toFixed(6),
              });
              toast.success("✅ Đã chọn vị trí!");
              setShowMap(false);
            }}
          />
        </div>
      </Modal>
    </PartnerTopLayout>
  );
}
