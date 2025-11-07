import axiosClient from "./axiosClient";

const sessionApi = {
  // Get all parking sessions with filters
  getAllSessions: (queryParams) => {
    return axiosClient.get("/api/v1/parking-service/sessions", { 
      params: queryParams 
    });
  },

  // Get session by ID
  getById: (id) => {
    return axiosClient.get(`/api/v1/parking-service/sessions/${id}`);
  },

  // Get sessions by parking lot
  getByLotId: (lotId, queryParams) => {
    return axiosClient.get(`/api/v1/parking-service/sessions/lot/${lotId}`, {
      params: queryParams
    });
  },
};

export default sessionApi;
