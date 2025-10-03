import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import ParkingLotTable from "../components/ParkingLotTable";
import parkingLotApi from "../api/parkingLotApi";   // ✅ dùng axiosClient
import { FaCar, FaClock, FaCheckCircle, FaBuilding } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";

export default function PartnerHome() {
  const [lots, setLots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await parkingLotApi.getParkingLots(); 
        setLots(res.data); // backend trả mảng lots
      } catch (err) {
        console.error("Error fetching lots", err);
      }
    };
    fetchData();
  }, []);

  return (
    <MainLayout>
      {/* Dashboard Cards */}
      <div className="grid grid-cols-4 gap-4">
        <DashboardCard 
          title="Total Lots" 
          value={lots.length} 
          icon={<FaBuilding />} 
          color="bg-indigo-100 text-indigo-600" 
        />
        <DashboardCard 
          title="Active Lots" 
          value={lots.filter(l => l.status === "Active").length} 
          icon={<FaCheckCircle />} 
          color="bg-green-100 text-green-600" 
        />
        <DashboardCard 
          title="Pending" 
          value={lots.filter(l => l.status === "Pending").length} 
          icon={<FaClock />} 
          color="bg-yellow-100 text-yellow-600" 
        />
        <DashboardCard 
          title="Total Capacity" 
          value={lots.reduce((a, b) => a + (b.capacity || 0), 0)} 
          icon={<FaCar />} 
          color="bg-blue-100 text-blue-600" 
        />
      </div>

      {/* Table */}
      <h2 className="text-xl font-bold mt-8">My Parking Lots</h2>
      <p className="text-gray-500 mb-4">
        Quản lý và theo dõi tất cả các bãi đậu xe bạn đã đăng ký
      </p>
      <ParkingLotTable lots={lots} />
    </MainLayout>
  );
}
