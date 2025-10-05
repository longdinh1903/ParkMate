import axios from "axios";
const adminApi = {
  login: (data) => axios.post("/api/v1/user-service/auth/login", data),
};

export default adminApi;
