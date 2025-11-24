import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/fare-rates`;

// Get auth token from localStorage
const getAuthToken = () => {
	const token = localStorage.getItem('admin_access_token');
	return token;
};

// Create axios instance with auth header
const createAuthHeaders = () => {
	const token = getAuthToken();
	return {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`
		}
	};
};

export const fareRateService = {
	// Get all fare rates (public)
	getAllFareRates: async () => {
		try {
			const response = await axios.get(API_URL);
			return response.data.fareRates;
		} catch (error) {
			console.error('Error fetching fare rates:', error);
			throw new Error(error.response?.data?.message || 'Failed to fetch fare rates');
		}
	},

	// Get fare rate by vehicle type (public)
	getFareRateByVehicle: async (vehicleType) => {
		try {
			const response = await axios.get(`${API_URL}/${vehicleType}`);
			return response.data.fareRate;
		} catch (error) {
			console.error('Error fetching fare rate:', error);
			throw new Error(error.response?.data?.message || 'Failed to fetch fare rate');
		}
	},

	// Update single fare rate (admin only)
	updateFareRate: async (vehicleType, fareData) => {
		try {
			const response = await axios.put(
				`${API_URL}/${vehicleType}`,
				fareData,
				createAuthHeaders()
			);
			return response.data.fareRate;
		} catch (error) {
			console.error('Error updating fare rate:', error);
			throw new Error(error.response?.data?.message || 'Failed to update fare rate');
		}
	},

	// Bulk update fare rates (admin only)
	bulkUpdateFareRates: async (fareRates) => {
		try {
			const response = await axios.put(
				API_URL,
				{ fareRates },
				createAuthHeaders()
			);
			return response.data.fareRates;
		} catch (error) {
			console.error('Error bulk updating fare rates:', error);
			throw new Error(error.response?.data?.message || 'Failed to update fare rates');
		}
	},

	// Initialize default fare rates (admin only)
	initializeFareRates: async () => {
		try {
			const response = await axios.post(
				`${API_URL}/initialize`,
				{},
				createAuthHeaders()
			);
			return response.data.fareRates;
		} catch (error) {
			console.error('Error initializing fare rates:', error);
			throw new Error(error.response?.data?.message || 'Failed to initialize fare rates');
		}
	}
};
