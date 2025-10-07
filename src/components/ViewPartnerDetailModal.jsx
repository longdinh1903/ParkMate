import React, { useState, useEffect } from "react";
import partnerApi from "../api/partnerApi";
import { showError } from "../utils/toastUtils";

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
        setData(res.data?.data || null);
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

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] relative overflow-hidden">
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
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500 italic">
            Loading partner details...
          </div>
        ) : data ? (
          <div className="px-6 py-5 text-sm text-gray-700 space-y-2 max-h-[70vh] overflow-y-auto">
            {/* --- Company Info --- */}
            <div className="grid grid-cols-1 gap-1">
              <p>
                <strong>Company Name:</strong> {data.companyName || "N/A"}
              </p>
              <p>
                <strong>Tax Number:</strong> {data.taxNumber || "N/A"}
              </p>
              <p>
                <strong>Business License:</strong>{" "}
                {data.businessLicenseNumber || "N/A"}
              </p>
              <p>
                <strong>License File:</strong>{" "}
                {data.businessLicenseFileUrl ? (
                  <a
                    href={data.businessLicenseFileUrl}
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
                <strong>Address:</strong> {data.companyAddress || "N/A"}
              </p>
              <p>
                <strong>Company Email:</strong> {data.companyEmail || "N/A"}
              </p>
              <p>
                <strong>Phone:</strong> {data.companyPhone || "N/A"}
              </p>
              <p>
                <strong>Description:</strong> {data.businessDescription || "N/A"}
              </p>
            </div>

            <hr className="my-3" />

            {/* --- Contact Info --- */}
            {Array.isArray(data.accounts) && data.accounts.length > 0 ? (
              (() => {
                const contact = data.accounts[0];
                return (
                  <div className="grid grid-cols-1 gap-1">
                    <p>
                      <strong>Contact Person:</strong>{" "}
                      {contact.fullName || "N/A"}
                    </p>
                    <p>
                      <strong>Contact Email:</strong>{" "}
                      {contact.email || "N/A"}
                    </p>
                    <p>
                      <strong>Contact Phone:</strong>{" "}
                      {contact.phone || "N/A"}
                    </p>
                  </div>
                );
              })()
            ) : (
              <p className="text-gray-500 italic">No contact person linked.</p>
            )}

            <hr className="my-3" />

            {/* --- Status --- */}
            <div className="grid grid-cols-1 gap-1">
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-0.5 text-xs rounded-md font-semibold ${
                    data.status === "APPROVED"
                      ? "text-green-600 bg-green-50 border border-green-300"
                      : data.status === "REJECTED"
                      ? "text-red-600 bg-red-50 border border-red-300"
                      : "text-yellow-600 bg-yellow-50 border border-yellow-300"
                  }`}
                >
                  {data.status || "N/A"}
                </span>
              </p>
              {data.rejectionReason && (
                <p>
                  <strong>Reason:</strong> {data.rejectionReason}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500 italic">
            No data found for this partner.
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
