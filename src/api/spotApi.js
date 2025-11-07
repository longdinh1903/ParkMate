import axiosClient from "../api/axiosClient";

const spotApi = {
  // POST /api/v1/parking-service/spots/{areaId}
  create: (areaId, data) =>
    axiosClient.post(`/api/v1/parking-service/spots/${areaId}`, data),

  // GET /api/v1/parking-service/spots (with query params)
  getAll: (params) =>
    axiosClient.get(`/api/v1/parking-service/spots`, { params }),

  // GET spots by area ID
  getByAreaId: (areaId) =>
    axiosClient.get(`/api/v1/parking-service/spots`, {
      params: { areaId },
    }),

  // GET /api/v1/parking-service/spots/{id}
  getById: (id) =>
    axiosClient.get(`/api/v1/parking-service/spots/${id}`),

  // PUT /api/v1/parking-service/spots/{id}
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/spots/${id}`, data),

  // DELETE /api/v1/parking-service/spots/{id}
  delete: (id) =>
    axiosClient.delete(`/api/v1/parking-service/spots/${id}`),
};

export default spotApi;
