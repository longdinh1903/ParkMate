import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import InputField from "./InputField";
import subscriptionApi from "../api/subscriptionApi";
import parkingLotApi from "../api/parkingLotApi";
import toast from "react-hot-toast";

export default function AddSubscriptionModal({ onClose, onSuccess }) {
  console.log("AddSubscriptionModal rendered!");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    vehicleType: "CAR_UP_TO_9_SEATS",
    durationType: "MONTHLY",
    price: "",
    lotId: "",
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
        vehicleType: formData.vehicleType,
        durationType: formData.durationType,
        price: parseInt(formData.price),
        lotId: parseInt(formData.lotId),
      };

      await subscriptionApi.create(payload);
      toast.success("Subscription package created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(error.response?.data?.message || "Failed to create subscription package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Add Subscription Package">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none custom-scrollbar h-32 max-h-32 overflow-y-auto"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length} characters
          </p>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Type
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="BIKE">Bike</option>
            <option value="MOTORBIKE">Motorbike</option>
            <option value="CAR_UP_TO_9_SEATS">Car (Up to 9 seats)</option>
          </select>
        </div>

        {/* Duration Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration Type
          </label>
          <select
            name="durationType"
            value={formData.durationType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
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

        {/* Parking Lot Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parking Lot
          </label>
          {loadingLots ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500">
              Loading parking lots...
            </div>
          ) : !Array.isArray(parkingLots) || parkingLots.length === 0 ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-red-600">
              No parking lots available. Please register a parking lot first.
            </div>
          ) : (
            <select
              name="lotId"
              value={formData.lotId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
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
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
            disabled={loading || loadingLots || !Array.isArray(parkingLots) || parkingLots.length === 0}
          >
            {loading ? "Creating..." : "Create Package"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
