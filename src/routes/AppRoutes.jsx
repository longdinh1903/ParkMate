import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PartnerHome from "../pages/PartnerHome";
import RegisterLot from "../pages/RegisterLot";
import AdminLogin from "../pages/AdminLogin";
import AdminPartners from "../pages/AdminPartners";
import AdminRequests from "../pages/AdminRequests";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Partner/User routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/home" element={<PartnerHome />} />
      <Route path="/register-lot" element={<RegisterLot />} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/partners" element={<AdminPartners />} />
      <Route path="/admin/requests" element={<AdminRequests />} />
    </Routes>
  );
}
