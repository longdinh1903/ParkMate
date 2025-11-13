import axiosClient from "./axiosClient";

const pricingRuleApi = {
  getById: (id) =>
    axiosClient.get(`/api/v1/parking-service/pricing-rules/${id}`),
  update: (id, data) =>
    axiosClient.put(`/api/v1/parking-service/pricing-rules/${id}`, data),
};

export default pricingRuleApi;
