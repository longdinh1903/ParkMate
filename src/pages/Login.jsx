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
    if (!email) newErrors.email = "Email là bắt buộc";
    if (!password) newErrors.password = "Mật khẩu là bắt buộc";

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

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
      {/* Light Background with Subtle Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md mx-4 z-10">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            {/* Parking Icon */}
            <div className="relative mb-4">
              <img 
                src="/IconWeb.png" 
                alt="ParkMate Logo" 
                className="w-20 h-20 rounded-2xl shadow-lg transform transition-transform hover:scale-105 object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Park<span className="text-indigo-600">Mate</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">Đối tác bãi đỗ xe thông minh</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <i className="ri-mail-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Địa chỉ email"
                className={`w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                    : "border-gray-200 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field with Toggle */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <i className="ri-lock-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className={`w-full pl-11 pr-12 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                    : "border-gray-200 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors z-10"
              >
                <i className={`${showPassword ? "ri-eye-off-line" : "ri-eye-line"} text-lg`}></i>
              </button>
              {errors.password && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border border-gray-300 rounded-md bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all duration-200 flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                  </div>
                </div>
                <span className="group-hover:text-gray-900 transition-colors">Ghi nhớ tôi</span>
              </label>
              <a 
                href="#" 
                className="text-indigo-600 hover:text-indigo-700 transition-colors hover:underline underline-offset-2"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <i className="ri-login-box-line"></i>
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center mt-6 text-gray-500">
            Chưa có tài khoản?{" "}
            <Link 
              to="/register" 
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors hover:underline underline-offset-2"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-indigo-100 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
