import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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

  const [errors, setErrors] = useState({});
  const [showOtp, setShowOtp] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, businessLicenseFile: e.target.files[0] });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.companyName) newErrors.companyName = "Company name is required";
    if (!form.companyEmail) newErrors.companyEmail = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!form.taxNumber) newErrors.taxNumber = "Tax number is required";
    if (!form.businessLicenseNumber)
      newErrors.businessLicenseNumber = "Business License Number is required";
    if (!form.businessLicenseFile)
      newErrors.businessLicenseFile = "Please upload business license file";
    if (!form.companyPhone)
      newErrors.companyPhone = "Company phone is required";
    if (!form.companyAddress)
      newErrors.companyAddress = "Company address is required";
    if (!form.businessDescription)
      newErrors.businessDescription = "Business description is required";
    if (!form.contactPersonName)
      newErrors.contactPersonName = "Contact person name is required";
    if (!form.contactPersonPhone)
      newErrors.contactPersonPhone = "Contact person phone is required";
    if (!form.contactPersonEmail)
      newErrors.contactPersonEmail = "Contact person email is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🟢 Upload ảnh thật
  const uploadBusinessLicense = async (entityId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const url = `http://parkmate-alb-942390189.ap-southeast-1.elb.amazonaws.com/api/v1/user-service/upload/image/entity?entityId=${entityId}&imageType=PARTNER_BUSINESS_LICENSE`;

    const res = await axios.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  };

  // 🟢 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showError("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    try {
      showInfo("Registering partner, please wait...");

      // 1️⃣ Đăng ký partner
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

      // 2️⃣ Upload ảnh giấy phép
      if (form.businessLicenseFile) {
        showInfo("Uploading business license...");
        await uploadBusinessLicense(entityId, form.businessLicenseFile);
        showSuccess("Uploaded business license successfully!");
      }

      // 3️⃣ Thông báo thành công
      showSuccess("Registration successful! Please verify your email.");
      setShowOtp(true);
    } catch (err) {
      console.error("❌ Register failed:", err);
      showError("Register failed. Please try again!");
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
          <h2 className="text-xl font-semibold">Parking Partner</h2>
          <p className="text-sm text-gray-500">Partner Registration</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={form.companyName}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          <input
            type="email"
            name="companyEmail"
            placeholder="Company Email"
            value={form.companyEmail}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="taxNumber"
            placeholder="Tax Number"
            value={form.taxNumber}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <input
            type="text"
            name="businessLicenseNumber"
            placeholder="Business License Number"
            value={form.businessLicenseNumber}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          {/* 🟢 Upload File */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Business License (PDF / Image)
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
            placeholder="Company Phone"
            value={form.companyPhone}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="companyAddress"
            placeholder="Company Address"
            value={form.companyAddress}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />

          <textarea
            name="businessDescription"
            placeholder="Business Description"
            value={form.businessDescription}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          <input
            type="text"
            name="contactPersonName"
            placeholder="Contact Person Name"
            value={form.contactPersonName}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="text"
            name="contactPersonPhone"
            placeholder="Contact Person Phone"
            value={form.contactPersonPhone}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
          <input
            type="email"
            name="contactPersonEmail"
            placeholder="Contact Person Email"
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
              Cancel
            </Link>
            <button
              type="submit"
              disabled={uploading}
              className={`px-6 py-2 rounded-md text-white ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {uploading ? "Processing..." : "Register"}
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
              showSuccess("🎉 Verified! You can now login.");
              navigate("/login");
            }}
            onClose={() => setShowOtp(false)}
          />
        </div>
      )}
    </div>
  );
}
