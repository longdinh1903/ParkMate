import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import partnerApi from "../api/partnerApi";
import OtpPopup from "../components/OtpPopup";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";

// Input field component - defined outside Register to prevent re-creation on each render
const InputField = ({ icon, type = "text", name, placeholder, value, onChange, colSpan = 1, showToggle = false, isPassword = false, showPasswordState, onToggle }) => (
  <div className={`relative group ${colSpan === 2 ? 'col-span-2' : ''}`}>
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
      <i className={`${icon} text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300`}></i>
    </div>
    <input
      type={isPassword ? (showPasswordState ? "text" : "password") : type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white hover:border-gray-300 transition-all duration-300"
    />
    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors z-10"
      >
        <i className={`${showPasswordState ? "ri-eye-off-line" : "ri-eye-line"} text-lg`}></i>
      </button>
    )}
  </div>
);

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    password: "",
    confirmPassword: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFile: null,
    companyPhone: "",
    companyAddress: "",
    companyEmail: "",
    businessDescription: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
  });

  const [showOtp, setShowOtp] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, businessLicenseFile: e.target.files[0] });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.companyName) newErrors.companyName = "Tên công ty là bắt buộc";
    if (!form.companyEmail) newErrors.companyEmail = "Email là bắt buộc";
    if (!form.password) newErrors.password = "Mật khẩu là bắt buộc";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Mật khẩu không khớp";
    if (!form.taxNumber) newErrors.taxNumber = "Mã số thuế là bắt buộc";
    if (!form.businessLicenseNumber)
      newErrors.businessLicenseNumber = "Số giấy phép kinh doanh là bắt buộc";
    if (!form.businessLicenseFile)
      newErrors.businessLicenseFile = "Vui lòng tải lên tệp giấy phép kinh doanh";
    if (!form.companyPhone)
      newErrors.companyPhone = "Số điện thoại công ty là bắt buộc";
    if (!form.companyAddress)
      newErrors.companyAddress = "Địa chỉ công ty là bắt buộc";
    if (!form.businessDescription)
      newErrors.businessDescription = "Mô tả kinh doanh là bắt buộc";
    if (!form.contactPersonName)
      newErrors.contactPersonName = "Tên người liên hệ là bắt buộc";
    if (!form.contactPersonPhone)
      newErrors.contactPersonPhone = "Số điện thoại người liên hệ là bắt buộc";
    if (!form.contactPersonEmail)
      newErrors.contactPersonEmail = "Email người liên hệ là bắt buộc";

    return Object.keys(newErrors).length === 0;
  };

  // 🟢 Handle initial form submit - Create registration and send OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }

    setUploading(true);
    try {
      showInfo("Đang tạo đơn đăng ký và gửi OTP...");

      // 1️⃣ Tạo đơn đăng ký (backend sẽ gửi OTP)
      const registerPayload = {
        companyName: form.companyName,
        password: form.password,
        taxNumber: form.taxNumber,
        businessLicenseNumber: form.businessLicenseNumber,
        businessLicenseFileUrl: "",
        companyPhone: form.companyPhone,
        companyAddress: form.companyAddress,
        companyEmail: form.companyEmail,
        businessDescription: form.businessDescription,
        contactPersonName: form.contactPersonName,
        contactPersonPhone: form.contactPersonPhone,
        contactPersonEmail: form.contactPersonEmail,
      };

      const registerRes = await partnerApi.registerPartner(registerPayload);
      console.log("✅ Register response:", registerRes.data);

      const entityId =
        registerRes.data?.data?.id || registerRes.data?.id || null;
      if (!entityId) throw new Error("Missing entityId from register response");

      setRegistrationId(entityId);
      
      // 2️⃣ Show OTP popup (backend đã gửi OTP qua email)
      showSuccess("OTP đã được gửi đến email của bạn. Vui lòng xác thực để hoàn tất đăng ký.");
      setShowOtp(true);
    } catch (err) {
      console.error("❌ Registration creation failed:", err);
      showError("Tạo đơn đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      setUploading(false);
    }
  };

  // 🟢 Handle file upload after OTP verified
  const handleUploadAfterOTP = async () => {
    if (!registrationId) {
      showError("Không tìm thấy ID đăng ký");
      return;
    }

    setUploading(true);
    try {
      // Upload ảnh giấy phép
      if (form.businessLicenseFile) {
        showInfo("Đang tải lên giấy phép kinh doanh...");
        await partnerApi.uploadBusinessLicense(registrationId, form.businessLicenseFile);
        showSuccess("Tải lên giấy phép kinh doanh thành công!");
      }

      // Thông báo thành công
      showSuccess("✅ Đăng ký hoàn tất! Vui lòng chờ quản trị viên phê duyệt.");
      
      // Navigate to login after short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      showError("Tải lên thất bại. Vui lòng thử lại!");
    } finally {
      setUploading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 bg-gray-50">
      {/* Light Background with Subtle Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Register Card */}
      <div className="relative w-full max-w-3xl mx-4 z-10">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            {/* Parking Icon */}
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <i className="ri-parking-fill text-3xl text-white"></i>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Park<span className="text-indigo-600">Mate</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">Đăng ký đối tác bãi đỗ xe</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name - Full Width */}
            <InputField 
              icon="ri-building-line" 
              name="companyName" 
              placeholder="Tên công ty" 
              value={form.companyName} 
              onChange={handleChange} 
              colSpan={2}
            />

            {/* Email & Tax Number */}
            <InputField 
              icon="ri-mail-line" 
              type="email" 
              name="companyEmail" 
              placeholder="Email công ty" 
              value={form.companyEmail} 
              onChange={handleChange}
            />
            <InputField 
              icon="ri-file-text-line" 
              name="taxNumber" 
              placeholder="Mã số thuế" 
              value={form.taxNumber} 
              onChange={handleChange}
            />

            {/* Password Fields */}
            <InputField 
              icon="ri-lock-line" 
              name="password" 
              placeholder="Mật khẩu" 
              value={form.password} 
              onChange={handleChange}
              isPassword={true}
              showToggle={true}
              showPasswordState={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
            <InputField 
              icon="ri-lock-2-line" 
              name="confirmPassword" 
              placeholder="Xác nhận mật khẩu" 
              value={form.confirmPassword} 
              onChange={handleChange}
              isPassword={true}
              showToggle={true}
              showPasswordState={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            {/* Business License Number - Full Width */}
            <InputField 
              icon="ri-article-line" 
              name="businessLicenseNumber" 
              placeholder="Số giấy phép kinh doanh" 
              value={form.businessLicenseNumber} 
              onChange={handleChange} 
              colSpan={2}
            />

            {/* File Upload - Full Width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <i className="ri-upload-cloud-line text-indigo-400"></i>
                Tải lên giấy phép kinh doanh (PDF / Image)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:cursor-pointer hover:file:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                />
              </div>
              {form.businessLicenseFile && (
                <p className="text-sm text-indigo-300 mt-2 flex items-center gap-2">
                  <i className="ri-checkbox-circle-line"></i>
                  Tệp đã chọn: {form.businessLicenseFile.name}
                </p>
              )}
            </div>

            {/* Phone & Address */}
            <InputField 
              icon="ri-phone-line" 
              name="companyPhone" 
              placeholder="Số điện thoại công ty" 
              value={form.companyPhone} 
              onChange={handleChange}
            />
            <InputField 
              icon="ri-map-pin-line" 
              name="companyAddress" 
              placeholder="Địa chỉ công ty" 
              value={form.companyAddress} 
              onChange={handleChange}
            />

            {/* Business Description - Full Width */}
            <div className="col-span-2 relative group">
              <div className="absolute top-4 left-4 pointer-events-none z-10">
                <i className="ri-file-list-3-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
              </div>
              <textarea
                name="businessDescription"
                placeholder="Mô tả kinh doanh"
                value={form.businessDescription}
                onChange={handleChange}
                rows={3}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white hover:border-gray-300 transition-all duration-300 resize-none"
              />
            </div>

            {/* Contact Person Section */}
            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <i className="ri-user-star-line"></i>
                Thông tin người liên hệ
              </h3>
            </div>

            <InputField 
              icon="ri-user-line" 
              name="contactPersonName" 
              placeholder="Tên người liên hệ" 
              value={form.contactPersonName} 
              onChange={handleChange}
            />
            <InputField 
              icon="ri-phone-line" 
              name="contactPersonPhone" 
              placeholder="Số điện thoại người liên hệ" 
              value={form.contactPersonPhone} 
              onChange={handleChange}
            />
            <InputField 
              icon="ri-mail-line" 
              type="email" 
              name="contactPersonEmail" 
              placeholder="Email người liên hệ" 
              value={form.contactPersonEmail} 
              onChange={handleChange} 
              colSpan={2}
            />

            {/* Buttons */}
            <div className="col-span-2 flex justify-between gap-4 mt-4">
              <Link
                to="/login"
                className="flex-1 py-3.5 px-6 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-arrow-left-line"></i>
                Quay lại
              </Link>
              <button
                type="submit"
                disabled={uploading}
                className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line"></i>
                    Đăng ký
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-gray-500">
            Đã có tài khoản?{" "}
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors hover:underline underline-offset-2"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-indigo-100 rounded-full blur-xl"></div>
      </div>

      {/* Popup OTP */}
      {showOtp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <OtpPopup
            email={form.companyEmail}
            onVerified={() => {
              setShowOtp(false);
              showSuccess("✅ Email đã xác thực! Đang tải lên tài liệu...");
              handleUploadAfterOTP();
            }}
            onClose={() => {
              setShowOtp(false);
              showInfo("Đăng ký chưa hoàn tất. Vui lòng xác thực email để hoàn tất đăng ký.");
            }}
          />
        </div>
      )}
    </div>
  );
}
