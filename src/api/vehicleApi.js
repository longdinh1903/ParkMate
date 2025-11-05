import axiosClient from "./axiosClient";

const vehicleApi = {
  // Get vehicle by ID - for viewing vehicle details
  getById: (id) => {
    const url = `/api/v1/user-service/vehicle/${id}`;
    return axiosClient.get(url);
  },
};

export default vehicleApi;
