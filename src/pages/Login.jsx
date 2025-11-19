import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authApi from "../api/authApi";
import partnerApi from "../api/partnerApi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  // ✅ Hàm decode JWT token để lấy partnerId
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("❌ Error decoding token:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const toastId = toast.loading("🔐 Đang đăng nhập...");

      try {
        const res = await authApi.login({ email, password });
        console.log("✅ Login success:", res.data);

        // ✅ Clear old data trước khi lưu data mới
        localStorage.removeItem("registrationId");
        localStorage.removeItem("registrationStatus");
        localStorage.removeItem("partnerId");

        // ✅ Lưu token
        const accessToken = res.data.data?.authResponse?.accessToken;
        const refreshToken = res.data.data?.authResponse?.refreshToken;
        
        let partnerId = null; // Declare outside if block

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("userEmail", email); // Save email for display
          
          // ✅ Decode token để lấy partnerId
          const decoded = decodeToken(accessToken);
          console.log("🔍 Decoded token:", decoded);
          
          partnerId = decoded?.partnerId || decoded?.partner_id || decoded?.sub;
          console.log("🔍 Extracted partnerId:", partnerId);
          
          if (partnerId) {
            localStorage.setItem("partnerId", partnerId);
            console.log("✅ Saved partnerId to localStorage:", partnerId);
          } else {
            console.warn("⚠️ No partnerId found in token");
          }
        }
        
        if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

        toast.dismiss(toastId);
        toast.success("🎉 Đăng nhập thành công!");

        // ✅ Check partner registration status
        try {
          // Get registration list and filter by email
          const registrationRes = await partnerApi.getRequests({});
          console.log("📦 Full registration response:", registrationRes);
          
          // Handle multiple possible response structures
          let registrationsList = [];
          if (registrationRes?.data?.content) {
            registrationsList = registrationRes.data.content;
          } else if (registrationRes?.data?.data?.content) {
            registrationsList = registrationRes.data.data.content;
          } else if (Array.isArray(registrationRes?.data?.data)) {
            registrationsList = registrationRes.data.data;
          } else if (Array.isArray(registrationRes?.data)) {
            registrationsList = registrationRes.data;
          }
          
          console.log("📋 Extracted registrations list:", registrationsList);
          console.log("🔍 Looking for email:", email);
          
          // ✅ Debug: Log all emails to find the correct field name
          if (Array.isArray(registrationsList) && registrationsList.length > 0) {
            console.log("📧 Sample registration object:", registrationsList[0]);
            console.log("📧 All partner emails to check:");
            registrationsList.forEach((reg, idx) => {
              console.log(`  [${idx}] companyEmail: "${reg.companyEmail}", contactPersonEmail: "${reg.contactPersonEmail}"`);
            });
          }
          
          // Find registration by email - check both companyEmail and contactPersonEmail
          const registration = registrationsList.find(
            (req) => req.companyEmail === email || req.contactPersonEmail === email
          );
          
          console.log("📋 Found user registration:", registration);
          
          if (registration) {
            const status = registration.status;
            console.log("✅ Registration status:", status);
            
            // ✅ Lưu vào localStorage ngay lập tức
            localStorage.setItem("registrationId", registration.id);
            localStorage.setItem("registrationStatus", status);
            
            console.log("💾 Saved to localStorage:", {
              registrationId: registration.id,
              registrationStatus: status
            });
            
            if (status === "REJECTED") {
              // Redirect to profile page to edit registration
              toast.info("⚠️ Đơn đăng ký của bạn đã bị từ chối. Vui lòng cập nhật lại thông tin.");
              navigate("/partner-profile");
              return;
            } else if (status === "PENDING") {
              toast.info("⏳ Đơn đăng ký của bạn đang được xét duyệt.");
              navigate("/partner-profile");
              return;
            } else if (status === "APPROVED") {
              // Navigate to home for approved users
              console.log("✅ Status is APPROVED, navigating to /dashboard");
              navigate("/dashboard");
              return;
            }
          } else {
            console.warn("⚠️ No registration found for this email");
            // No registration found - might be first login, go to profile
            navigate("/partner-profile");
            return;
          }
        } catch (error) {
          console.warn("⚠️ Could not fetch registration status:", error);
          console.error("Error details:", error.response?.data);
          // If error checking status, go to profile to be safe
          navigate("/partner-profile");
          return; // ✅ Thêm return để dừng execution
        }
      } catch (err) {
        console.error("❌ Login failed:", err);
        toast.dismiss(toastId);

        const errorMessage =
          err.response?.data?.message ||
          "❌ Email hoặc mật khẩu không đúng. Vui lòng thử lại!";
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-indigo-100">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-3">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <h2 className="text-xl font-semibold">Parking Partner</h2>
          <p className="text-sm text-gray-500">Partner Login</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-indigo-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 focus:ring-red-400"
                  : "focus:ring-indigo-400"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" /> Remember me
            </label>
            <a href="#" className="text-indigo-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Log in
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
