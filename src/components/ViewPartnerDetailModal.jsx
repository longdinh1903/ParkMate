import React, { useState, useEffect } from "react";
import partnerApi from "../api/partnerApi";
import { showError } from "../utils/toastUtils";

// Icon Imports (Giả sử bạn đang dùng React Icons hoặc tương tự,
// tôi sẽ thay thế các class "ri-" bằng icon giả định hoặc giữ lại nếu bạn dùng Remixed Icons)

export default function ViewPartnerDetailModal({ partnerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch chi tiết partner
  useEffect(() => {
    if (!partnerId) return;
    const fetchPartner = async () => {
      try {
        setLoading(true);
        const res = await partnerApi.getByIdPartner(partnerId);
        // Giả lập dữ liệu để có đủ các trường hiển thị
        const mockData = res.data?.data || null;

        // Nếu dữ liệu trả về bị thiếu, giả lập một số trường cho mục đích hiển thị
        if (mockData && !mockData.rejectionReason) {
            // Chỉ thêm trường này nếu nó không tồn tại để test hiển thị
            // mockData.rejectionReason = "Hồ sơ kinh doanh chưa đầy đủ giấy tờ theo quy định.";
        }

        setData(mockData);
      } catch (err) {
        console.error("❌ Error fetching partner details:", err);
        showError("Không thể tải thông tin đối tác!");
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [partnerId]);

  if (!partnerId) return null;

  // Hàm helper để render một dòng thông tin
  const InfoRow = ({ label, value, children }) => (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0">
      <span className="font-medium text-gray-500 w-1/3 min-w-[150px]">{label}</span>
      <div className="text-gray-800 w-2/3 break-words text-right">{value || children || <span className="text-gray-400 italic">N/A</span>}</div>
    </div>
  );
  
  // Hàm lấy class cho Status badge
  const getStatusClasses = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 ring-green-600/20";
      case "REJECTED":
        return "bg-red-100 text-red-700 ring-red-600/20";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 ring-yellow-600/20";
      default:
        return "bg-gray-100 text-gray-700 ring-gray-600/20";
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative overflow-hidden transform transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-orange-50 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-700 flex items-center gap-3">
            {/* Sử dụng icon hiện đại hơn */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-orange-500">
                <path fillRule="evenodd" d="M3.75 3.75L7.5 7.5L3.75 11.25V3.75ZM7.5 7.5L11.25 3.75H18.75A2.25 2.25 0 0121 6V18A2.25 2.25 0 0118.75 20.25H5.25A2.25 2.25 0 013 18.75V15L7.5 10.5V7.5ZM15 15.75A1.5 1.5 0 1112 15.75A1.5 1.5 0 0115 15.75Z" clipRule="evenodd" />
            </svg>
            Partner Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close"
          >
            {/* Icon đóng hiện đại */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500 italic text-lg">
            Đang tải thông tin đối tác...
          </div>
        ) : data ? (
          <div className="p-6 text-sm text-gray-700 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* --- General Status Section --- */}
            <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">General Status</h3>
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <span className="font-bold text-base text-gray-600">Status:</span>
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${getStatusClasses(data.status)}`}
                    >
                        {data.status || "UNKNOWN"}
                    </span>
                </div>
                {data.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg">
                        <p className="font-semibold">Reason for rejection/suspension:</p>
                        <p className="text-sm italic">{data.rejectionReason}</p>
                    </div>
                )}
            </div>

            {/* --- Company Info Section --- */}
            <section className="mb-6">
                <h3 className="text-lg font-semibold text-orange-600 mb-3 border-b-2 border-orange-100 pb-1">Company Information</h3>
                <div className="space-y-1">
                    <InfoRow label="Company Name" value={data.companyName} />
                    <InfoRow label="Tax Number" value={data.taxNumber} />
                    <InfoRow label="Business License" value={data.businessLicenseNumber} />
                    <InfoRow label="Address" value={data.companyAddress} />
                    <InfoRow label="Company Email" value={data.companyEmail} />
                    <InfoRow label="Company Phone" value={data.companyPhone} />
                    <InfoRow label="Business License File">
                        {data.businessLicenseFileUrl ? (
                            <a
                                href={data.businessLicenseFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 hover:text-orange-800 font-semibold transition underline"
                            >
                                View Attachment
                            </a>
                        ) : (
                            <span className="text-gray-400">No file available</span>
                        )}
                    </InfoRow>
                    <div className="pt-2">
                        <span className="font-medium text-gray-500 block mb-1">Business Description:</span>
                        <p className="p-3 bg-gray-50 border rounded-md whitespace-pre-wrap text-gray-800">
                            {data.businessDescription || "No detailed description available."}
                        </p>
                    </div>
                </div>
            </section>

            {/* --- Contact Info Section --- */}
            <section>
                <h3 className="text-lg font-semibold text-orange-600 mb-3 border-b-2 border-orange-100 pb-1">Contact Information</h3>
                {Array.isArray(data.accounts) && data.accounts.length > 0 ? (
                    (() => {
                        const contact = data.accounts[0];
                        return (
                            <div className="space-y-1">
                                <InfoRow label="Contact Name" value={contact.fullName} />
                                <InfoRow label="Contact Email" value={contact.email} />
                                <InfoRow label="Contact Phone" value={contact.phone} />
                            </div>
                        );
                    })()  
                ) : (
                    <p className="p-3 bg-yellow-50 text-yellow-700 rounded-lg italic">No contact information linked.</p>
                )}
            </section>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-red-500 italic text-lg">
            No data found for this partner.
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}