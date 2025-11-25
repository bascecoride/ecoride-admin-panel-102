import axios from 'axios';
import { API_BASE_URL } from '../config';

// Helper function to get auth token (same as other services)
const getAuthToken = () => {
  return localStorage.getItem('admin_access_token');
};

// Create axios instance with auth header
const createAuthenticatedRequest = () => {
  const token = getAuthToken();
  console.log('AppSettings - Using auth token:', token ? 'Token exists' : 'No token');
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  });
};

export const appSettingsService = {
  // Get all settings (admin only)
  getAllSettings: async () => {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.get('/api/app-settings');
      return response.data.settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch settings');
    }
  },

  // Get distance radius (public endpoint - no auth required)
  getDistanceRadius: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/app-settings/distance-radius`);
      return response.data;
    } catch (error) {
      console.error('Error fetching distance radius:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch distance radius');
    }
  },

  // Get specific setting by key (admin only)
  getSettingByKey: async (key) => {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.get(`/api/app-settings/${key}`);
      return response.data.setting;
    } catch (error) {
      console.error('Error fetching setting:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch setting');
    }
  },

  // Update setting (admin only)
  updateSetting: async (settingKey, value, description) => {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.put('/api/app-settings', {
        settingKey,
        value,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw new Error(error.response?.data?.message || 'Failed to update setting');
    }
  },

  // Bulk update settings (admin only)
  bulkUpdateSettings: async (settings) => {
    try {
      const api = createAuthenticatedRequest();
      const response = await api.put('/api/app-settings/bulk', {
        settings
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating settings:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk update settings');
    }
  }
};
