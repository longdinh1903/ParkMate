import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import authApi from "../api/authApi";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Step tracking: 1 = enter email, 2 = enter code + new password
  const [step, setStep] = useState(1);
  
  // Form states
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    let newErrors = {};
    if (!email) newErrors.email = "Email là bắt buộc";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email không hợp lệ";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      const toastId = toast.loading("📧 Đang gửi mã xác nhận...");
      
      try {
        await authApi.forgotPassword(email);
        toast.dismiss(toastId);
        toast.success("✅ Mã đặt lại mật khẩu đã được gửi đến email của bạn!");
        setStep(2);
      } catch (err) {
        console.error("❌ Forgot password error:", err);
        toast.dismiss(toastId);
        const errorMessage = err.response?.data?.message || "Không thể gửi mã xác nhận. Vui lòng thử lại!";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Step 2: Reset password with code
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    let newErrors = {};
    if (!resetCode) newErrors.resetCode = "Mã xác nhận là bắt buộc";
    if (!newPassword) newErrors.newPassword = "Mật khẩu mới là bắt buộc";
    else if (newPassword.length < 8) newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    if (!confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "Mật khẩu không khớp";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      const toastId = toast.loading("🔐 Đang đặt lại mật khẩu...");
      
      try {
        await authApi.resetPassword({ email, resetCode, newPassword });
        toast.dismiss(toastId);
        toast.success("🎉 Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } catch (err) {
        console.error("❌ Reset password error:", err);
        toast.dismiss(toastId);
        const errorMessage = err.response?.data?.message || "Không thể đặt lại mật khẩu. Vui lòng thử lại!";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md mx-4 z-10">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 transform transition-all duration-500 hover:shadow-2xl">
          {/* Logo & Branding */}
          <div className="flex flex-col items-center mb-8">
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
            <p className="text-gray-500 text-sm mt-2">
              {step === 1 ? "Đặt lại mật khẩu của bạn" : "Nhập mã xác nhận"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              1
            </div>
            <div className={`w-12 h-1 rounded-full transition-all ${
              step >= 2 ? "bg-indigo-600" : "bg-gray-200"
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              2
            </div>
          </div>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleRequestCode}>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <i className="ri-mail-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn"
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

              <p className="text-sm text-gray-500 text-center">
                Chúng tôi sẽ gửi mã xác nhận đến email của bạn. Mã có hiệu lực trong 15 phút.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Gửi mã xác nhận
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Enter Code & New Password */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              {/* Email Display (Read-only) */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <i className="ri-mail-check-line text-green-500"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-11 pr-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Reset Code */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <i className="ri-key-2-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
                </div>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Nhập mã xác nhận (6 chữ số)"
                  autoComplete="off"
                  className={`w-full pl-11 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                    errors.resetCode
                      ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                      : "border-gray-200 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-gray-300"
                  }`}
                />
                {errors.resetCode && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {errors.resetCode}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <i className="ri-lock-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới"
                  className={`w-full pl-11 pr-12 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                    errors.newPassword
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
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {errors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <i className="ri-lock-password-line text-gray-400 group-focus-within:text-indigo-600 transition-colors duration-300"></i>
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới"
                  className={`w-full pl-11 pr-12 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-300 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
                      : "border-gray-200 focus:ring-indigo-500/50 focus:border-indigo-500 hover:border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors z-10"
                >
                  <i className={`${showConfirmPassword ? "ri-eye-off-line" : "ri-eye-line"} text-lg`}></i>
                </button>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                    <i className="ri-error-warning-line"></i>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line"></i>
                    Đặt lại mật khẩu
                  </>
                )}
              </button>

              {/* Resend Code */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <i className="ri-refresh-line mr-1"></i>
                Gửi lại mã xác nhận
              </button>
            </form>
          )}

          {/* Back to Login */}
          <p className="text-center mt-6 text-gray-500">
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors hover:underline underline-offset-2 flex items-center justify-center gap-1"
            >
              <i className="ri-arrow-left-line"></i>
              Quay lại đăng nhập
            </Link>
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-indigo-100 rounded-full blur-xl"></div>
      </div>
    </div>
  );
}
