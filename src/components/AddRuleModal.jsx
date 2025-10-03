import React, { useState } from "react";

export default function AddRuleModal({ onSave, onClose }) {
  const [rule, setRule] = useState({
    area: "",
    vehicleType: "",
    ruleName: "",
    description: "",   // ✅ đổi về 'description' để khớp DB
    baseRate: "",
    depositRate: "",
    gracePeriod: "",
    freeMinutes: "",
    validFrom: "",
    validTo: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRule({ ...rule, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // loại bỏ khoảng trắng thừa
    const cleanedRule = {
      ...rule,
      ruleName: rule.ruleName.trim(),
      description: rule.description.trim(),
    };

    onSave(cleanedRule);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-bold mb-2">Add New Pricing Rule</h2>

      {/* Area & Vehicle Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Area (optional)</label>
          <select
            name="area"
            value={rule.area}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="">None</option>
            <option value="A1">Area A1</option>
            <option value="A2">Area A2</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Vehicle Type *</label>
          <select
            name="vehicleType"
            value={rule.vehicleType}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          >
            <option value="">Select type</option>
            <option value="Xe máy">Xe máy</option>
            <option value="Ô tô">Ô tô 4-9 chỗ</option>
          </select>
        </div>
      </div>

      {/* Rule Details */}
      <div>
        <label className="text-sm font-medium">Rule Name *</label>
        <input
          type="text"
          name="ruleName"
          value={rule.ruleName}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Rule Description (optional)</label>
        <textarea
          name="description"
          value={rule.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 mt-1"
          rows="3"
          placeholder="Enter description here..."
        />
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Base Rate (VND) *</label>
          <input
            type="number"
            name="baseRate"
            value={rule.baseRate}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Deposit Rate (VND)</label>
          <input
            type="number"
            name="depositRate"
            value={rule.depositRate}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Grace Period (minutes) *</label>
          <input
            type="number"
            name="gracePeriod"
            value={rule.gracePeriod}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Free Minutes *</label>
          <input
            type="number"
            name="freeMinutes"
            value={rule.freeMinutes}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
      </div>

      {/* Validity Period */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Valid From *</label>
          <input
            type="datetime-local"
            name="validFrom"
            value={rule.validFrom}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Valid To (optional)</label>
          <input
            type="datetime-local"
            name="validTo"
            value={rule.validTo}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
      </div>

      {/* Buttons */}
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Rule
        </button>
      </div>
    </form>
  );
}
