import axios from "axios";

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://avokadu.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Flag để tránh gọi refresh nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue = [];

// ✅ Xử lý queue các request bị pending trong khi refresh token
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ✅ Hàm refresh token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Dùng axios trực tiếp thay vì axiosClient để tránh vòng lặp interceptor
  const response = await axios.post(
    `${import.meta.env.VITE_API_URL || "https://avokadu.com"}/api/v1/user-service/auth/refresh`,
    { refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data?.data || {};

  if (newAccessToken) {
    localStorage.setItem("accessToken", newAccessToken);
    console.log("✅ Access token đã được làm mới");
  }

  if (newRefreshToken) {
    localStorage.setItem("refreshToken", newRefreshToken);
    console.log("✅ Refresh token đã được cập nhật");
  }

  return newAccessToken;
};

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

// ✅ Interceptor để tự động refresh token khi hết hạn (401)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh token, đưa request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        // Xử lý tất cả request trong queue
        processQueue(null, newToken);
        
        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token thất bại - xử lý queue với error
        processQueue(refreshError, null);
        
        console.error("❌ Refresh token thất bại. Đang chuyển đến trang đăng nhập...");
        
        // Clear tất cả token
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("partnerId");
        localStorage.removeItem("userEmail");
        
        // Redirect về trang login tương ứng
        const currentPath = window.location.pathname;
        if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Các lỗi khác - chỉ reject
    return Promise.reject(error);
  }
);

export default axiosClient;
