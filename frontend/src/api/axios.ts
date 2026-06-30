import axios from 'axios';

const api = axios.create({
  // forcefully ignoring Vercel env variable completely to prevent 404 error
  baseURL: 'https://dazzle-drop-hotel.onrender.com/api',
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
