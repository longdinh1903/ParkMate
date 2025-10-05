import React from "react";

export default function ViewPartnerModal({ partner, onClose }) {
  if (!partner) return null;

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 w-[420px] relative">
      <h2 className="text-lg font-semibold text-indigo-700 mb-4 border-b pb-2 flex items-center">
        <i className="ri-building-fill mr-2"></i> Partner Details
      </h2>

      <div className="text-sm text-gray-700 space-y-2">
        <p><strong>Company Name:</strong> {partner.companyName}</p>
        <p><strong>Tax Number:</strong> {partner.taxNumber}</p>
        <p><strong>Business License:</strong> {partner.businessLicenseNumber}</p>
        <p>
          <strong>License File:</strong>{" "}
          <a
            href={partner.businessLicenseFileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:underline"
          >
            View License
          </a>
        </p>
        <p><strong>Address:</strong> {partner.companyAddress}</p>
        <p><strong>Company Email:</strong> {partner.companyEmail}</p>
        <p><strong>Phone:</strong> {partner.companyPhone}</p>
        <hr />
        <p><strong>Contact Person:</strong> {partner.contactPersonName}</p>
        <p><strong>Contact Email:</strong> {partner.contactPersonEmail}</p>
        <p><strong>Contact Phone:</strong> {partner.contactPersonPhone}</p>
        <p><strong>Status:</strong> {partner.status}</p>
        <p><strong>Reason:</strong> {partner.rejectionReason}</p>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
