import axios from 'axios';

// Smart Base URL resolution:
// 1. If VITE_API_URL is specified, use it
// 2. In browser on custom domain (Hostinger, etc.), use relative '/api'
// 3. If on Vercel without custom URL, use Render fallback
// 4. In local development, use 'http://localhost:5000/api'
let rawURL = (import.meta.env.VITE_API_URL || '').trim();

if (!rawURL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (window.location.hostname.includes('vercel.app')) {
      rawURL = 'https://software-drizzle.onrender.com/api';
    } else {
      rawURL = '/api'; // Hostinger direct hosting (same domain)
    }
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
