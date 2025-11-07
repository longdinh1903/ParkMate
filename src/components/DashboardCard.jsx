import React from "react";

export default function DashboardCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold text-gray-700">{value}</p>
      </div>
    </div>
  );
}

