// src/api.js
// Centralized Axios instance for API calls
import axios from 'axios';

// Base URL points to the Vite dev server proxy (http://localhost:5000)
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Attach token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arshi-token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Export helper functions for API calls
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const submitEntry = (entryData) => api.post('/entries', entryData);
export const getTodayEntries = () => api.get('/entries/today');
export const getTotalEntriesCount = () => api.get('/entries/count');
export const editEntry = (timestamp, entryData) => api.put(`/entries/${timestamp}`, entryData);
export const resetAllEntries = () => api.delete('/entries');
export const restoreEntries = () => api.post('/entries/restore');
export const extractFromImage = (formData) => api.post('/extract', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000, // 30 seconds for AI processing
});
export const extractFromText = (payload) => api.post('/extract/text', payload, {
  timeout: 30000, // 30 seconds for AI processing
});

export default api;
