import React from "react";

export default function ParkingLotTable({ lots }) {
  return (
    <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Parking Lot</th>
            <th className="p-3">Capacity (Used/Total)</th>
            <th className="p-3">Location</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot, i) => (
            <tr key={i} className="border-t">
              <td className="p-3">
                <p className="font-semibold">{lot.name}</p>
                <p className="text-sm text-gray-500">{lot.description}</p>
              </td>
              <td className="p-3">
                <div className="flex items-center space-x-2">
                  <span>
                    {lot.used} / {lot.capacity} ({Math.round((lot.used / lot.capacity) * 100)}%)
                  </span>
                  <div className="w-24 bg-gray-200 rounded h-2">
                    <div
                      className={`h-2 rounded ${
                        lot.status === "Active"
                          ? "bg-indigo-500"
                          : lot.status === "Pending"
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${(lot.used / lot.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="p-3">{lot.location}</td>
              <td className="p-3">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    lot.status === "Active"
                      ? "bg-green-100 text-green-600"
                      : lot.status === "Pending"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {lot.status}
                </span>
              </td>
              <td className="p-3 space-x-3">
                <button className="text-indigo-600 hover:underline">View</button>
                <button className="text-gray-600 hover:underline">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
