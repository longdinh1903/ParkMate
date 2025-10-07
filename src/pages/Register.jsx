import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import partnerApi from "../api/partnerApi";
import OtpPopup from "../components/OtpPopup"; // ✅ import OTP

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    password: "",
    confirmPassword: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFileUrl: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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
    if (!form.businessLicenseFileUrl)
      newErrors.businessLicenseFileUrl =
        "Business License File URL is required";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await partnerApi.registerPartner(form);
      console.log("✅ Register response:", res.data);

      if (res.data.success) {
        setShowOtp(true); // mở popup OTP
      } else {
        alert("❌ Register failed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Register failed:", err);
      alert("Register failed!");
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

          <input
            type="text"
            name="businessLicenseFileUrl"
            placeholder="Business License File URL"
            value={form.businessLicenseFileUrl}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

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
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Register
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
              alert("🎉 Verified! You can now login.");
              navigate("/login");
            }}
            onClose={() => setShowOtp(false)} // ✅ truyền hàm onClose
          />
        </div>
      )}
    </div>
  );
}
