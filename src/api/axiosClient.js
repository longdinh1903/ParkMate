import axios from "axios";

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://avokadu.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Interceptor để tự động đính kèm token vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    // CHỈ thêm Authorization header khi có token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("❌ Token invalid or expired. Please login again.");
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
