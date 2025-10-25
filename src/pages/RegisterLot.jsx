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
    toast.success("Đã thêm Capacity!");
  };

  const handleRemoveCapacity = (index) => {
    setCapacities(capacities.filter((_, i) => i !== index));
    toast("Đã xóa Capacity!");
  };

  const handleAddRule = (rule) => {
    setRules([...rules, rule]);
    toast.success("Đã thêm Pricing Rule!");
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
    toast("Đã xóa Pricing Rule!");
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
      {/* Container với padding cho header và footer cố định */}
      <div className="min-h-screen pb-28 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-parking-box-fill text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Register New Parking Lot
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Điền đầy đủ thông tin bên dưới để đăng ký bãi đỗ xe mới
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-xl rounded-2xl border border-gray-200 overflow-hidden"
          >
            {/* ---- BASIC INFORMATION ---- */}
            <section className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="ri-building-2-fill text-indigo-600 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Basic Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["name", "streetAddress", "ward", "city"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {field.replace(/([A-Z])/g, " $1")}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name={field}
                      placeholder={`Enter ${field}`}
                      value={form[field]}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Latitude
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Latitude"
                    step="any"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Longitude
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Longitude"
                    step="any"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-center my-6">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:-translate-y-0.5"
                >
                  <i className="ri-map-pin-line text-xl"></i>
                  <span className="font-medium">Chọn vị trí trên bản đồ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    name="totalFloors"
                    value={form.totalFloors}
                    onChange={handleChange}
                    placeholder="e.g., 3"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operating Hours Start
                  </label>
                  <input
                    type="text"
                    name="operatingHoursStart"
                    value={form.operatingHoursStart}
                    onChange={handleChange}
                    placeholder="07:00:00"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operating Hours End
                  </label>
                  <input
                    type="text"
                    name="operatingHoursEnd"
                    value={form.operatingHoursEnd}
                    onChange={handleChange}
                    placeholder="22:00:00"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 mt-6 p-4 bg-indigo-50 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all">
                <input
                  type="checkbox"
                  name="is24Hour"
                  checked={form.is24Hour}
                  onChange={handleChange}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <i className="ri-time-line text-indigo-600 text-lg"></i>
                  <span className="text-gray-800 font-medium">24-hour Operation</span>
                </div>
              </label>
            </section>

            {/* ---- CAPACITY ---- */}
            <section className="p-8 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-car-fill text-green-600 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Capacity Configuration
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-xl border border-gray-200">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                  type="number"
                  name="capacity"
                  placeholder="e.g., 50"
                  value={capacityForm.capacity}
                  onChange={handleCapacityChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vehicle Type
                  </label>
                  <select
                  name="vehicleType"
                  value={capacityForm.vehicleType}
                  onChange={handleCapacityChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                >
                  <option value="">Select Type</option>
                  <option value="CAR_UP_TO_9_SEATS">🚗 Car (≤9 seats)</option>
                  <option value="MOTORBIKE">🏍️ Motorbike</option>
                  <option value="BIKE">🚲 Bike</option>
                  <option value="OTHER">📦 Other</option>
                </select>
                </div>
                <div className="md:col-span-1">
                  <label className="flex items-center gap-2 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-all">
                  <input
                    type="checkbox"
                    name="supportElectricVehicle"
                    checked={capacityForm.supportElectricVehicle}
                    onChange={handleCapacityChange}
                    className="w-5 h-5 accent-green-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">⚡ Support EV</span>
                </label>
                </div>
                <div className="md:col-span-1">
                  <button
                type="button"
                onClick={handleAddCapacity}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <i className="ri-add-line text-xl"></i>
                Add
              </button>
                </div>
              </div>

              {capacities.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Vehicle Type</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Capacity</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">EV Support</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {capacities.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{c.vehicleType}</td>
                          <td className="px-6 py-4 text-center text-sm text-gray-700">{c.capacity}</td>
                          <td className="px-6 py-4 text-center">
                            {c.supportElectricVehicle ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <i className="ri-flashlight-fill mr-1"></i> Yes
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCapacity(i)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                            >
                              <i className="ri-delete-bin-line mr-1"></i> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ---- PRICING RULES ---- */}
            <section className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-fill text-yellow-600 text-xl"></i>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Pricing Rules
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                >
                  <i className="ri-add-line text-lg"></i>
                  Add Rule
                </button>
              </div>

              {rules.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Rule Name</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Vehicle Type</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Step Rate</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Step Min</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Valid From</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Valid To</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map((r, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.ruleName}</td>
                          <td className="px-4 py-4 text-sm text-gray-700">{r.vehicleType}</td>
                          <td className="px-4 py-4 text-center text-sm text-gray-700">{r.stepRate}</td>
                          <td className="px-4 py-4 text-center text-sm text-gray-700">{r.stepMinute}</td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">{r.validFrom || '-'}</td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">{r.validTo || '-'}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRule(r)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all"
                              >
                                <i className="ri-eye-line mr-1"></i> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRule(idx)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                              >
                                <i className="ri-delete-bin-line mr-1"></i> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <i className="ri-file-list-line text-5xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500 font-medium">No pricing rules added yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Add Rule" to create your first pricing rule.</p>
                </div>
              )}
            </section>
          </form>
        </div>
      </div>

      {/* ==== Footer cố định toàn trang ==== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl py-4 px-6 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <i className="ri-information-line mr-1"></i>
            Fill all required fields before submitting
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-8 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700 hover:border-gray-400"
              onClick={() => toast("🚫 Đã hủy đăng ký")}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <i className="ri-send-plane-fill"></i>
              Submit Registration
            </button>
          </div>
        </div>
      </footer>

      {/* ---- MODALS ---- */}
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
              toast.success("Đã chọn vị trí!");
              setShowMap(false);
            }}
          />
        </div>
      </Modal>
    </PartnerTopLayout>
  );
}
