import axios from "axios";

const partnerApi = {
  registerPartner: (data) =>
    axios.post("/api/v1/user-service/partner-registrations", data),
  getRequests: (params) =>
    axios.get("/api/v1/user-service/partner-registrations", { params }),

  getById: (id) =>
    axios.get(`/api/v1/user-service/partner-registrations/${id}`),

  updateStatus: (id, payload) =>
    axios.put(`/api/v1/user-service/partner-registrations/${id}`, payload),
};

export default partnerApi;
