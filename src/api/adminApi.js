import axiosClient from "../api/axiosClient";
import axios from 'axios';

const adminApi = {
  login: (data) => axios.post("/api/v1/user-service/auth/login", data),

  getAllUser: (params) =>
    axiosClient.get("/api/v1/user-service/users", { params }),
  // Count users (optional filters via params)
  countUsers: (params) =>
    axiosClient.get("/api/v1/user-service/users/count", { params }),
  updateUser: (id, data) =>
    axiosClient.put(`/api/v1/user-service/users/${id}`, data),
  getUserById: (id) => axiosClient.get(`/api/v1/user-service/users/${id}`),
  deleteUser: (id) => axiosClient.delete(`/api/v1/user-service/users/${id}`),

  // ✅ EXPORT USERS TO EXCEL
  exportUsers: (params) =>
    axiosClient.get(`/api/v1/user-service/users/export`, {
      params,
      responseType: "blob", // để nhận file Excel
    }),

  // ✅ IMPORT USERS FROM EXCEL
  importUsers: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post(`/api/v1/user-service/users/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
export default adminApi;
