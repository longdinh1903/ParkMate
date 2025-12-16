import axiosClient from "../api/axiosClient";
import axios from "axios";

const authApi = {
  resendEmail: (email) =>
    axiosClient.put("/api/v1/user-service/auth/resend", null, { params: { email } }),

  verifyOtp: (verifyCode) =>
    axiosClient.put("/api/v1/user-service/auth/verify", null, { params: { verifyCode } }),

  login: (data) => axiosClient.post("/api/v1/user-service/auth/login", data),

  logout: (refreshToken) =>
    axiosClient.post("/api/v1/user-service/auth/logout", { refreshToken }),

  // ✅ Refresh token - dùng axios trực tiếp để tránh vòng lặp interceptor
  refresh: (refreshToken) =>
    axios.post(
      `${import.meta.env.VITE_API_URL || "https://avokadu.com"}/api/v1/user-service/auth/refresh`,
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    ),

  // ✅ Forgot Password - Send reset code to email
  forgotPassword: (email) =>
    axiosClient.post("/api/v1/user-service/auth/forgot-password", { email }),

  // ✅ Reset Password - Verify code and set new password
  resetPassword: ({ email, resetCode, newPassword }) =>
    axiosClient.post("/api/v1/user-service/auth/reset-password", {
      email,
      resetCode,
      newPassword,
    }),
};

export default authApi;

