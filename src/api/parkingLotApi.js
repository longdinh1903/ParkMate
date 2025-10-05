import axios from "axios";

const parkingLotApi = {
  register: (data) => axios.post("/parkinglots", data),

};

export default parkingLotApi;
