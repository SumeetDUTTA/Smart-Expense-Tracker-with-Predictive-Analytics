import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ?
    "http://localhost:5000" : "/api";

const api = axios.create({
    baseURL: BASE_URL + "/api",
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