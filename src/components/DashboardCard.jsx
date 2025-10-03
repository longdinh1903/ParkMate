import React from "react";

export default function DashboardCard({ title, value, icon, color }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}
