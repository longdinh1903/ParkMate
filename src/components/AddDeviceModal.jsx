import { useState, useEffect } from "react";
import { XMarkIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import deviceApi from "../api/deviceApi";
import parkingLotApi from "../api/parkingLotApi";
import partnerApi from "../api/partnerApi";
import { showSuccess, showError } from "../utils/toastUtils";

export default function AddDeviceModal({ open, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    model: "",
    deviceType: "",
    serialNumber: "",
    notes: "",
    lotId: "",
    partnerId: "",
  });

  const [parkingLots, setParkingLots] = useState([]);
  const [partners, setPartners] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchPartners();
      fetchDeviceTypes();
      // Load active parking lots by default so the Lot select is populated
      fetchParkingLots();
    }
  }, [open]);

  const fetchParkingLots = async (partnerId) => {
    try {
      const params = { page: 0, size: 1000 };
      // ensure partnerId sent as number when provided
      const partnerNum = partnerId ? Number(partnerId) : undefined;
      if (partnerNum) params.partnerId = partnerNum;
      // clear current list while loading
      setParkingLots([]);
      const res = await parkingLotApi.getAll(params);
      const data = res.data?.data;
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      // If backend doesn't filter correctly by partnerId, apply client-side filter
      const partnerFiltered = partnerNum
        ? list.filter(
            (l) =>
              String(l.partnerId || l.ownerId || l.partner?.id || "") === String(partnerNum)
          )
        : list;
      const active = list
        .filter((l) => String(l.status).toUpperCase() === "ACTIVE")
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      // If we filtered by partner, filter active from partnerFiltered instead
      const finalList = partnerNum
        ? partnerFiltered.filter((l) => String(l.status).toUpperCase() === "ACTIVE").sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        : active;
      setParkingLots(finalList);
    } catch (err) {
      console.error("Error fetching parking lots:", err);
      setParkingLots([]);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await partnerApi.getAll({ page: 0, size: 1000 });
      const data = res.data?.data;
      const list = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
      const sorted = list.sort((a, b) => ((a.companyName || a.name || "").localeCompare(b.companyName || b.name || "")));
      setPartners(sorted);
    } catch (err) {
      console.error("Error fetching partners:", err);
      setPartners([]);
    }
  };

  const fetchDeviceTypes = async () => {
    try {
      const res = await deviceApi.getTypes();
      const types = res.data?.data || [];
      setDeviceTypes(types);
    } catch (err) {
      console.error("Error fetching device types:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (name === "partnerId") {
      // set partnerId and clear selected lot
      setFormData((prev) => ({ ...prev, partnerId: val, lotId: "" }));
      // fetch parking lots for selected partner
      fetchParkingLots(val || undefined);
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lotId) {
      showError("Please select a parking lot");
      return;
    }

    if (!formData.deviceId || !formData.deviceType) {
      showError("Device ID and Device Type are required");
      return;
    }

    setLoading(true);
    try {
      // Build payload according to backend contract (minimal fields expected)
      const partnerId = formData.partnerId ? Number(formData.partnerId) : undefined;

      const payload = {
        deviceId: String(formData.deviceId).trim(),
        deviceName: formData.deviceName?.trim() || undefined,
        deviceType: formData.deviceType,
        partnerId: partnerId,
        model: formData.model?.trim() || undefined,
        serialNumber: formData.serialNumber?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      // Call API with numeric lotId when possible
      const lotIdParam = Number(formData.lotId) || formData.lotId;
      await deviceApi.create(lotIdParam, payload);
      showSuccess("Device registered successfully!");
      onCreated();
      handleClose();
    } catch (err) {
      console.error("Error creating device:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      showError(serverMsg || "Failed to register device");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      deviceId: "",
      deviceName: "",
      model: "",
      deviceType: "",
      serialNumber: "",
      notes: "",
      lotId: "",
      partnerId: "",
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-2">
            <CpuChipIcon className="w-6 h-6 text-orange-500" />
            Add New Device
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Partner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner
              </label>
              <select
                name="partnerId"
                value={formData.partnerId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Select partner</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName || p.name || `Partner ${p.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Parking Lot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parking Lot <span className="text-red-500">*</span>
              </label>
              <select
                name="lotId"
                value={formData.lotId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Select parking lot</option>
                {parkingLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.name} - {lot.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="e.g., CAM-ENTRY-01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Name
              </label>
              <input
                type="text"
                name="deviceName"
                value={formData.deviceName}
                onChange={handleChange}
                maxLength={255}
                placeholder="Friendly name for the device"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Type <span className="text-red-500">*</span>
              </label>
              <select
                name="deviceType"
                value={formData.deviceType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              >
                <option value="">Select type</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                maxLength={100}
                placeholder="Device model/brand"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Serial Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleChange}
                maxLength={100}
                placeholder="Serial number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Installation notes, issues, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
            >
              <i className="ri-add-line"></i>
              {loading ? "Creating..." : "Create Device"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
