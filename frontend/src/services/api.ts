import axios from 'axios';

const isServer = typeof window === 'undefined';

const api = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use(
  (config) => {
    if (!isServer) {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;