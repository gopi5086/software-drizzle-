import axios from 'axios';

// Default to live Render backend in production if VITE_API_URL is not set
const fallbackURL = import.meta.env.PROD
  ? 'https://software-drizzle.onrender.com/api'
  : 'http://localhost:5000/api';

let rawURL = (import.meta.env.VITE_API_URL || fallbackURL).trim();

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
