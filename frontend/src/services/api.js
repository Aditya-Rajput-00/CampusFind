
import axios from 'axios';

// Use the production API URL when configured.
// Otherwise, use the existing local Vite proxy.
const apiBaseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: apiBaseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically attach JWT token to API requests
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('campusfindToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
