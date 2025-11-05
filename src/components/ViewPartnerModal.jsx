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
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/30 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[480px] max-h-[85vh] border border-gray-200 flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
              <i className="ri-building-fill text-orange-600"></i>
              Partner Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-5 text-sm text-gray-700 space-y-2 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-1">
            <p>
              <strong>Company Name:</strong> {partner.companyName}
            </p>
            <p>
              <strong>Tax Number:</strong> {partner.taxNumber}
            </p>
            <p>
              <strong>Business License:</strong>{" "}
              {partner.businessLicenseNumber || "N/A"}
            </p>
            <p>
              <strong>License File:</strong>{" "}
              {partner.businessLicenseFileUrl ? (
                <a
                  href={partner.businessLicenseFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  View License
                </a>
              ) : (
                <span className="text-gray-500">No file</span>
              )}
            </p>
            <p>
              <strong>Address:</strong> {partner.companyAddress || "N/A"}
            </p>
            <p>
              <strong>Company Email:</strong> {partner.companyEmail}
            </p>
            <p>
              <strong>Phone:</strong> {partner.companyPhone}
            </p>
          </div>

          <hr className="my-3" />

          <div className="grid grid-cols-1 gap-1">
            <p>
              <strong>Contact Person:</strong> {partner.contactPersonName}
            </p>
            <p>
              <strong>Contact Email:</strong> {partner.contactPersonEmail}
            </p>
            <p>
              <strong>Contact Phone:</strong> {partner.contactPersonPhone}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`px-2 py-0.5 text-xs rounded-md font-semibold ${
                  partner.status === "APPROVED"
                    ? "text-green-600 bg-green-50 border border-green-300"
                    : partner.status === "REJECTED"
                    ? "text-red-600 bg-red-50 border border-red-300"
                    : "text-yellow-600 bg-yellow-50 border border-yellow-300"
                }`}
              >
                {partner.status}
              </span>
            </p>
            {partner.rejectionReason && (
              <p>
                <strong>Reason:</strong> {partner.rejectionReason}
              </p>
            )}
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
