import React, { useState } from "react";
import { showError, showSuccess } from "../utils/toastUtils";
import partnerApi from "../api/partnerApi";

export default function AddPartnerModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    companyName: "",
    taxNumber: "",
    businessLicenseNumber: "",
    businessLicenseFileUrl: "",
    companyAddress: "",
    companyPhone: "",
    companyEmail: "",
    businessDescription: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await partnerApi.create({
        approvalRequestId: 123, // 👈 giá trị tạm (backend yêu cầu có)
        ...form,
      });

      if (res.status === 200 || res.status === 201) {
        showSuccess("✅ Tạo đối tác thành công!");
        onAdded();
        onClose();
      } else {
        showError("❌ Failed to create partner!");
      }
    } catch (err) {
      console.error("❌ Error creating partner:", err);
      const msg = err.response?.data?.message || "Failed to create partner.";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl relative overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <i className="ri-user-add-line text-2xl text-orange-500"></i>
            Thêm Đối Tác
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form id="add-partner-form" className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          {[
            { label: "Tên Công Ty", name: "companyName", placeholder: "Nhập tên công ty" },
            { label: "Mã Số Thuế", name: "taxNumber", placeholder: "Nhập mã số thuế" },
            { label: "Số Giấy Phép", name: "businessLicenseNumber", placeholder: "Nhập số giấy phép kinh doanh" },
            { label: "URL File Giấy Phép", name: "businessLicenseFileUrl", placeholder: "Nhập đường dẫn file giấy phép" },
            { label: "Số Điện Thoại", name: "companyPhone", placeholder: "Nhập số điện thoại" },
            { label: "Email", name: "companyEmail", placeholder: "Nhập địa chỉ email" },
            { label: "Địa Chỉ", name: "companyAddress", placeholder: "Nhập địa chỉ công ty" },
            { label: "Mô Tả", name: "businessDescription", placeholder: "Nhập mô tả hoạt động kinh doanh" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {f.label}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
                required
                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
              />
            </div>
          ))}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="add-partner-form"
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <i className="ri-add-line"></i>
            <span>Thêm</span>
          </button>
        </div>
      </div>
    </div>
  );
}
