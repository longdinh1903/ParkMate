import axiosClient from "./axiosClient";

const deviceApi = {
  // Get all devices with pagination
  getAll: (params) => {
    return axiosClient.get("/api/v1/parking-service/devices", { params });
  },

  // Get device by ID
  getById: (id) => {
    return axiosClient.get(`/api/v1/parking-service/devices/${id}`);
  },

  // Get all available device types
  getTypes: () => {
    return axiosClient.get("/api/v1/parking-service/devices/types");
  },

  // Count total devices
  count: (params) => {
    return axiosClient.get("/api/v1/parking-service/devices/count", { params });
  },

  // Register a new device for a parking lot
  create: (lotId, data) => {
    return axiosClient.post(`/api/v1/parking-service/devices/lot/${lotId}`, data);
  },

  // Update device information
  update: (id, data) => {
    return axiosClient.put(`/api/v1/parking-service/devices/${id}`, data);
  },

  // Delete a device
  delete: (id) => {
    return axiosClient.delete(`/api/v1/parking-service/devices/${id}`);
  },
};

export default deviceApi;
