import React, { useState } from "react";
import toast from "react-hot-toast";

export default function AddRuleModal({ open, onSave, onClose }) {
  const [rule, setRule] = useState({
    ruleName: "",
    vehicleType: "",
    stepRate: "",
    stepMinute: "",
    initialCharge: "",
    initialDurationMinute: "",
    validFrom: "",
    validTo: "",
    areaId: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRule({ ...rule, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ validate cơ bản
    if (
      !rule.ruleName ||
      !rule.vehicleType ||
      !rule.stepRate ||
      !rule.stepMinute
    ) {
      toast.error(
        "⚠️ Hãy nhập đủ Rule Name, Vehicle Type, Step Rate và Step Minute!"
      );
      return;
    }

    // ✅ Chuẩn hóa dữ liệu
    const cleanedRule = {
      ...rule,
      stepRate: parseInt(rule.stepRate) || 0,
      stepMinute: parseInt(rule.stepMinute) || 0,
      initialCharge: parseInt(rule.initialCharge) || 0,
      initialDurationMinute: parseInt(rule.initialDurationMinute) || 0,
      areaId: rule.areaId ? parseInt(rule.areaId) : 1, // mặc định 1
    };

    onSave(cleanedRule);
    toast.success("Đã thêm Pricing Rule!");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative space-y-5 bg-white rounded-2xl shadow-md p-6 border border-gray-100 max-w-3xl max-h-[90vh] overflow-y-auto"
      >
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
      >
        <i className="ri-close-line text-2xl"></i>
      </button>

      <h2 className="text-lg font-bold text-indigo-700 mb-3">
        ➕ Add New Pricing Rule
      </h2>

      {/* Rule Name & Vehicle Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Rule Name *</label>
          <input
            type="text"
            name="ruleName"
            value={rule.ruleName}
            onChange={handleChange}
            required
            placeholder="Enter rule name"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Vehicle Type *</label>
          <select
            name="vehicleType"
            value={rule.vehicleType}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select type</option>
            <option value="CAR_UP_TO_9_SEATS">Car (≤9 seats)</option>
            <option value="MOTORBIKE">MOTORBIKE</option>
            <option value="BIKE">BIKE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      {/* Step Config */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Step Rate (VND) *</label>
          <input
            type="number"
            name="stepRate"
            value={rule.stepRate}
            onChange={handleChange}
            placeholder="e.g. 15000"
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Step Minute *</label>
          <input
            type="number"
            name="stepMinute"
            value={rule.stepMinute}
            onChange={handleChange}
            placeholder="e.g. 10"
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Initial Charge */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Initial Charge (VND)</label>
          <input
            type="number"
            name="initialCharge"
            value={rule.initialCharge}
            onChange={handleChange}
            placeholder="e.g. 5000"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Initial Duration (minutes)
          </label>
          <input
            type="number"
            name="initialDurationMinute"
            value={rule.initialDurationMinute}
            onChange={handleChange}
            placeholder="e.g. 30"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Valid Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Valid From *</label>
          <input
            type="datetime-local"
            name="validFrom"
            value={rule.validFrom}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valid To *</label>
          <input
            type="datetime-local"
            name="validTo"
            value={rule.validTo}
            onChange={handleChange}
            placeholder="(Optional)"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Area ID */}
      <div>
        <label className="text-sm font-medium">Area ID</label>
        <input
          type="number"
          name="areaId"
          value={rule.areaId}
          onChange={handleChange}
          placeholder="e.g. 1"
          className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 border rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Save Rule
        </button>
      </div>
    </form>
    </div>
  );
}
