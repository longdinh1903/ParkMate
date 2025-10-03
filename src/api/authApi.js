import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/v1/user-service/auth/login", data),
};

export default authApi;
