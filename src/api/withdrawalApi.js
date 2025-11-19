import axiosClient from "./axiosClient";
import axios from "axios";

const withdrawalApi = {
  // Get all withdrawal requests
  getAll: (params) => {
    const url = "/api/v1/payment-service/partner/withdrawals";
    return axiosClient.get(url, { params });
  },

  // Get single withdrawal by ID
  getById: (id) => {
    const url = `/api/v1/payment-service/partner/withdrawals/${id}`;
    return axiosClient.get(url);
  },

  // Get withdrawal periods for a parking lot
  getPeriods: (params) => {
    const url = "/api/v1/payment-service/partner/withdrawal-periods";
    return axiosClient.get(url, { params });
  },

  // Get single period by ID
  getPeriodById: (id) => {
    const url = `/api/v1/payment-service/partner/withdrawal-periods/${id}`;
    return axiosClient.get(url);
  },

  // Create withdrawal request
  createRequest: (data) => {
    const url = "/api/v1/payment-service/partner/withdrawals/request";
    return axiosClient.post(url, data);
  },

  // Delete withdrawal request
  delete: (id) => {
    const url = `/api/v1/payment-service/partner/withdrawals/${id}`;
    return axiosClient.delete(url);
  },

  // Get list of Vietnamese banks from VietQR API
  getBanks: async () => {
    try {
      const response = await axios.get("https://api.vietqr.io/v2/banks");
      return response;
    } catch (error) {
      console.error("Error fetching banks:", error);
      throw error;
    }
  },
};

export default withdrawalApi;
