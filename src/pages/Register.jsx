import React, { useState } from "react";
import { Link } from "react-router-dom";
import partnerApi from "../api/partnerApi";

export default function Register() {
  const [form, setForm] = useState({
    companyName: "",
    password: "",
    confirmPassword: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFile: null, // file upload
    companyPhone: "",
    companyAddress: "",
    companyEmail: "",
    businessDescription: "",
    contactPersonName: "",
    contactPersonPhone: "",
    contactPersonEmail: "",
  });

  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Validate form
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
      newErrors.businessLicenseFile = "Business License File is required";
    if (!form.companyPhone) newErrors.companyPhone = "Company phone is required";
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

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // 👇 Giả sử upload file xong sẽ trả về URL
    const businessLicenseFileUrl = preview || "";

    const payload = {
      companyName: form.companyName,
      password: form.password,
      taxNumber: form.taxNumber,
      businessLicenseNumber: form.businessLicenseNumber,
      businessLicenseFileUrl, // mock URL
      companyPhone: form.companyPhone,
      companyAddress: form.companyAddress,
      companyEmail: form.companyEmail,
      businessDescription: form.businessDescription,
      contactPersonName: form.contactPersonName,
      contactPersonPhone: form.contactPersonPhone,
      contactPersonEmail: form.contactPersonEmail,
    };

    console.log("📤 Payload gửi API:", payload);

    try {
      const res = await partnerApi.registerPartner(payload);
      alert("✅ Register success!");
      console.log("Response:", res.data);
    } catch (error) {
      console.error("❌ Register failed:", error);
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
          {/* Company Name */}
          <input
            type="text"
            name="companyName"
            placeholder="Company Name"
            value={form.companyName}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />
          {errors.companyName && (
            <p className="text-red-500 text-sm col-span-2">{errors.companyName}</p>
          )}

          {/* Email + Password */}
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

          {/* Confirm Password + Tax */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="border px-4 py-2 rounded-md"
          />
         

          {/* Business License Number */}
          <input
            type="text"
            name="businessLicenseNumber"
            placeholder="Business License Number"
            value={form.businessLicenseNumber}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          {/* Phone + Address */}
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

          {/* Business Description */}
          <textarea
            name="businessDescription"
            placeholder="Business Description"
            value={form.businessDescription}
            onChange={handleChange}
            className="col-span-2 border px-4 py-2 rounded-md"
          />

          {/* Contact Person */}
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

          {/* Business License File */}
          <div className="col-span-2">
            <label className="block mb-1 font-medium text-sm">
              Business License File
            </label>
            <input
              type="file"
              name="businessLicenseFile"
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded-md"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-3 h-32 object-contain border rounded-md"
              />
            )}
          </div>

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
    </div>
  );
}
