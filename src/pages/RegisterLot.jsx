import React, { useState } from "react";
import PartnerLayout from "../layouts/MainLayout";
import parkingLotApi from "../api/parkingLotApi";
import Modal from "../components/Modal";
import AddRuleModal from "../components/AddRuleModal";
import RuleDetailModal from "../components/RuleDetailModal";
import { jwtDecode } from "jwt-decode";

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
      alert("Please fill capacity and vehicle type");
      return;
    }
    setCapacities([...capacities, capacityForm]);
    setCapacityForm({
      capacity: "",
      vehicleType: "",
      supportElectricVehicle: false,
    });
  };

  const handleRemoveCapacity = (index) => {
    setCapacities(capacities.filter((_, i) => i !== index));
  };

  const handleAddRule = (rule) => setRules([...rules, rule]);
  const handleRemoveRule = (index) =>
    setRules(rules.filter((_, i) => i !== index));

  // ✅ Lấy PartnerId từ token
  const getPartnerIdFromToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      console.log("🔍 Token payload:", decoded);
      return decoded.userId || decoded.sub; // ✅ chuẩn với token của bạn
    } catch (err) {
      console.error("❌ Cannot decode token:", err);
      return null;
    }
  };

  // ✅ Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      streetAddress: form.streetAddress,
      ward: form.ward,
      city: form.city,
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
        baseRate: parseInt(r.baseRate),
        depositFee: parseInt(r.depositFee),
        initialCharge: parseInt(r.initialCharge),
        initialDurationMinute: parseInt(r.initialDurationMinute),
        freeMinute: parseInt(r.freeMinute),
        gracePeriodMinute: parseInt(r.gracePeriodMinute),
        validFrom: r.validFrom,
        validTo: r.validTo,
        areaId: parseInt(r.areaId),
      })),
    };

    console.log("📤 Submit payload:", payload);

    try {
      const partnerId = getPartnerIdFromToken();
      if (!partnerId) {
        alert("❌ Cannot determine partner ID from token. Please log in again.");
        return;
      }

      const res = await parkingLotApi.register(partnerId, payload);
      alert("✅ Parking Lot registered successfully!");
      console.log("✅ API response:", res.data);
    } catch (error) {
      console.error("❌ Error:", error);
      if (error.response?.status === 401)
        alert("❌ Unauthorized — please check your token or login again.");
      else if (error.response?.status === 400)
        alert("❌ Bad request — please review your input fields.");
      else alert("❌ Failed to register parking lot");
    }
  };

  return (
    <PartnerLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Register New Parking Lot</h1>
        <p className="text-gray-500 mb-6">
          Cung cấp thông tin đầy đủ để đăng ký bãi đậu xe mới.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parking Lot Info */}
          <div className="bg-white p-6 shadow rounded-lg space-y-4">
            <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
            <input type="text" name="name" placeholder="Parking Lot Name" value={form.name} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            <input type="text" name="streetAddress" placeholder="Street Address" value={form.streetAddress} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            <input type="text" name="ward" placeholder="Ward" value={form.ward} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            <input type="text" name="city" placeholder="City" value={form.city} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
              <input type="number" name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            </div>
            <input type="number" name="totalFloors" placeholder="Total Floors" value={form.totalFloors} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="operatingHoursStart" placeholder="Operating Hours Start (HH:mm:ss)" value={form.operatingHoursStart} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
              <input type="text" name="operatingHoursEnd" placeholder="Operating Hours End (HH:mm:ss)" value={form.operatingHoursEnd} onChange={handleChange} className="w-full border px-4 py-2 rounded-md" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is24Hour" checked={form.is24Hour} onChange={handleChange} />
              24-hour Operation
            </label>
          </div>

          {/* Capacity Section */}
          <div className="bg-white p-6 shadow rounded-lg space-y-4">
            <h2 className="text-lg font-semibold mb-2">Capacity</h2>
            <div className="grid grid-cols-3 gap-3 items-center">
              <input type="number" name="capacity" placeholder="Capacity" value={capacityForm.capacity} onChange={handleCapacityChange} className="border px-3 py-2 rounded-md" />
              <select name="vehicleType" value={capacityForm.vehicleType} onChange={handleCapacityChange} className="border px-3 py-2 rounded-md">
                <option value="">Select Vehicle Type</option>
                <option value="CAR_UP_TO_9_SEATS">Car (≤9 seats)</option>
                <option value="MOTORBIKE">MOTORBIKE</option>
                <option value="BIKE">Bike</option>
                <option value="OTHER">OTHER</option>
              </select>
              <label className="flex items-center">
                <input type="checkbox" name="supportElectricVehicle" checked={capacityForm.supportElectricVehicle} onChange={handleCapacityChange} className="mr-2" />
                EV
              </label>
            </div>
            <button type="button" onClick={handleAddCapacity} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              + Add Capacity
            </button>

            {capacities.length > 0 && (
              <table className="min-w-full border border-gray-200 rounded-lg text-sm mt-4">
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
                      <td className="border px-3 py-2">{c.supportElectricVehicle ? "Yes" : "No"}</td>
                      <td className="border px-3 py-2">
                        <button type="button" onClick={() => handleRemoveCapacity(i)} className="text-red-500 hover:text-red-700">
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pricing Rules */}
          <div className="lg:col-span-2 bg-white p-6 shadow rounded-lg mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Pricing Rules</h2>
              <button type="button" onClick={() => setShowRuleModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                + Add Rule
              </button>
            </div>

            {rules.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                  <thead className="bg-gray-100 text-gray-700 text-center">
                    <tr>
                      <th className="px-3 py-2 border">Rule Name</th>
                      <th className="px-3 py-2 border">Vehicle Type</th>
                      <th className="px-3 py-2 border">Base Rate</th>
                      <th className="px-3 py-2 border">Free Minute</th>
                      <th className="px-3 py-2 border">Valid From</th>
                      <th className="px-3 py-2 border">Valid To</th>
                      <th className="px-3 py-2 border w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule, index) => (
                      <tr key={index} className="text-center hover:bg-gray-50">
                        <td className="border px-3 py-2">{rule.ruleName}</td>
                        <td className="border px-3 py-2">{rule.vehicleType}</td>
                        <td className="border px-3 py-2">{rule.baseRate}</td>
                        <td className="border px-3 py-2">{rule.freeMinutes}</td>
                        <td className="border px-3 py-2">{rule.validFrom}</td>
                        <td className="border px-3 py-2">{rule.validTo}</td>
                        <td className="border px-3 py-2 flex justify-center gap-3">
                          <button type="button" onClick={() => setSelectedRule(rule)} className="text-indigo-600 hover:underline">
                            View
                          </button>
                          <button type="button" onClick={() => handleRemoveRule(index)} className="text-red-500 hover:text-red-700">
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm italic mt-2">
                No pricing rules added yet.
              </p>
            )}
          </div>

          {/* Submit */}
          <div className="lg:col-span-2 flex justify-end gap-4 mt-6">
            <button type="button" className="px-6 py-2 border rounded-md hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
              Submit Registration
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      <Modal isOpen={showRuleModal} onClose={() => setShowRuleModal(false)}>
        <AddRuleModal onSave={handleAddRule} onClose={() => setShowRuleModal(false)} />
      </Modal>

      <RuleDetailModal rule={selectedRule} onClose={() => setSelectedRule(null)} />
    </PartnerLayout>
  );
}
