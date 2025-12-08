import axiosClient from "./axiosClient";

const deviceFeeApi = {
  // Get all device fee configurations with pagination and filters
  getAll: (params) => {
    return axiosClient.get("/api/v1/payment-service/operational-fee-configs", { params });
  },

  // Get device fee configuration by ID
  getById: (id) => {
    return axiosClient.get(`/api/v1/payment-service/operational-fee-configs/${id}`);
  },

  // Create new device fee configuration
  create: (data) => {
    return axiosClient.post("/api/v1/payment-service/operational-fee-configs", data);
  },

  // Update device fee configuration by ID
  update: (id, data) => {
    return axiosClient.put(`/api/v1/payment-service/operational-fee-configs/${id}`, data);
  },

  // Delete device fee configuration by ID
  delete: (id) => {
    return axiosClient.delete(`/api/v1/payment-service/operational-fee-configs/${id}`);
  },
};

export default deviceFeeApi;
