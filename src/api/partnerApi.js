import axiosClient from "../api/axiosClient";

const partnerApi = {
  registerPartner: (data) =>
    axiosClient.post("/api/v1/user-service/partner-registrations", data),

  uploadBusinessLicense: (entityId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosClient.post(
    `/api/v1/user-service/upload/image/entity?entityId=${entityId}&imageType=PARTNER_BUSINESS_LICENSE`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
},

  getRequests: (params) =>
    axiosClient.get("/api/v1/user-service/partner-registrations", { params }),

  getById: (id) =>
    axiosClient.get(`/api/v1/user-service/partner-registrations/${id}`),

  updateStatus: (id, payload) =>
    axiosClient.put(
      `/api/v1/user-service/partner-registrations/${id}`,
      payload
    ),

  // Update partner registration (for resubmit after rejection)
  updateRegistration: (id, data) =>
    axiosClient.put(
      `/api/v1/user-service/partner-registrations/${id}`,
      data
    ),

  deleteRegister: (id) => axiosClient.delete(`/api/v1/user-service/partner-registrations/${id}`),

  delete: (id) => axiosClient.delete(`/api/v1/user-service/partners/${id}`),

  getAll: (params) =>
    axiosClient.get("/api/v1/user-service/partners", { params }),
  // Count partners (returns total number matching optional filters)
  count: (params) =>
    axiosClient.get("/api/v1/user-service/partners/count", { params }),
  create: (data) => axiosClient.post("/api/v1/user-service/partners", data),

  update: (id, data) =>
    axiosClient.put(`/api/v1/user-service/partners/${id}`, data),

  getByIdPartner: (id) =>
    axiosClient.get(`/api/v1/user-service/partners/${id}`),

  // ✅ Export Excel
  exportPartners: (filters = {}) =>
    axiosClient.get("/api/v1/user-service/partners/export", {
      params: filters,
      responseType: "blob", // để nhận file Excel
    }),

  // ✅ Import Excel
  importPartners: (formData) =>
    axiosClient.post("/api/v1/user-service/partners/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default partnerApi;
