import axios from 'axios';
import authService from './authService';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = authService.getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is not 401 or request has already been retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Try to refresh the token
            const newAccessToken = await authService.refreshToken();
            
            // Update the authorization header
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            // Retry the original request
            return api(originalRequest);
        } catch (refreshError) {
            // If refresh fails, logout user and reject promise
            authService.logout();
            return Promise.reject(refreshError);
        }
    }
);

const getCharts = async (fileId) => {
    const response = await api.get(`/excel/files/${fileId}/charts`);
    return response.data;
};

const addChart = async (fileId, chartConfig) => {
    const response = await api.post(`/excel/files/${fileId}/charts`, chartConfig);
    return response.data;
};

const updateChart = async (fileId, chartId, chartConfig) => {
    const response = await api.put(`/excel/files/${fileId}/charts/${chartId}`, chartConfig);
    return response.data;
};

const deleteChart = async (fileId, chartId) => {
    const response = await api.delete(`/excel/files/${fileId}/charts/${chartId}`);
    return response.data;
};

const getFileById = async (fileId) => {
    const response = await api.get(`/excel/files/${fileId}`);
    return response.data;
};

export {
    api as default,
    getCharts,
    addChart,
    updateChart,
    deleteChart,
    getFileById,
};
