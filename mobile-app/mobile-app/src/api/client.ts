import axios from 'axios';
import { Platform } from 'react-native';

// Dynamically select the API URL based on the platform
const API_BASE_URL = 'https://3c149845bd18.ngrok-free.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;