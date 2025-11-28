import axiosClient from "./axiosClient";

const statisticsApi = {
  // Get parking lot statistics
  getParkingLotStats: (lotId, params) => {
    const url = `/api/v1/parking-service/statistics/${lotId}`;
    return axiosClient.get(url, { params });
  },

  // Get platform-wide statistics (Admin Dashboard)
  getPlatformStats: (params) => {
    const url = `/api/v1/parking-service/statistics/platform`;
    return axiosClient.get(url, { params });
  },
};

export default statisticsApi;
