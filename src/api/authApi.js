import axiosClient from "../api/axiosClient";
// import axios from 'axios';


const authApi = {
  resendEmail: (email) =>
    axiosClient.put("/api/v1/user-service/auth/resend", null, { params: { email } }),

  verifyOtp: (verifyCode) =>
    axiosClient.put("/api/v1/user-service/auth/verify", null, { params: { verifyCode } }),

  login: (data) => axiosClient.post("/api/v1/user-service/auth/login", data),

  logout: (refreshToken) =>
    axiosClient.post("/api/v1/user-service/auth/logout", { refreshToken }),
};

export default authApi;
