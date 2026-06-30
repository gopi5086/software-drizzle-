import axios from 'axios';

const api = axios.create({
  // Hardcoded fallback because Vercel env vars are tricky
  baseURL: import.meta.env.VITE_API_URL || 'https://dazzle-drop-hotel.onrender.com/api',
});

// Add a request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
