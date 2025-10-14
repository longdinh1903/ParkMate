import axiosClient from "../api/axiosClient";

const parkingLotApi = {
  register: (data) =>
    axiosClient.post(`/api/v1/parking-service/lots`, data),
  getAll: (params) =>
    axiosClient.get("/api/v1/parking-service/lots", { params }),
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/lots/${id}`, data),
  create: (partnerId, data) =>
    axiosClient.post(`/api/v1/parking-service/lots/${partnerId}`, data),
  getById: (id) =>
    axiosClient.get(`/api/v1/parking-service/lots/${id}`),
  deleteRegister: (id) =>
    axiosClient.delete(`/api/v1/parking-service/lots/${id}`),

  importExcel: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post(`/api/v1/parking-service/lots/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ Export Excel
  exportExcel: () =>
    axiosClient.get(`/api/v1/parking-service/lots/export`, {
      responseType: "blob", // nhận file binary
    }),
};


export default parkingLotApi;
