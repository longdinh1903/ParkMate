import axios from "axios";
import axiosClient from "../api/axiosClient";

const adminApi = {
  login: (data) => axios.post("/api/v1/user-service/auth/login", data),

    getAllUser: (params) =>
    axiosClient.get("/api/v1/user-service/users", { params }),
};


export default adminApi;
