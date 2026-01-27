/**
 * API Service Layer
 * 
 * Centralized API client for communicating with the Django backend.
 * Uses Axios with interceptors for error handling and base configuration.
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 100000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging and auth (if needed in future)
api.interceptors.request.use(
    (config) => {
        // Could add auth token here in the future
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const errorMessage = error.response?.data?.error
            || error.response?.data?.detail
            || error.message
            || 'An unexpected error occurred';

        console.error('API Error:', errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
);

/**
 * Trade API endpoints
 */
export const tradesApi = {
    /**
     * Get paginated list of trades
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.page_size - Items per page (default: 10)
     */
    getList: async (params = {}) => {
        const { page = 1, page_size = 10 } = params;
        const response = await api.get('/trades/', { params: { page, page_size } });
        return response.data;
    },

    /**
     * Get a single trade with all its legs
     * @param {number} tradeId - Trade ID
     */
    getById: async (tradeId) => {
        const response = await api.get(`/trades/${tradeId}/`);
        return response.data;
    },

    /**
     * Create a new trade with legs
     * @param {Object} data - Trade data with legs array
     */
    create: async (data) => {
        const response = await api.post('/trades/', data);
        return response.data;
    },

    /**
     * Update an existing trade
     * @param {number} tradeId - Trade ID
     * @param {Object} data - Updated trade data with legs array
     */
    update: async (tradeId, data) => {
        const response = await api.put(`/trades/${tradeId}/`, data);
        return response.data;
    },

    /**
     * Delete a trade and all its legs
     * @param {number} tradeId - Trade ID
     */
    delete: async (tradeId) => {
        const response = await api.delete(`/trades/${tradeId}/`);
        return response.data;
    }
};

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
    /**
     * Get analytics summary data
     */
    getSummary: async () => {
        const response = await api.get('/analytics/summary/');
        return response.data;
    },
};

/**
 * Fyers API endpoints
 */
export const fyersApi = {
    /**
     * Get Fyers Auth URL
     */
    getAuthUrl: async () => {
        const response = await api.get('/fyers/auth-url/');
        return response.data;
    },

    /**
     * Exchange auth code for token
     * @param {string} authCode
     */
    generateToken: async (authCode) => {
        const response = await api.post('/fyers/token/', { auth_code: authCode });
        return response.data;
    },

    /**
     * Get authenticated user's Fyers profile
     */
    getProfile: async () => {
        const response = await api.get('/fyers/profile/');
        return response.data;
    },

    /**
     * Update Fyers master data cache file
     */
    updateMasterData: async () => {
        const response = await api.post('/fyers/update-master/');
        return response.data;
    },
};

/**
 * Snapshot API endpoints
 */
export const snapshotsApi = {
    /**
     * Get paginated list of snapshots
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.page_size - Items per page (default: 10)
     */
    getList: async (params = {}) => {
        const { page = 1, page_size = 10 } = params;
        const response = await api.get('/snapshots/', { params: { page, page_size } });
        return response.data;
    },

    /**
     * Get a single snapshot with all its legs and current prices
     * @param {number} snapshotId - Snapshot ID
     */
    getById: async (snapshotId) => {
        const response = await api.get(`/snapshots/${snapshotId}/`);
        return response.data;
    },

    /**
     * Create a new snapshot with legs
     * @param {Object} data - Snapshot data with legs array
     */
    create: async (data) => {
        const response = await api.post('/snapshots/', data);
        return response.data;
    },

    /**
     * Update an existing snapshot
     * @param {number} snapshotId - Snapshot ID
     * @param {Object} data - Updated snapshot data with legs array
     */
    update: async (snapshotId, data) => {
        const response = await api.put(`/snapshots/${snapshotId}/`, data);
        return response.data;
    },

    /**
     * Delete a snapshot and all its legs
     * @param {number} snapshotId - Snapshot ID
     */
    delete: async (snapshotId) => {
        const response = await api.delete(`/snapshots/${snapshotId}/`);
        return response.data;
    }
};

export default api;
