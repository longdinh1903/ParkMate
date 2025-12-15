import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminApi from "../api/adminApi";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!email) newErrors.email = "Vui lòng nhập email";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const res = await adminApi.login({ email, password });
        console.log("✅ Login success:", res.data);

        const accessToken = res.data?.data?.authResponse?.accessToken;
        const refreshToken = res.data?.data?.authResponse?.refreshToken;

        // decode JWT to check role/authorities
        const decodeJwt = (t) => {
          try {
            const seg = (t || "").split('.');
            if (seg.length < 2) return null;
            const payload = seg[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
            return json;
          } catch {
            return null;
          }
        };

        const payload = decodeJwt(accessToken);
        const rolesFromToken = [];
        if (payload) {
          if (Array.isArray(payload.roles)) rolesFromToken.push(...payload.roles);
          if (Array.isArray(payload.authorities)) rolesFromToken.push(...payload.authorities);
          if (typeof payload.role === 'string') rolesFromToken.push(payload.role);
          if (typeof payload.authority === 'string') rolesFromToken.push(payload.authority);
          if (typeof payload.scope === 'string') rolesFromToken.push(...payload.scope.split(' '));
        }

        const isAdmin = rolesFromToken.map(r => String(r).toLowerCase()).some(r => r.includes('admin'));

        if (!isAdmin) {
          setErrors({ email: 'Tài khoản này không phải là admin' });
          console.warn('Non-admin attempted admin login. Token payload:', payload);
          setIsLoading(false);
          return;
        }

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem('role', JSON.stringify(rolesFromToken));
          console.log("✅ Admin tokens saved to localStorage");
        } else {
          console.warn("⚠️ No token found in response:", res.data);
        }

        navigate("/admin/partners");
      } catch (error) {
        console.error("❌ Login failed:", error);
        setErrors({ email: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
      {/* Light Background with Subtle Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md mx-4 z-10">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
            {/* Admin Icon */}
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                <i className="ri-admin-fill text-4xl text-white"></i>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Park<span className="text-orange-500">Mate</span>
            </h1>
            <p className="text-gray-500 text-sm mt-2">Đăng nhập hệ thống quản trị</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <i className="ri-mail-line text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300"></i>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Địa chỉ email"
                className={`w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                    : "border-gray-200 focus:ring-orange-500/50 focus:border-orange-500 hover:border-gray-300"
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
                <i className="ri-lock-line text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300"></i>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className={`w-full pl-11 pr-12 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                    : "border-gray-200 focus:ring-orange-500/50 focus:border-orange-500 hover:border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors z-10"
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
                  <div className="w-5 h-5 border border-gray-300 rounded-md bg-white peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all duration-200 flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                  </div>
                </div>
                <span className="group-hover:text-gray-900 transition-colors">Ghi nhớ tôi</span>
              </label>
              <a 
                href="#" 
                className="text-orange-500 hover:text-orange-600 transition-colors hover:underline underline-offset-2"
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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

          {/* Admin Info */}
          <p className="text-center mt-6 text-gray-500 text-sm">
            <i className="ri-shield-check-line mr-1"></i>
            Khu vực dành riêng cho quản trị viên
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-orange-100 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
