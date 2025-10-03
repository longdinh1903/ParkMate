import axiosClient from "./axiosClient";

const adminApi = {
  login: (data) => axiosClient.post("/auth/login", data),
};

export default adminApi;
