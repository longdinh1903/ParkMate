import axiosClient from "../api/axiosClient";

const parkingLotApi = {
  register: (data) => axiosClient.post(`/api/v1/parking-service/lots`, data),
  
  // Dùng chung cho cả Admin và Partner
  // - Admin: gọi getAll({ page, size, sortBy, sortOrder }) → lấy tổng danh sách
  // - Partner: gọi getAll({ page, size, sortBy, sortOrder, ownedByMe: true }) → lấy danh sách riêng
  getAll: (options = {}) => {
    const { page = 0, size = 10, sortBy = "id", sortOrder = "DESC", ownedByMe, ...rest } = options;
    
    const params = {
      page,
      size,
      sortBy,
      sortOrder,
    };

    // ✅ Nếu có ownedByMe = true thì gửi TRỰC TIẾP như query param (không dùng JSON string)
    // Vì backend có thể cần ownedByMe=true như một query param riêng biệt
    if (ownedByMe === true) {
      params.ownedByMe = true;
    }
    // Nếu có các filter khác (admin dùng) thì gửi bình thường
    else if (Object.keys(rest).length > 0) {
      Object.assign(params, rest);
    }

    return axiosClient.get("/api/v1/parking-service/lots", { params });
  },

  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/lots/${id}`, data),
  create: (partnerId, data) =>
    axiosClient.post(`/api/v1/parking-service/lots/${partnerId}`, data),
  getById: (id) => axiosClient.get(`/api/v1/parking-service/lots/${id}`),
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
  // Count lots (no params expected by backend in current swagger)
  count: (params) => axiosClient.get(`/api/v1/parking-service/lots/count`, { params }),
};

export default parkingLotApi;
