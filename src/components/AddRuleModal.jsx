import React, { useState } from "react";
import toast from "react-hot-toast";

export default function AddRuleModal({ onSave, onClose }) {
  const [rule, setRule] = useState({
    ruleName: "",
    vehicleType: "",
    baseRate: "",
    depositFee: "",
    initialCharge: "",
    initialDurationMinute: "",
    freeMinute: "",
    gracePeriodMinute: "",
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

    // validate cơ bản
    if (!rule.ruleName || !rule.vehicleType || !rule.baseRate) {
      toast.error("⚠️ Hãy nhập đủ Rule Name, Vehicle Type và Base Rate!");
      return;
    }

    // format & convert type
    const cleanedRule = {
      ...rule,
      baseRate: parseInt(rule.baseRate),
      depositFee: parseInt(rule.depositFee) || 0,
      initialCharge: parseInt(rule.initialCharge) || 0,
      initialDurationMinute: parseInt(rule.initialDurationMinute) || 0,
      freeMinute: parseInt(rule.freeMinute) || 0,
      gracePeriodMinute: parseInt(rule.gracePeriodMinute) || 0,
      areaId: rule.areaId ? parseInt(rule.areaId) : 1, // mặc định 1 nếu chưa chọn
    };

    onSave(cleanedRule);
    toast.success("✅ Đã thêm Pricing Rule!");
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white rounded-2xl shadow-md p-6 border border-gray-100"
    >
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
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Base Rate (VND) *</label>
          <input
            type="number"
            name="baseRate"
            value={rule.baseRate}
            onChange={handleChange}
            required
            placeholder="e.g. 15000"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Deposit Fee (VND)</label>
          <input
            type="number"
            name="depositFee"
            value={rule.depositFee}
            onChange={handleChange}
            placeholder="e.g. 50000"
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

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
          <label className="text-sm font-medium">Initial Duration (minutes)</label>
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

      {/* Time Config */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Free Minute *</label>
          <input
            type="number"
            name="freeMinute"
            value={rule.freeMinute}
            onChange={handleChange}
            placeholder="e.g. 15"
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Grace Period (minutes)</label>
          <input
            type="number"
            name="gracePeriodMinute"
            value={rule.gracePeriodMinute}
            onChange={handleChange}
            placeholder="e.g. 10"
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
            required
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Area */}
      {/* <div>
        <label className="text-sm font-medium">Area ID *</label>
        <input
          type="number"
          name="areaId"
          value={rule.areaId}
          onChange={handleChange}
          placeholder="e.g. 1"
          required
          className="w-full border rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-indigo-400"
        />
      </div> */}

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
  );
}
