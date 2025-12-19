import { useState } from "react";
import partnerApi from "../api/partnerApi";
import { showError, showSuccess } from "../utils/toastUtils.jsx";

export default function EditPartnerModal({ partner, onClose, onUpdated }) {
  const [form, setForm] = useState({
    companyName: partner.companyName || "",
    taxNumber: partner.taxNumber || "",
    businessLicenseNumber: partner.businessLicenseNumber || "",
    businessLicenseFileUrl: partner.businessLicenseFileUrl || "",
    companyAddress: partner.companyAddress || "",
    companyPhone: partner.companyPhone || "",
    companyEmail: partner.companyEmail || "",
    businessDescription: partner.businessDescription || "",
    status: partner.status || "PENDING",
    suspensionReason: partner.suspensionReason || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id = partner.partnerId || partner.id;
      const res = await partnerApi.update(id, form);
      if (res.status === 200) {
        showSuccess("✅ Cập nhật đối tác thành công!");
        onUpdated();
        onClose();
      } else {
        showError("❌ Không thể cập nhật đối tác.");
      }
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "❌ Cập nhật thất bại!");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            <i className="ri-edit-box-line text-2xl text-orange-500"></i>
            Chỉnh sửa 
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên công ty</label>
            <input
              name="companyName"
              placeholder="Nhập tên công ty"
              value={form.companyName}
              onChange={handleChange}
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã số thuế</label>
            <input
              name="taxNumber"
              placeholder="Nhập mã số thuế"
              value={form.taxNumber}
              onChange={handleChange}
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              name="companyEmail"
              placeholder="Nhập địa chỉ email"
              value={form.companyEmail}
              onChange={handleChange}
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            <input
              name="companyPhone"
              placeholder="Nhập số điện thoại"
              value={form.companyPhone}
              onChange={handleChange}
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
            <input
              name="companyAddress"
              placeholder="Nhập địa chỉ công ty"
              value={form.companyAddress}
              onChange={handleChange}
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả kinh doanh</label>
            <textarea
              name="businessDescription"
              placeholder="Nhập mô tả kinh doanh"
              value={form.businessDescription}
              onChange={handleChange}
              rows="3"
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lý do tạm ngưng</label>
            <textarea
              name="suspensionReason"
              placeholder="Nhập lý do tạm ngưng (nếu có)"
              value={form.suspensionReason}
              onChange={handleChange}
              rows="2"
              className="border border-gray-300 w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition resize-none"
            />
          </div>
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200 cursor-pointer"
          >
            <i className="ri-save-line"></i>
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
