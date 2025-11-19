import axiosClient from "./axiosClient";

const operationalFeeApi = {
  // Get all operational fee configs with pagination and filters
  getAll: (params) => {
    const url = "/api/v1/payment-service/operational-fee-config";
    return axiosClient.get(url, { params });
  },

  // Get single operational fee config by ID
  getById: (id) => {
    const url = `/api/v1/payment-service/operational-fee-config/${id}`;
    return axiosClient.get(url);
  },

  // Create new operational fee config
  create: (data) => {
    const url = "/api/v1/payment-service/operational-fee-config";
    return axiosClient.post(url, data);
  },

  // Update operational fee config by ID
  update: (id, data) => {
    const url = `/api/v1/payment-service/operational-fee-config/${id}`;
    return axiosClient.put(url, data);
  },

  // Delete operational fee config by ID
  delete: (id) => {
    const url = `/api/v1/payment-service/operational-fee-config/${id}`;
    return axiosClient.delete(url);
  },
};

export default operationalFeeApi;
