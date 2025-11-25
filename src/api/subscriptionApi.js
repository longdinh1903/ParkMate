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
  // REQUIRES: ownedByMe=false + parkingLotId + subscriptionPackageId
  getAllUserSubscriptions: (queryParams = {}) => {
    const url = `/api/v1/user-service/user-subscriptions`;
    
    // Return empty if missing REQUIRED params
    if (!queryParams.parkingLotId || !queryParams.subscriptionPackageId) {
      return Promise.resolve({ 
        data: { 
          success: true, 
          data: { content: [], totalPages: 0, totalElements: 0 } 
        } 
      });
    }
    
    // Build params directly (not wrapped in searchCriteria)
    const params = {
      page: queryParams.page || 0,
      size: queryParams.size || 10,
      sortBy: queryParams.sortBy || "createdAt",
      sortOrder: queryParams.sortOrder || "desc",
      ownedByMe: false, // MUST be false
      parkingLotId: parseInt(queryParams.parkingLotId), // REQUIRED
      subscriptionPackageId: parseInt(queryParams.subscriptionPackageId), // REQUIRED
    };
    
    return axiosClient.get(url, { params });
  },

  // Get user subscription by ID - for viewing full details
  getUserSubscriptionById: (id) => {
    const url = `/api/v1/user-service/user-subscriptions/${id}`;
    return axiosClient.get(url);
  },
};

export default subscriptionApi;
