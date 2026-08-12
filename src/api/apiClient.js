import axios from 'axios';
import { auth } from '../firebase/config';

// Change this to your local machine IP if running on a physical device,
// or use the environment variable EXPO_PUBLIC_API_BASE_URL.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach Firebase ID Token to every request
apiClient.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const idToken = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
