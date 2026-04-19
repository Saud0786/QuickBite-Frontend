import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Intercept requests to add the Authorization header if a token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    } else if (!config.headers['Content-Type'] && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', 'application/json');
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
