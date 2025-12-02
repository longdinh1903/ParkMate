import { useState } from "react";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";
import parkingLotApi from "../api/parkingLotApi";
import AddRuleModal from "./AddRuleModal";

export default function AddParkingLotModal({ open, onClose, onCreated }) {
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
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCapacityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCapacityForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCapacity = () => {
    if (!capacityForm.capacity || !capacityForm.vehicleType) {
      showError("⚠️ Please fill in Capacity and Vehicle Type!");
      return;
    }
    setCapacities([...capacities, { ...capacityForm }]);
    setCapacityForm({ capacity: "", vehicleType: "", supportElectricVehicle: false });
    setShowCapacityModal(false);
    showSuccess("✅ Capacity added!");
  };

  const handleRemoveCapacity = (index) => {
    setCapacities(capacities.filter((_, i) => i !== index));
    showSuccess("🗑️ Capacity removed!");
  };

  const handleAddRule = (rule) => {
    setRules([...rules, rule]);
    showSuccess("✅ Pricing rule added!");
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
    showSuccess("🗑️ Rule removed!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (capacities.length === 0) {
      showError("⚠️ Please add at least one capacity configuration!");
      return;
    }

    if (rules.length === 0) {
      showError("⚠️ Please add at least one pricing rule!");
      return;
    }

    try {
      setLoading(true);
      showInfo("🚀 Creating parking lot...");

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

      await parkingLotApi.register(payload);

      onClose();
      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      console.error("❌ Error creating parking lot:", err);
      showError(err.response?.data?.message || "Failed to create parking lot!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] relative overflow-hidden flex flex-col animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - match `ViewPartnerModal` layout */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <i className="ri-parking-box-fill text-orange-600 text-2xl"></i>
            Thêm Bãi Đỗ Xe Mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            disabled={loading}
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="px-8 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
          {/* ---- BASIC INFORMATION ---- */}
          <section className="border-b border-gray-200 pb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-building-2-fill text-orange-600 text-xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thông Tin Cơ Bản</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Nhập tên bãi đỗ xe"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa Chỉ <span className="text-red-500">*</span>
                </label>
                <input
                  name="streetAddress"
                  type="text"
                  value={form.streetAddress}
                  onChange={handleChange}
                  required
                  placeholder="Nhập địa chỉ đường phố"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <input
                  name="ward"
                  type="text"
                  value={form.ward}
                  onChange={handleChange}
                  required
                  placeholder="Nhập phường/xã"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thành Phố <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  required
                  placeholder="Nhập thành phố"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vĩ Độ <span className="text-red-500">*</span>
                </label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  required
                  placeholder="Vĩ độ"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kinh Độ <span className="text-red-500">*</span>
                </label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  required
                  placeholder="Kinh độ"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số Tầng <span className="text-red-500">*</span>
                </label>
                <input
                  name="totalFloors"
                  type="number"
                  value={form.totalFloors}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: 3"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giờ Bắt Đầu
                </label>
                <input
                  name="operatingHoursStart"
                  type="text"
                  value={form.operatingHoursStart}
                  onChange={handleChange}
                  placeholder="07:00:00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Giờ Kết Thúc
                </label>
                <input
                  name="operatingHoursEnd"
                  type="text"
                  value={form.operatingHoursEnd}
                  onChange={handleChange}
                  placeholder="22:00:00"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 mt-6 p-4 bg-orange-50 rounded-xl cursor-pointer hover:bg-orange-100 transition-all">
              <input
                type="checkbox"
                name="is24Hour"
                checked={form.is24Hour}
                onChange={handleChange}
                className="w-5 h-5 accent-orange-600 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <i className="ri-time-line text-orange-600 text-lg"></i>
                <span className="text-gray-800 font-medium">Hoạt động 24/7</span>
              </div>
            </label>
          </section>

          {/* ---- CAPACITY CONFIGURATION ---- */}
          <section className="border-b border-gray-200 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-car-fill text-orange-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Cấu Hình Sức Chứa</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCapacityModal(true)}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-add-line text-lg"></i>
                Thêm 
              </button>
            </div>

            {capacities.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Loại Xe</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Sức Chứa</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Hỗ Trợ EV</th>
                      <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Thao Tác</th>
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
                              <i className="ri-flashlight-fill mr-1"></i> Có
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Không
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCapacity(i)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                          >
                            <i className="ri-delete-bin-line mr-1"></i> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <i className="ri-car-line text-5xl text-gray-400 mb-3"></i>
                <p className="text-gray-500 font-medium">Chưa thêm cấu hình sức chứa nào</p>
                <p className="text-gray-400 text-sm mt-1">Nhấp nút "Thêm" bên trên để tạo mới</p>
              </div>
            )}
          </section>

          {/* ---- PRICING RULES ---- */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-money-dollar-circle-fill text-orange-600 text-xl"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quy Tắc Giá</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRuleModal(true)}
                className="bg-orange-600 text-white px-6 py-2.5 rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-add-line text-lg"></i>
                Thêm Quy Tắc
              </button>
            </div>

            {rules.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Tên Quy Tắc</th>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">Loại Xe</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Phí Bước</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Phút/Bước</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Hiệu Lực Từ</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Hiệu Lực Đến</th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rules.map((r, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">{r.ruleName}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{r.vehicleType}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-700">{r.stepRate}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-700">{r.stepMinute}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">{r.validFrom || '-'}</td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">{r.validTo || '-'}</td>
                        <td className="px-4 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(idx)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                          >
                            <i className="ri-delete-bin-line mr-1"></i> Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <i className="ri-file-list-line text-5xl text-gray-400 mb-3"></i>
                <p className="text-gray-500 font-medium">Chưa thêm quy tắc giá nào</p>
                <p className="text-gray-400 text-sm mt-1">Nhấp nút "Thêm Quy Tắc" bên trên để tạo mới</p>
              </div>
            )}
          </section>

          </div>

          {/* ---- SUBMIT BUTTONS ---- */}
          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Đang lưu...
                </>
                ) : (
                <>
                  <i className="ri-add-line"></i>
                  <span>Tạo Mới</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Capacity Modal */}
      {showCapacityModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          onClick={() => setShowCapacityModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-car-fill text-orange-600"></i>
                Thêm Cấu Hình Sức Chứa
              </h3>
              <button
                onClick={() => setShowCapacityModal(false)}
                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sức Chứa <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  placeholder="Ví dụ: 50"
                  value={capacityForm.capacity}
                  onChange={handleCapacityChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại Xe <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={capacityForm.vehicleType}
                  onChange={handleCapacityChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none cursor-pointer"
                >
                  <option value="">Chọn Loại</option>
                  <option value="CAR_UP_TO_9_SEATS">🚗 Ôtô (≤9 chỗ)</option>
                  <option value="MOTORBIKE">🏍️ Xe máy</option>
                  <option value="BICYCLE">🚲 Xe đạp</option>
                  <option value="OTHER">🚙 Khác</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-all">
                  <input
                    type="checkbox"
                    name="supportElectricVehicle"
                    checked={capacityForm.supportElectricVehicle}
                    onChange={handleCapacityChange}
                    className="w-5 h-5 accent-orange-600 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <i className="ri-flashlight-line text-orange-600 text-lg"></i>
                    <span className="text-gray-800 font-medium">Hỗ Trợ Xe Điện</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCapacityModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddCapacity}
                  className="bg-orange-600 text-white px-6 py-2.5 rounded-xl hover:bg-orange-700 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 cursor-pointer"
                >
                  <i className="ri-add-line"></i>
                  Thêm Sức Chứa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      <AddRuleModal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        onSave={handleAddRule}
        variant="admin"
      />
    </div>
  );
}
