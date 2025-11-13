import React, { useState } from "react";
import partnerApi from "../api/partnerApi";
import { showSuccess, showError, showInfo } from "../utils/toastUtils.jsx";

export default function ViewPartnerModal({ partner, onClose, onActionDone }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false); // ✅ thêm modal approve

  if (!partner) return null;

  // ✅ Gửi request phê duyệt
  const handleApproveSubmit = async () => {
    setIsProcessing(true);
    try {
      showInfo("⏳ Đang phê duyệt đối tác...");
      await partnerApi.updateStatus(partner.id, {
        status: "APPROVED",
        approvalNotes: "Approved from Admin Panel",
        reviewerId: 1,
        valid: true,
      });
      showSuccess("✅ Đã phê duyệt thành công!");
      onActionDone?.();
      onClose();
    } catch (err) {
      console.error("❌ Error approving partner:", err);
      showError("Phê duyệt thất bại!");
    } finally {
      setIsProcessing(false);
      setShowApproveModal(false);
    }
  };

  // ✅ Gửi lý do từ chối
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      showError("⚠️ Vui lòng nhập lý do từ chối!");
      return;
    }
    setIsProcessing(true);
    try {
      showInfo("⏳ Đang từ chối yêu cầu...");
      await partnerApi.updateStatus(partner.id, {
        status: "REJECTED",
        rejectionReason: rejectReason.trim(),
        reviewerId: 1,
        valid: true,
      });
      showSuccess("❌ Đã từ chối yêu cầu!");
      onActionDone?.();
      onClose();
    } catch (err) {
      console.error("❌ Error rejecting partner:", err);
      showError("Từ chối thất bại!");
    } finally {
      setIsProcessing(false);
      setShowRejectModal(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[700px] max-h-[90vh] border border-gray-200 flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-orange-700 flex items-center gap-2">
              <i className="ri-building-fill text-orange-600 text-2xl"></i>
              Partner Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-5 text-sm text-gray-700 space-y-3 overflow-y-auto flex-1">
          
          {/* Company Information */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <i className="ri-building-line"></i>
              Company Information
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600 text-xs">Company Name:</span>
                <p className="font-medium text-gray-900">{partner.companyName || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 text-xs">Tax Number:</span>
                  <p className="font-medium text-gray-900">{partner.taxNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Business License:</span>
                  <p className="font-medium text-gray-900">{partner.businessLicenseNumber || "N/A"}</p>
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-xs">Address:</span>
                <p className="font-medium text-gray-900">{partner.companyAddress || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 text-xs">Email:</span>
                  <p className="font-medium text-gray-900 truncate">{partner.companyEmail || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Phone:</span>
                  <p className="font-medium text-gray-900">{partner.companyPhone || "N/A"}</p>
                </div>
              </div>
              {partner.website && (
                <div>
                  <span className="text-gray-600 text-xs">Website:</span>
                  <a 
                    href={partner.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline block truncate"
                  >
                    {partner.website}
                  </a>
                </div>
              )}
              {partner.businessDescription && (
                <div>
                  <span className="text-gray-600 text-xs">Business Description:</span>
                  <p className="text-gray-700 text-sm mt-1">{partner.businessDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Person */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <i className="ri-user-line"></i>
              Contact Person
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600 text-xs">Full Name:</span>
                <p className="font-medium text-gray-900">{partner.contactPersonName || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 text-xs">Email:</span>
                  <p className="font-medium text-gray-900 truncate">{partner.contactPersonEmail || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-xs">Phone:</span>
                  <p className="font-medium text-gray-900">{partner.contactPersonPhone || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business License File */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <i className="ri-file-text-line"></i>
              Business License Document
            </h3>
            {partner.businessLicenseFileUrl ? (
              <div className="space-y-3">
                <a
                  href={partner.businessLicenseFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                >
                  <i className="ri-file-download-line"></i>
                  View/Download License
                </a>
                
                {/* Image Preview */}
                {partner.businessLicenseFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                  <div className="border border-orange-200 rounded-lg overflow-hidden bg-white p-2">
                    <p className="text-xs text-gray-600 mb-2">Preview:</p>
                    <img
                      src={partner.businessLicenseFileUrl}
                      alt="Business License"
                      className="max-w-full h-auto rounded shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <div style={{display: 'none'}} className="text-center p-4 bg-gray-50 rounded">
                      <i className="ri-image-line text-3xl text-gray-400"></i>
                      <p className="text-xs text-gray-500 mt-2">Cannot load image preview</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No license file uploaded</p>
            )}
          </div>

          {/* Status & Review */}
          <div className={`rounded-lg p-4 border ${
            partner.status === "APPROVED" 
              ? "bg-green-50 border-green-200" 
              : partner.status === "REJECTED"
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
              partner.status === "APPROVED" 
                ? "text-green-900" 
                : partner.status === "REJECTED"
                ? "text-red-900"
                : "text-yellow-900"
            }`}>
              <i className={`${
                partner.status === "APPROVED" 
                  ? "ri-checkbox-circle-line" 
                  : partner.status === "REJECTED"
                  ? "ri-close-circle-line"
                  : "ri-time-line"
              }`}></i>
              Registration Status
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600 text-xs">Status:</span>
                <p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-semibold ${
                    partner.status === "APPROVED"
                      ? "text-green-700 bg-green-100"
                      : partner.status === "REJECTED"
                      ? "text-red-700 bg-red-100"
                      : "text-yellow-700 bg-yellow-100"
                  }`}>
                    {partner.status}
                  </span>
                </p>
              </div>
              {partner.rejectionReason && (
                <div>
                  <span className="text-gray-600 text-xs">Rejection Reason:</span>
                  <p className="text-red-700 bg-red-100 px-3 py-2 rounded border border-red-200 text-sm mt-1">
                    {partner.rejectionReason}
                  </p>
                </div>
              )}
              {partner.submittedAt && (
                <div>
                  <span className="text-gray-600 text-xs">Submitted At:</span>
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(partner.submittedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end flex-shrink-0">
          {partner.status === "PENDING" && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <i className="ri-close-line"></i>
                Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <i className="ri-check-line"></i>
                Approve
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>

      {/* 🔸 Modal nhập lý do từ chối */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px] animate-fadeIn">
            <h2 className="text-lg font-semibold text-red-600 mb-3">
              🚫 Nhập lý do từ chối
            </h2>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400"
              rows="4"
              placeholder="Nhập chi tiết lý do..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal xác nhận phê duyệt */}
      {showApproveModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px] animate-fadeIn">
            <h2 className="text-lg font-semibold text-green-700 mb-3">
              ✅ Xác nhận phê duyệt
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Bạn có chắc chắn muốn phê duyệt đối tác{" "}
              <strong>{partner.companyName}</strong> không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleApproveSubmit}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
