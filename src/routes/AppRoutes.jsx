import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ConfirmEmail from "../pages/ConfirmEmail";
import PartnerHome from "../pages/PartnerHome";
import RegisterLot from "../pages/RegisterLot";
import PartnerSubscriptions from "../pages/PartnerSubscriptions";
import PartnerSubscriptionsTest from "../pages/PartnerSubscriptionsTest";
import AdminLogin from "../pages/AdminLogin";
import AdminPartners from "../pages/AdminPartners";
import AdminRequests from "../pages/AdminRequests";
import AdminUsers from "../pages/AdminUsers";
import AdminParkingLots from "../pages/AdminParkingLots";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Partner/User routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirm-email" element={<ConfirmEmail />} />
      <Route path="/home" element={<PartnerHome />} />
      <Route path="/register-lot" element={<RegisterLot />} />
      <Route path="/subscriptions" element={<PartnerSubscriptions />} />
      <Route path="/subscriptions-test" element={<PartnerSubscriptionsTest />} />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/partners" element={<AdminPartners />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/requests" element={<AdminRequests />} />
      <Route path="/admin/parking-lots" element={<AdminParkingLots />} />
    </Routes>
  );
}
