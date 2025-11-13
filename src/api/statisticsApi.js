import axiosClient from "./axiosClient";

const statisticsApi = {
  // Get parking lot statistics
  getParkingLotStats: (lotId, params) => {
    const url = `/api/v1/parking-service/statistics/${lotId}`;
    return axiosClient.get(url, { params });
  },
};

export default statisticsApi;
