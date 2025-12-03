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
    lotSquare: "",
    horizonTime: "",
  });

  const [capacityForm, setCapacityForm] = useState({
    capacity: "",
    vehicleType: "",
    supportElectricVehicle: false,
  });

  const [capacities, setCapacities] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Fixed 4 policy types - users can only change the value
  const policyTypes = [
    {
      type: "EARLY_CHECK_IN_BUFFER",
      label: "Bộ Đệm Nhận Chổ Sớm",
      description: "🕐 Thời gian cho phép nhận chổ sớm",
    },
    // {
    //   type: "LATE_CHECK_OUT_BUFFER",
    //   label: "Late Check-out Buffer",
    //   description: "🕐 Late check-out time allowed",
    // },
    {
      type: "LATE_CHECK_IN_CANCEL_AFTER",
      label: "Hủy Nếu Nhận Chổ Trễ",
      description: "⏰ Tự động hủy nếu nhận chổ quá trễ",
    },
    {
      type: "EARLY_CANCEL_REFUND_BEFORE",
      label: "Hoàn Tiền Nếu Hủy Sớm",
      description: "💰 Hoàn 100% nếu hủy trước thời gian này",
    },
  ];

  const [policies, setPolicies] = useState(
    policyTypes.map((pt) => ({ policyType: pt.type, value: pt.defaultValue }))
  );

  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const getPartnerIdFromStorage = () => {
    let partnerId = localStorage.getItem("partnerId");

    // ✅ Nếu không có partnerId trong localStorage, thử decode từ token
    if (!partnerId) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const decoded = JSON.parse(jsonPayload);
          partnerId = decoded?.partnerId || decoded?.partner_id || decoded?.sub;

          if (partnerId) {
            localStorage.setItem("partnerId", partnerId); // Lưu lại cho lần sau
            console.log("✅ Extracted partnerId from token:", partnerId);
          }
        } catch (error) {
          console.error("❌ Error decoding token:", error);
        }
      }
    }

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

  const handlePolicyChange = (index, value) => {
    const updatedPolicies = [...policies];
    updatedPolicies[index].value = value;
    setPolicies(updatedPolicies);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`File ${file.name} không đúng định dạng (chỉ chấp nhận JPG, PNG, WebP, GIF)`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`File ${file.name} quá lớn (tối đa 10MB)`);
        return false;
      }
      return true;
    });

    // Limit to 4 images total
    const currentCount = selectedImages.length;
    const availableSlots = 4 - currentCount;
    
    if (validFiles.length > availableSlots) {
      toast.error(`⚠️ Chỉ có thể thêm tối đa ${availableSlots} ảnh nữa (tối đa 4 ảnh)`);
      return;
    }

    setSelectedImages([...selectedImages, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    toast.success(`Đã thêm ${validFiles.length} ảnh`);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    toast("Đã xóa ảnh");
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

    // Validate policy values
    const invalidPolicy = policies.find(
      (p) => !p.value || parseInt(p.value) <= 0
    );
    if (invalidPolicy) {
      toast.error("⚠️ Giá trị Policy phải là số dương!");
      return;
    }

    const payload = {
      name: form.name.trim(),
      streetAddress: form.streetAddress.trim(),
      ward: form.ward.trim(),
      city: form.city.trim(),
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      totalFloors: parseInt(form.totalFloors) || 0,
      operatingHoursStart: form.operatingHoursStart,
      operatingHoursEnd: form.operatingHoursEnd,
      is24Hour: form.is24Hour,
      lotSquare: form.lotSquare ? parseFloat(form.lotSquare) : null,
      horizonTime: form.horizonTime ? parseInt(form.horizonTime) : null,
      lotCapacityRequests: capacities.map((c) => ({
        capacity: parseInt(c.capacity),
        vehicleType: c.vehicleType,
        supportElectricVehicle: c.supportElectricVehicle,
      })),
      pricingRuleCreateRequests: rules.map((r) => ({
        ruleName: r.ruleName,
        vehicleType: r.vehicleType,
        stepRate: parseFloat(r.stepRate),
        stepMinute: parseInt(r.stepMinute),
        initialCharge: parseFloat(r.initialCharge),
        initialDurationMinute: parseInt(r.initialDurationMinute),
        validFrom: r.validFrom ? new Date(r.validFrom).toISOString() : null,
        validTo: r.validTo ? new Date(r.validTo).toISOString() : null,
      })),
      policyCreateRequests: policies.map((p) => ({
        policyType: p.policyType,
        value: parseInt(p.value),
      })),
    };

    console.log("📤 Payload to send:", JSON.stringify(payload, null, 2));

    const loadingId = toast.loading("🚗 Đang gửi yêu cầu đăng ký...");
    try {
      const res = await parkingLotApi.register(payload);
      if (res.status === 200 || res.status === 201) {
        const lotId = res.data?.data?.id;
        
        // Upload images if any
        if (selectedImages.length > 0 && lotId) {
          toast.loading("📸 Đang tải ảnh lên...", { id: loadingId });
          try {
            await parkingLotApi.uploadImages(lotId, selectedImages);
            toast.success("🎉 Đăng ký bãi xe và tải ảnh thành công!", { id: loadingId });
          } catch (imgError) {
            console.error("Error uploading images:", imgError);
            toast.success("🎉 Đăng ký bãi xe thành công! Nhưng có lỗi khi tải ảnh lên.", { id: loadingId });
          }
        } else {
          toast.success("🎉 Đăng ký bãi xe thành công!", { id: loadingId });
        }
        
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
          lotSquare: "",
          horizonTime: "",
        });
        setCapacities([]);
        setRules([]);
        setSelectedImages([]);
        setImagePreviews([]);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <i className="ri-parking-box-fill text-2xl text-white"></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Đăng Ký Bãi Đỗ Xe Mới
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Điền thông tin bên dưới để đăng ký một bãi đỗ xe mới.
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
                  Thông Tin Cơ Bản
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["name", "streetAddress", "ward"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                      {field === "name" ? "Tên" : field === "streetAddress" ? "Địa Chỉ" : "Phường/Xã"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name={field}
                      placeholder={`Nhập ${field === "name" ? "tên" : field === "streetAddress" ? "địa chỉ" : "phường/xã"}`}
                      value={form[field]}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành Phố
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white"
                  >
                    <option value="">-- Chọn Tỉnh/Thành phố --</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Hải Phòng">Hải Phòng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="An Giang">An Giang</option>
                    <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                    <option value="Bắc Giang">Bắc Giang</option>
                    <option value="Bắc Kạn">Bắc Kạn</option>
                    <option value="Bạc Liêu">Bạc Liêu</option>
                    <option value="Bắc Ninh">Bắc Ninh</option>
                    <option value="Bến Tre">Bến Tre</option>
                    <option value="Bình Định">Bình Định</option>
                    <option value="Bình Dương">Bình Dương</option>
                    <option value="Bình Phước">Bình Phước</option>
                    <option value="Bình Thuận">Bình Thuận</option>
                    <option value="Cà Mau">Cà Mau</option>
                    <option value="Cao Bằng">Cao Bằng</option>
                    <option value="Đắk Lắk">Đắk Lắk</option>
                    <option value="Đắk Nông">Đắk Nông</option>
                    <option value="Điện Biên">Điện Biên</option>
                    <option value="Đồng Nai">Đồng Nai</option>
                    <option value="Đồng Tháp">Đồng Tháp</option>
                    <option value="Gia Lai">Gia Lai</option>
                    <option value="Hà Giang">Hà Giang</option>
                    <option value="Hà Nam">Hà Nam</option>
                    <option value="Hà Tĩnh">Hà Tĩnh</option>
                    <option value="Hải Dương">Hải Dương</option>
                    <option value="Hậu Giang">Hậu Giang</option>
                    <option value="Hòa Bình">Hòa Bình</option>
                    <option value="Hưng Yên">Hưng Yên</option>
                    <option value="Khánh Hòa">Khánh Hòa</option>
                    <option value="Kiên Giang">Kiên Giang</option>
                    <option value="Kon Tum">Kon Tum</option>
                    <option value="Lai Châu">Lai Châu</option>
                    <option value="Lâm Đồng">Lâm Đồng</option>
                    <option value="Lạng Sơn">Lạng Sơn</option>
                    <option value="Lào Cai">Lào Cai</option>
                    <option value="Long An">Long An</option>
                    <option value="Nam Định">Nam Định</option>
                    <option value="Nghệ An">Nghệ An</option>
                    <option value="Ninh Bình">Ninh Bình</option>
                    <option value="Ninh Thuận">Ninh Thuận</option>
                    <option value="Phú Thọ">Phú Thọ</option>
                    <option value="Phú Yên">Phú Yên</option>
                    <option value="Quảng Bình">Quảng Bình</option>
                    <option value="Quảng Nam">Quảng Nam</option>
                    <option value="Quảng Ngãi">Quảng Ngãi</option>
                    <option value="Quảng Ninh">Quảng Ninh</option>
                    <option value="Quảng Trị">Quảng Trị</option>
                    <option value="Sóc Trăng">Sóc Trăng</option>
                    <option value="Sơn La">Sơn La</option>
                    <option value="Tây Ninh">Tây Ninh</option>
                    <option value="Thái Bình">Thái Bình</option>
                    <option value="Thái Nguyên">Thái Nguyên</option>
                    <option value="Thanh Hóa">Thanh Hóa</option>
                    <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                    <option value="Tiền Giang">Tiền Giang</option>
                    <option value="Trà Vinh">Trà Vinh</option>
                    <option value="Tuyên Quang">Tuyên Quang</option>
                    <option value="Vĩnh Long">Vĩnh Long</option>
                    <option value="Vĩnh Phúc">Vĩnh Phúc</option>
                    <option value="Yên Bái">Yên Bái</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Vĩ Độ (Latitude)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="Vĩ độ"
                    step="any"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kinh Độ (Longitude)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="Kinh độ"
                    step="any"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-center my-6">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-600 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <i className="ri-map-pin-line text-xl"></i>
                  <span className="font-medium">Chọn vị trí trên bản đồ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tổng Số Tầng
                  </label>
                  <input
                    type="number"
                    name="totalFloors"
                    value={form.totalFloors}
                    onChange={handleChange}
                    placeholder="VD: 3"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diện Tích (m²)
                  </label>
                  <input
                    type="number"
                    name="lotSquare"
                    value={form.lotSquare}
                    onChange={handleChange}
                    placeholder="VD: 1000"
                    step="any"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thời Gian Đặt Trước (phút)
                  </label>
                  <input
                    type="number"
                    name="horizonTime"
                    value={form.horizonTime}
                    onChange={handleChange}
                    placeholder="VD: 60"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giờ Mở Cửa
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
                    Giờ Đóng Cửa
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
                  <span className="text-gray-800 font-medium">
                    Hoạt Động 24/7
                  </span>
                </div>
              </label>
            </section>

            {/* ---- IMAGES ---- */}
            <section className="p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="ri-image-fill text-purple-600 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Hình Ảnh Bãi Xe
                </h2>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tải lên ảnh bãi xe (tối đa 4 ảnh)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <i className="ri-information-line"></i> Định dạng: JPG, PNG, WebP, GIF. Tối đa 10MB/ảnh. Tối đa 4 ảnh.
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Đã chọn {imagePreviews.length}/4 ảnh
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                        >
                          <i className="ri-close-line text-sm"></i>
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{imagePreviews.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ---- CAPACITY ---- */}
            <section className="p-8 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="ri-car-fill text-green-600 text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Cấu Hình Sức Chứa
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white p-4 rounded-xl border border-gray-200">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sức Chứa
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="VD: 50"
                    value={capacityForm.capacity}
                    onChange={handleCapacityChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại Xe
                  </label>
                  <select
                    name="vehicleType"
                    value={capacityForm.vehicleType}
                    onChange={handleCapacityChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none"
                  >
                    <option value="">Chọn Loại</option>
                    <option value="CAR_UP_TO_9_SEATS">🚗 Ôtô (≤9 chỗ)</option>
                    <option value="MOTORBIKE">🏍️ Xe máy</option>
                    <option value="BIKE">🚲 Xe đạp</option>
                    <option value="OTHER">📦 Khác</option>
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
                    <span className="text-sm font-medium text-gray-700">
                      ⚡ Hỗ Trợ Xe Điện
                    </span>
                  </label>
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddCapacity}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <i className="ri-add-line text-xl"></i>
                    Thêm
                  </button>
                </div>
              </div>

              {capacities.length > 0 && (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          Loại Xe
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Sức Chứa
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Hỗ Trợ Xe Điện
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {capacities.map((c, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {c.vehicleType}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-700">
                            {c.capacity}
                          </td>
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
              )}
            </section>

            {/* ---- POLICIES ---- */}
            <section className="p-8 border-b border-gray-100 bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="ri-shield-check-fill text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Chính Sách Bãi Đỗ Xe
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Cấu hình chính sách bãi đỗ xe (đơn vị: phút)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policyTypes.map((policyType, index) => {
                  const policy = policies[index];
                  return (
                    <div
                      key={policyType.type}
                      className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-5 hover:shadow-md transition-all"
                    >
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                              {policyType.label}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {policyType.description}
                            </p>
                          </div>
                          <div className="bg-blue-100 px-2 py-1 rounded-lg">
                            <span className="text-xs font-semibold text-blue-700">
                              Bắt Buộc
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Thời Gian (phút)
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="number"
                          value={policy.value}
                          onChange={(e) =>
                            handlePolicyChange(index, e.target.value)
                          }
                          placeholder="Nhập số phút"
                          min="1"
                          className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                          required
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">
                      Giải Thích Các Loại Chính Sách:
                    </p>
                    <ul className="space-y-1.5 text-blue-700">
                      <li>
                        • <strong>Bộ Đệm Nhận Chổ Sớm:</strong> Cho phép khách nhận chổ sớm hơn giờ đã đặt
                      </li>
                      {/* <li>
                        • <strong>Late Check-out Buffer:</strong> Allows guests
                        to check out later than the booked time
                      </li> */}
                      <li>
                        • <strong>Hủy Nếu Nhận Chổ Trễ:</strong> Tự động hủy đặt chỗ nếu khách không nhận chổ
                      </li>
                      <li>
                        • <strong>Hoàn Tiền Nếu Hủy Sớm:</strong> Hoàn 100% nếu hủy trước thời gian này
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- PRICING RULES ---- */}
            <section className="p-8 pb-32">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-fill text-yellow-600 text-xl"></i>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Quy Tắc Giá
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 cursor-pointer"
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
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Tên Quy Tắc
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase">
                          Loại Xe
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Giá Bước
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Phút/Bước
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Hiệu Lực Từ
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Hiệu Lực Đến
                        </th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rules.map((r, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">
                            {r.ruleName}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            {r.vehicleType}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-700">
                            {r.stepRate}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-700">
                            {r.stepMinute}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {r.validFrom || "-"}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {r.validTo || "-"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRule(r)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-all"
                              >
                                <i className="ri-eye-line mr-1"></i> Xem
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRule(idx)}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                              >
                                <i className="ri-delete-bin-line mr-1"></i>{" "}
                                Xóa
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
                  <p className="text-gray-500 font-medium">
                    Chưa có quy tắc giá nào.
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Nhấp "Thêm Quy Tắc" để tạo quy tắc giá đầu tiên.
                  </p>
                </div>
              )}
            </section>
          </form>
        </div>
      </div>

      {/* ==== Fixed Submit Footer ==== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-4 py-3 px-6 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200 rounded-full">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <i className="ri-information-line"></i>
            <span className="hidden sm:inline">Điền đầy đủ các trường bắt buộc</span>
          </div>
          <button
            type="button"
            className="px-6 py-2 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-all font-medium text-gray-700 hover:border-gray-400 cursor-pointer"
            onClick={() => toast("🚫 Đã hủy đăng ký")}
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-send-plane-fill"></i>
            Gửi Đăng Ký
          </button>
        </div>
      </div>

      {/* ---- MODALS ---- */}
      <AddRuleModal
        open={showRuleModal}
        onSave={handleAddRule}
        onClose={() => setShowRuleModal(false)}
      />

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
