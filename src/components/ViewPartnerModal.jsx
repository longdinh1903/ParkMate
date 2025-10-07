import React, { useState } from "react";
import partnerApi from "../api/partnerApi";

export default function ViewPartnerModal({ partner, onClose, onActionDone }) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!partner) return null;

  const handleApprove = async () => {
    if (!window.confirm("Bạn có chắc muốn phê duyệt đối tác này?")) return;
    setIsProcessing(true);
    try {
      await partnerApi.updateStatus(partner.id, {
        status: "APPROVED",
        approvalNotes: "Approved from Admin Panel",
        reviewerId: 1,
        valid: true,
      });
      alert("✅ Đã phê duyệt thành công!");
      onActionDone?.();
      onClose();
    } catch (err) {
      console.error("❌ Error approving partner:", err);
      alert("Phê duyệt thất bại!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;
    setIsProcessing(true);
    try {
      await partnerApi.updateStatus(partner.id, {
        status: "REJECTED",
        rejectionReason: reason,
        reviewerId: 1,
        valid: true,
      });
      alert("❌ Đã từ chối yêu cầu!");
      onActionDone?.();
      onClose();
    } catch (err) {
      console.error("❌ Error rejecting partner:", err);
      alert("Từ chối thất bại!");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[480px] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
          <i className="ri-building-fill text-indigo-600"></i>
          Partner Details
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-5 text-sm text-gray-700 space-y-2 max-h-[70vh] overflow-y-auto">
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
                className="text-indigo-600 hover:underline"
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

      {/* Footer buttons */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          Close
        </button>

        <div className="flex gap-3">
          {partner.status === "PENDING" && (
            <>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
              >
                <i className="ri-check-line mr-1"></i> Approve
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                <i className="ri-close-line mr-1"></i> Reject
              </button>
            </>
          )}
          {partner.status !== "PENDING" && (
            <span className="text-gray-500 text-sm italic">
              No actions available
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
