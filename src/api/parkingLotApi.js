import axiosClient from "./axiosClient";

const parkingLotApi = {
  register: (data) => axiosClient.post("/parkinglots", data),
  getAll: () => axiosClient.get("/parkinglots"),
};

export default parkingLotApi;
