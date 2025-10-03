import axiosClient from "./axiosClient";

const partnerApi = {
  registerPartner: (data) =>
    axiosClient.post("/v1/user-service/partner-registrations", data),
  getAll: () => axiosClient.get("/admin/partners"), // ✅ đổi endpoint đúng backend
  getById: (id) => axiosClient.get(`/admin/partners/${id}`),
  approve: (id) => axiosClient.post(`/admin/partners/${id}/approve`),
  reject: (id) => axiosClient.post(`/admin/partners/${id}/reject`),
};

export default partnerApi;
