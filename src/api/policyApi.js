import axiosClient from "./axiosClient";

const policyApi = {
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/policies/${id}`, data),
};

export default policyApi;
