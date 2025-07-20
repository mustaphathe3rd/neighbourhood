// src/api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://91158a5589b5.ngrok-free.app'; // Paste your active ngrok URL here

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  },
});

// This interceptor runs before every request
apiClient.interceptors.request.use(
  async (config) => {
    let token;
    console.log("API Base URL:", API_BASE_URL);
    if (Platform.OS !== 'web') {
      token = await SecureStore.getItemAsync('userToken');
    } else {
      token = localStorage.getItem('userToken');
    }

    if (token) {
      // If a token exists, add it to the header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

export const getProductByBarcode = async (barcode: string) => {
  try {
    // This endpoint already exists form a previous step
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data;
  } catch (error) {
    console.error("Barcode lookup failed:", error);
    throw error;
  }
};