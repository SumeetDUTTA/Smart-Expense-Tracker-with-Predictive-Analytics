import axios from "axios";

// Always use /api - Vite proxy handles dev mode routing to localhost:5000
const api = axios.create({
    baseURL: "/api",
    headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error attaching token to request:", error);
    }
    return config;
})

export default api;