import axios from "axios";

const authApi = {
  resendEmail: (email) =>
    axios.put("/api/v1/user-service/auth/resend", null, { params: { email } }),

  verifyOtp: (verifyCode) =>
    axios.put("/api/v1/user-service/auth/verify", null, { params: { verifyCode } }),

  login: (data) => axios.post("/api/v1/user-service/auth/login", data),
};

export default authApi;
