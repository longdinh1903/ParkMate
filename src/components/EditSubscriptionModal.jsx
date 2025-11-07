import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import InputField from "./InputField";
import subscriptionApi from "../api/subscriptionApi";
import parkingLotApi from "../api/parkingLotApi";
import toast from "react-hot-toast";

export default function EditSubscriptionModal({ subscription, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: subscription.name || "",
    description: subscription.description || "",
    vehicleType: subscription.vehicleType || "CAR_UP_TO_9_SEATS",
    durationType: subscription.durationType || "MONTHLY",
    price: subscription.price || "",
    lotId: subscription.lotId || "",
    isActive: subscription.isActive !== undefined ? subscription.isActive : true,
  });
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLots, setLoadingLots] = useState(true);

  // Fetch parking lots on mount
  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const response = await parkingLotApi.getAllByPartner();
        console.log("Parking lots response:", response);
        console.log("response.data:", response.data);
        console.log("response.data type:", typeof response.data);
        
        // Handle different response structures
        let lots = [];
        if (response.data) {
          // Check all possible nested structures
          if (Array.isArray(response.data)) {
            lots = response.data;
          } else if (response.data.content && Array.isArray(response.data.content)) {
            lots = response.data.content;
          } else if (response.data.data) {
            if (Array.isArray(response.data.data)) {
              lots = response.data.data;
            } else if (response.data.data.content && Array.isArray(response.data.data.content)) {
              lots = response.data.data.content;
            }
          }
        }
        
        console.log("Parsed parking lots:", lots);
        console.log("Number of lots:", lots.length);
        setParkingLots(lots);
      } catch (error) {
        console.error("Error fetching parking lots:", error);
        toast.error("Failed to load parking lots");
        setParkingLots([]); // Set empty array on error
      } finally {
        setLoadingLots(false);
      }
    };

    fetchParkingLots();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (!formData.lotId) {
      toast.error("Please select a parking lot");
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseInt(formData.price),
        isActive: formData.isActive,
      };

      console.log("Update payload:", payload);
      await subscriptionApi.update(subscription.id, payload);
      toast.success("Subscription package updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error(error.response?.data?.message || "Failed to update subscription package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Subscription Package">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Package Name */}
        <InputField
          label="Package Name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Premium Monthly Car Parking"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the benefits and features of this package..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none custom-scrollbar h-32 max-h-32 overflow-y-auto"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length} characters
          </p>
        </div>

        {/* Vehicle Type - READ ONLY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Type
            <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
          >
            <option value="BIKE">Bike</option>
            <option value="MOTORBIKE">Motorbike</option>
            <option value="CAR_UP_TO_9_SEATS">Car (Up to 9 seats)</option>
          </select>
        </div>

        {/* Duration Type - READ ONLY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration Type
            <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
          </label>
          <select
            name="durationType"
            value={formData.durationType}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
          >
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly (3 months)</option>
            <option value="YEARLY">Yearly (12 months)</option>
          </select>
        </div>

        {/* Price */}
        <InputField
          label="Price (VND)"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="e.g., 1500000"
          min="0"
          required
        />

        {/* Parking Lot Selection - READ ONLY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parking Lot
            <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
          </label>
          {loadingLots ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100">
              Loading parking lots...
            </div>
          ) : !Array.isArray(parkingLots) || parkingLots.length === 0 ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 bg-gray-100">
              Lot ID: {formData.lotId}
            </div>
          ) : (
            <select
              name="lotId"
              value={formData.lotId}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-600"
            >
              <option value="">Select a parking lot</option>
              {parkingLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name} - {lot.address}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Active Status Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Status
            </label>
            <p className="text-xs text-gray-500">
              Enable or disable this subscription package
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              formData.isActive ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            disabled={loading || loadingLots}
          >
            {loading ? "Updating..." : "Update Package"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
