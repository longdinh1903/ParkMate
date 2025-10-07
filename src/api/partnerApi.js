// import axios from "axios";
import axiosClient from "../api/axiosClient";

const partnerApi = {
  registerPartner: (data) =>
    axiosClient.post("/api/v1/user-service/partner-registrations", data),

  getRequests: (params) =>
    axiosClient.get("/api/v1/user-service/partner-registrations", { params }),

  getAll: (params) =>
    axiosClient.get("/api/v1/user-service/partners", { params }),

  getById: (id) =>
    axiosClient.get(`/api/v1/user-service/partner-registrations/${id}`),

  updateStatus: (id, payload) =>
    axiosClient.put(`/api/v1/user-service/partner-registrations/${id}`, payload),

  delete: (id) => axiosClient.delete(`/api/v1/user-service/partners/${id}`),

  create: (data) =>
    axiosClient.post("/api/v1/user-service/partners", data),

  update: (id, data) => axiosClient.put(`/api/v1/user-service/partners/${id}`, data),

  getByIdPartner: (id) => axiosClient.get(`/api/v1/user-service/partners/${id}`),

};


export default partnerApi;
