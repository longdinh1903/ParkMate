import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Register from "../pages/Register";
import ConfirmEmail from "../pages/ConfirmEmail";
import PartnerHome from "../pages/PartnerHome";
import RegisterLot from "../pages/RegisterLot";
import PartnerSubscriptions from "../pages/PartnerSubscriptions";
import PartnerUsers from "../pages/PartnerUsers";
import PartnerSessions from "../pages/PartnerSessions";
import PartnerReservations from "../pages/PartnerReservations";
import PartnerDashboard from "../pages/PartnerDashboard";
import PartnerProfile from "../pages/PartnerProfile";
import PartnerWithdrawals from "../pages/PartnerWithdrawals";
import AdminLogin from "../pages/AdminLogin";
import AdminPartners from "../pages/AdminPartners";
import AdminRequests from "../pages/AdminRequests";
import AdminUsers from "../pages/AdminUsers";
import AdminParkingLots from "../pages/AdminParkingLots";
import AdminFeeConfig from "../pages/AdminFeeConfig";
import AdminDashboard from "../pages/AdminDashboard";
import AdminDevices from "../pages/AdminDevices";
import AdminDeviceFees from "../pages/AdminDeviceFees";
import ProtectedPartnerRoute from "../components/ProtectedPartnerRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Partner/User routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/partner-profile" element={<PartnerProfile />} />
      
      {/* Protected Partner routes - Only for APPROVED status */}
      <Route path="/home" element={<ProtectedPartnerRoute><PartnerHome /></ProtectedPartnerRoute>} />
      <Route path="/register-lot" element={<ProtectedPartnerRoute><RegisterLot /></ProtectedPartnerRoute>} />
      <Route path="/subscriptions" element={<ProtectedPartnerRoute><PartnerSubscriptions /></ProtectedPartnerRoute>} />
      <Route path="/withdrawals" element={<ProtectedPartnerRoute><PartnerWithdrawals /></ProtectedPartnerRoute>} />
      <Route path="/users" element={<ProtectedPartnerRoute><PartnerUsers /></ProtectedPartnerRoute>} />
      <Route path="/sessions" element={<ProtectedPartnerRoute><PartnerSessions /></ProtectedPartnerRoute>} />
      <Route path="/reservations" element={<ProtectedPartnerRoute><PartnerReservations /></ProtectedPartnerRoute>} />
      <Route path="/dashboard" element={<ProtectedPartnerRoute><PartnerDashboard /></ProtectedPartnerRoute>} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/partners" element={<AdminPartners />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/requests" element={<AdminRequests />} />
      <Route path="/admin/parking-lots" element={<AdminParkingLots />} />
      <Route path="/admin/fee-config" element={<AdminFeeConfig />} />
      <Route path="/admin/devices" element={<AdminDevices />} />
      <Route path="/admin/device-fees" element={<AdminDeviceFees />} />
    </Routes>
  );
}
