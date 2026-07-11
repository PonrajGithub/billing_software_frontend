import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api/";
// export const API_BASE_URL = "https://myricekart.in/backend/public/api/";
export const API_BASE_URL_IMAGE = "http://localhost:8000/public";
// export const API_BASE_URL_IMAGE = "https://myricekart.in/backend/public";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to strip .php extension and adjust endpoints for the Laravel backend
api.interceptors.request.use((config) => {
  if (config.url) {
    let url = config.url;

    // 1. Remove the .php extension (either at end of path, or followed by query params)
    url = url.replace(/\.php(\?|$)/, '$1');

    // 2. Adjust specific case-sensitive endpoints to match Laravel backend routes
    if (url.includes("/admin/update_Admin")) {
      url = url.replace("/admin/update_Admin", "/admin/update_admin");
    }

    config.url = url;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;