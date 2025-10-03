import React from "react";

export default function PartnerTable({ partners }) {
  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Partners</h2>
      <table className="min-w-full border text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 border">Name</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Phone</th>
            <th className="px-4 py-2 border">Parking Lots</th>
            <th className="px-4 py-2 border">Location</th>
            <th className="px-4 py-2 border">Registered At</th>
          </tr>
        </thead>
        <tbody>
          {partners.length > 0 ? (
            partners.map((p) => (
              <tr key={p.id} className="text-center hover:bg-gray-50">
                <td className="border px-4 py-2">{p.companyName}</td>
                <td className="border px-4 py-2">{p.companyEmail}</td>
                <td className="border px-4 py-2">{p.companyPhone}</td>
                <td className="border px-4 py-2">{p.totalParkingLots}</td>
                <td className="border px-4 py-2">{p.city}, {p.state}</td>
                <td className="border px-4 py-2">{new Date(p.registeredAt).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-gray-500 py-4">
                No partners found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
