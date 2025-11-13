import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import partnerApi from "../api/partnerApi";
import toast from "react-hot-toast";

export default function ProtectedPartnerRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const userEmail = localStorage.getItem("userEmail");
      const cachedStatus = localStorage.getItem("registrationStatus"); // ✅ Get cached status
      
      if (!token || !userEmail) {
        // Không có token hoặc email → redirect về login
        setLoading(false);
        return;
      }

      console.log("🔒 ProtectedRoute: Checking status for email:", userEmail);
      console.log("🔒 ProtectedRoute: Cached status from localStorage:", cachedStatus);

      // ✅ Nếu có cached status = APPROVED, cho phép access ngay
      if (cachedStatus === "APPROVED") {
        console.log("✅ ProtectedRoute: Using cached APPROVED status, allowing access");
        setIsApproved(true);
        setLoading(false);
        return;
      }

      // Get registration status from API để verify
      const response = await partnerApi.getRequests({});
      console.log("🔒 ProtectedRoute: API response:", response);
      
      // Handle multiple possible response structures
      let registrationsList = [];
      if (response?.data?.content) {
        registrationsList = response.data.content;
      } else if (response?.data?.data?.content) {
        registrationsList = response.data.data.content;
      } else if (Array.isArray(response?.data?.data)) {
        registrationsList = response.data.data;
      } else if (Array.isArray(response?.data)) {
        registrationsList = response.data;
      }
      
      console.log("🔒 ProtectedRoute: Registrations list:", registrationsList);
      
      const registration = registrationsList.find(
        (req) => req.companyEmail === userEmail || req.contactPersonEmail === userEmail
      );

      console.log("🔒 ProtectedRoute: Found registration:", registration);

      if (!registration) {
        console.warn("🔒 ProtectedRoute: No registration found from API");
        // ✅ Fallback to cached status if available
        if (cachedStatus === "APPROVED") {
          console.log("✅ ProtectedRoute: Using cached status as fallback");
          setIsApproved(true);
        } else {
          toast.error("Không tìm thấy thông tin đăng ký");
        }
        setLoading(false);
        return;
      }

      console.log("🔒 ProtectedRoute: Registration status:", registration.status);

      // Check status
      if (registration.status === "APPROVED") {
        console.log("✅ ProtectedRoute: Status is APPROVED, allowing access");
        setIsApproved(true);
      } else if (registration.status === "PENDING") {
        console.warn("⏳ ProtectedRoute: Status is PENDING, blocking access");
        toast.error("Tài khoản của bạn đang chờ duyệt. Vui lòng đợi admin phê duyệt.");
      } else if (registration.status === "REJECTED") {
        console.warn("❌ ProtectedRoute: Status is REJECTED, blocking access");
        toast.error("Đơn đăng ký của bạn đã bị từ chối. Vui lòng kiểm tra và gửi lại.");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("🔒 ProtectedRoute: Error checking registration status:", error);
      
      // ✅ Fallback to cached status on error
      const cachedStatus = localStorage.getItem("registrationStatus");
      if (cachedStatus === "APPROVED") {
        console.log("✅ ProtectedRoute: API error, but using cached APPROVED status");
        setIsApproved(true);
      }
      
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Kiểm tra token - nếu không có token thì redirect về login
  const token = localStorage.getItem("accessToken"); // ✅ Đổi từ "token" thành "accessToken"
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra status - nếu không approved thì redirect về profile
  if (!isApproved) {
    return <Navigate to="/partner-profile" replace />;
  }

  return children;
}
