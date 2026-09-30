import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || '/api';

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injection ──────────────────────────────────
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('puhar_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response normalizer ──────────────────────────────────
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      sessionStorage.removeItem('puhar_token');
      // Let components handle re-auth
    }
    return Promise.reject(err);
  }
);

export default client;
