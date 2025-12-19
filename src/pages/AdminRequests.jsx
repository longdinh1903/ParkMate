import { useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import AdminPartnerRequests from "./AdminPartnerRequests";
import AdminParkingLotRequests from "./AdminParkingLotRequests";

export default function AdminRequests() {
  const [activeTab, setActiveTab] = useState("partner");

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
          <i className="ri-file-list-3-fill"></i>
          Yêu cầu đối tác & bãi đỗ xe
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6">
        <button
          className={`pb-2 transition-all ${
            activeTab === "partner"
              ? "border-b-2 border-orange-600 text-orange-700 font-semibold"
              : "text-gray-500 hover:text-orange-500"
          }`}
          onClick={() => setActiveTab("partner")}
        >
          Yêu cầu tài khoản đối tác
        </button>

        <button
          className={`pb-2 transition-all ${
            activeTab === "parkingLot"
              ? "border-b-2 border-orange-600 text-orange-700 font-semibold"
              : "text-gray-500 hover:text-orange-500"
          }`}
          onClick={() => setActiveTab("parkingLot")}
        >
          Yêu cầu bãi đỗ xe
        </button>
      </div>

      {/* Content */}
      {activeTab === "partner" ? (
        <AdminPartnerRequests />
      ) : (
        <AdminParkingLotRequests />
      )}
    </AdminLayout>
  );
}
