import axios from 'axios';

// Production base URL defaults to the active cloud backend
let rawURL = (import.meta.env.VITE_API_URL || '').trim();

if (!rawURL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    rawURL = 'https://software-drizzle.onrender.com/api';
  } else {
    rawURL = 'http://localhost:5000/api';
  }
}

// Normalize: if the user provided e.g. "https://xxx.onrender.com" without "/api", append it
if (rawURL && !rawURL.endsWith('/api') && !rawURL.endsWith('/api/')) {
  rawURL = rawURL.replace(/\/+$/, '') + '/api';
}

const api = axios.create({
  baseURL: rawURL,
  timeout: 45000, // 45 seconds to accommodate Render free-tier cold starts
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
