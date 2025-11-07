import axiosClient from "../api/axiosClient";

const floorApi = {
  // POST /api/v1/parking-service/floors/{parkingLotId}
  create: (parkingLotId, data) =>
    axiosClient.post(`/api/v1/parking-service/floors/${parkingLotId}`, data),

  // GET /api/v1/parking-service/floors (with query params)
  getAll: (params) =>
    axiosClient.get(`/api/v1/parking-service/floors`, { params }),

  // GET floors by parking lot ID
  getByLotId: (parkingLotId) =>
    axiosClient.get(`/api/v1/parking-service/floors`, { 
      params: { parkingLotId } 
    }),

  // GET /api/v1/parking-service/floors/{id}
  getById: (id) =>
    axiosClient.get(`/api/v1/parking-service/floors/${id}`),

  // PUT /api/v1/parking-service/floors/{id}
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/floors/${id}`, data),

  // DELETE /api/v1/parking-service/floors/{id}
  delete: (id) =>
    axiosClient.delete(`/api/v1/parking-service/floors/${id}`),
};

export default floorApi;
