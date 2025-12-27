import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
        toast.error("Đã có lỗi khi tải danh sách bãi đỗ xe");
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
      toast.error("Tên gói là bắt buộc");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Mô tả là bắt buộc");
      return;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error("Giá phải lớn hơn 0");
      return;
    }
    if (!formData.lotId) {
      toast.error("Vui lòng chọn bãi đỗ xe");
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
      toast.success("Đã tạo gói đăng ký thành công!");
      onSuccess();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error(error.response?.data?.message || "Đã có lỗi khi tạo gói đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative overflow-hidden animate-fadeInScale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="ri-add-circle-line text-2xl" aria-hidden="true"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Thêm gói đăng ký</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 transition-colors p-1 rounded-full cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
        {/* Package Name */}
        <InputField
          label="Tên gói"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="VD: Gói ôtô theo tháng cao cấp"
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả các lợi ích và tính năng của gói này..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none custom-scrollbar h-32 max-h-32 overflow-y-auto"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length} ký tự
          </p>
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại xe
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="MOTORBIKE">Xe máy</option>
            <option value="CAR_UP_TO_9_SEATS">Ôtô (tối đa 9 chỗ)</option>
          </select>
        </div>

        {/* Duration Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời hạn
          </label>
          <select
            name="durationType"
            value={formData.durationType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          >
            <option value="MONTHLY">Theo tháng</option>
            <option value="QUARTERLY">Theo quý (3 tháng)</option>
            <option value="YEARLY">Theo năm (12 tháng)</option>
          </select>
        </div>

        {/* Price */}
        <InputField
          label="Giá (VNĐ)"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          placeholder="VD: 1500000"
          min="0"
          required
        />

        {/* Parking Lot Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bãi đỗ xe
          </label>
          {loadingLots ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500">
              Đang tải danh sách bãi đỗ xe...
            </div>
          ) : !Array.isArray(parkingLots) || parkingLots.length === 0 ? (
            <div className="px-4 py-2 border border-gray-300 rounded-lg text-red-600">
              Không có bãi đỗ xe nào. Vui lòng đăng ký bãi đỗ xe trước.
            </div>
          ) : (
            <select
              name="lotId"
              value={formData.lotId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Chọn bãi đỗ xe</option>
              {parkingLots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
          )}
        </div>

            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-400 cursor-pointer"
              disabled={loading || loadingLots || !Array.isArray(parkingLots) || parkingLots.length === 0}
            >
              {loading ? "Đang tạo..." : "Tạo gói"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
