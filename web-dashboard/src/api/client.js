import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(config=> {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMyProfile = () => apiClient.get('/users/me');
export const createStore = (data) => apiClient.post('/stores/', data);
export const getStates = () => apiClient.get('/locations/states');
export const getCities = (stateId) => apiClient.get(`/locations/cities/${stateId}`);
export const getMarkets = (cityId) => apiClient.get(`/locations/markets/${cityId}`);
export const getInventory = () => apiClient.get('/inventory/');
export const getAllProducts = () => apiClient.get('/products/all');
export const addPrice = (data) => apiClient.post('/inventory/', data);
export const updatePrice = (priceId, data) => apiClient.put(`/inventory/${priceId}`, data);
export const deletePrice = (priceId) => apiClient.delete(`/inventory/${priceId}`);
export const getAnalytics = () => apiClient.get('/analytics/views');

export default apiClient;