import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import partnerApi from "../api/partnerApi";
import OtpPopup from "../components/OtpPopup";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-indigo-100">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-3xl p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <h2 className="text-xl font-semibold">Đối Tác Bãi Đỗ Xe</h2>
          <p className="text-sm text-gray-500">Đăng Ký Đối Tác</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="companyName"
            placeholder="Tên Công Ty"
            value={form.companyName}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          <input
            type="email"
            name="companyEmail"
            placeholder="Email Công Ty"
            value={form.companyEmail}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="taxNumber"
            placeholder="Mã Số Thuế"
            value={form.taxNumber}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <input
            type="password"
            name="password"
            placeholder="Mật Khẩu"
            value={form.password}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Xác Nhận Mật Khẩu"
            value={form.confirmPassword}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <input
            type="text"
            name="businessLicenseNumber"
            placeholder="Số Giấy Phép Kinh Doanh"
            value={form.businessLicenseNumber}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          {/* 🟢 Upload File */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tải lên giấy phép kinh doanh (PDF / Image)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="w-full border px-4 py-2 rounded-md"
            />
            {form.businessLicenseFile && (
              <p className="text-sm text-gray-600 mt-1">
                File selected: {form.businessLicenseFile.name}
              </p>
            )}
          </div>

          <input
            type="text"
            name="companyPhone"
            placeholder="Số Điện Thoại Công Ty"
            value={form.companyPhone}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="companyAddress"
            placeholder="Địa Chỉ Công Ty"
            value={form.companyAddress}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <textarea
            name="businessDescription"
            placeholder="Mô Tả Kinh Doanh"
            value={form.businessDescription}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          <input
            type="text"
            name="contactPersonName"
            placeholder="Tên Người Liên Hệ"
            value={form.contactPersonName}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="contactPersonPhone"
            placeholder="Số Điện Thoại Người Liên Hệ"
            value={form.contactPersonPhone}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="email"
            name="contactPersonEmail"
            placeholder="Email Người Liên Hệ"
            value={form.contactPersonEmail}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          {/* Buttons */}
          <div className="col-span-2 flex justify-between mt-4">
            <Link
              to="/login"
              className="px-6 py-2 border rounded-md hover:bg-gray-100"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={uploading}
              className={`px-6 py-2 rounded-md text-white cursor-pointer ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {uploading ? "Đang xử lý..." : "Đăng Ký"}
            </button>
          </div>
        </form>
      </div>

      {/* Popup OTP */}
      {showOtp && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <OtpPopup
            email={form.companyEmail}
            onVerified={() => {
              setShowOtp(false);
              showSuccess("✅ Email đã xác thực! Đang tải lên tài liệu...");
              // Upload file sau khi verify OTP thành công
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
