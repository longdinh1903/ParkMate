import axiosClient from "./axiosClient";

const reservationApi = {
  // Get all reservations with query params
  getAll: (params) => {
    const url = "/api/v1/user-service/reservations";
    return axiosClient.get(url, { params });
  },

  // Get reservation by ID
  getById: (id) => {
    const url = `/api/v1/user-service/reservations/${id}`;
    return axiosClient.get(url);
  },

  // Get reservations by parking lot ID
  getByLotId: (lotId, params) => {
    const url = "/api/v1/user-service/reservations";
    return axiosClient.get(url, { 
      params: {
        ...params,
        parkingLotId: lotId
      }
    });
  },
};

export default reservationApi;
