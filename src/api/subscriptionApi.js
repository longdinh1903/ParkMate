import axiosClient from "./axiosClient";

const subscriptionApi = {
  // Get all subscription packages with pagination and filters
  getAll: (queryParams = {}, filterParams = {}) => {
    const url = "/api/v1/parking-service/subscriptions";
    // Combine all params into one object for GET request
    const allParams = {
      ...queryParams,
      ...filterParams
    };
    console.log("All params being sent:", allParams);
    return axiosClient.get(url, { params: allParams });
  },

  // Get subscription package by ID
  getById: (id) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.get(url);
  },

  // Create new subscription package
  create: (data) => {
    const url = "/api/v1/parking-service/subscriptions";
    return axiosClient.post(url, data);
  },

  // Update subscription package
  update: (id, data) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.put(url, data);
  },

  // Delete subscription package
  delete: (id) => {
    const url = `/api/v1/parking-service/subscriptions/${id}`;
    return axiosClient.delete(url);
  },

  // Get subscribers (users who purchased this subscription package at specific parking lot)
  // API expects subscriptionPackageId and parkingLotId as direct query parameters
  getSubscribers: (subscriptionPackageId, parkingLotId, queryParams = {}) => {
    const url = `/api/v1/user-service/user-subscriptions`;
    return axiosClient.get(url, { 
      params: {
        page: queryParams.page || 0,
        size: queryParams.size || 10,
        sortBy: queryParams.sortBy || "createdAt",
        sortOrder: queryParams.sortOrder || "asc",
        subscriptionPackageId: subscriptionPackageId,
        parkingLotId: parkingLotId
      }
    });
  },

  // Get all user subscriptions for partner's parking lots
  // This will get all users who subscribed to any parking lot owned by the current partner
  getAllUserSubscriptions: (queryParams = {}) => {
    const url = `/api/v1/user-service/user-subscriptions`;
    const params = {
      page: queryParams.page || 0,
      size: queryParams.size || 10,
      sortBy: queryParams.sortBy || "createdAt",
      sortOrder: queryParams.sortOrder || "asc",
      ownedByMe: true, // Filter by partner's parking lots
    };
    
    // Add optional filters
    if (queryParams.status) params.status = queryParams.status;
    if (queryParams.vehicleType) params.vehicleType = queryParams.vehicleType;
    if (queryParams.subscriptionPackageId) params.subscriptionPackageId = queryParams.subscriptionPackageId;
    if (queryParams.parkingLotId) params.parkingLotId = queryParams.parkingLotId;
    
    console.log("getAllUserSubscriptions params:", params);
    return axiosClient.get(url, { params });
  },

  // Get user subscription by ID - for viewing full details
  getUserSubscriptionById: (id) => {
    const url = `/api/v1/user-service/user-subscriptions/${id}`;
    return axiosClient.get(url);
  },
};

export default subscriptionApi;
