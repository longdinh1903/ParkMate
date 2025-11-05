import axiosClient from "./axiosClient";

const subscriptionApi = {
  // Get all subscription packages with pagination and filters
  getAll: (queryParams = {}, filterParams = {}) => {
    const url = "/api/v1/parking-service/subscriptions";
    // Combine all params into one object for GET request
    const allParams = {
      ...queryParams,
      ...filterParams
    };
    console.log("All params being sent:", allParams);
    return axiosClient.get(url, { params: allParams });
  },

  // Get subscription package by ID
  getById: (id) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.get(url);
  },

  // Create new subscription package
  create: (data) => {
    const url = "/api/v1/parking-service/subscriptions";
    return axiosClient.post(url, data);
  },

  // Update subscription package
  update: (id, data) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.put(url, data);
  },

  // Delete subscription package
  delete: (id) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.delete(url);
  },
};

export default subscriptionApi;
