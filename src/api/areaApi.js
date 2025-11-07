import axiosClient from "../api/axiosClient";

const areaApi = {
  // POST /api/v1/parking-service/areas/{floorId}
  create: (floorId, data) =>
    axiosClient.post(`/api/v1/parking-service/areas/${floorId}`, data),

  // GET /api/v1/parking-service/areas (with query params)
  getAll: (params) =>
    axiosClient.get(`/api/v1/parking-service/areas`, { params }),

  // GET areas by floor ID
  getByFloorId: (floorId) =>
    axiosClient.get(`/api/v1/parking-service/areas`, {
      params: { floorId },
    }),

  // GET /api/v1/parking-service/areas/{id}
  getById: (id) =>
    axiosClient.get(`/api/v1/parking-service/areas/${id}`),

  // PUT /api/v1/parking-service/areas/{id}
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/areas/${id}`, data),

  // DELETE /api/v1/parking-service/areas/{id}
  delete: (id) =>
    axiosClient.delete(`/api/v1/parking-service/areas/${id}`),
};

export default areaApi;
