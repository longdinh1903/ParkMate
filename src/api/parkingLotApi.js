// import axios from "axios";
import axiosClient from "../api/axiosClient";

const parkingLotApi = {
  register: (partnerId, data) =>
    axiosClient.post(`/api/v1/parking-service/lots/${partnerId}`, data),
  getAll: (params) =>
    axiosClient.get("/api/v1/parking-service/lots", { params }),
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/lots/${id}`, data),
  create: (partnerId, data) =>
    axiosClient.post(`/api/v1/parking-service/lots/${partnerId}`, data),
};

export default parkingLotApi;
