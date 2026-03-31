import axios from 'axios';
import { getToken } from './authService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Request interceptor — attach JWT if present
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — redirect to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getProfile() {
  return api.get('/profile');
}

export function saveProfile(data) {
  const { age, healthConditions, cycleLength } = data;
  return api.post('/profile', { age, healthConditions, cycleLength });
}

export function sendChat(message, conversationId) {
  return api.post('/chat', { message, conversationId });
}

export function logSymptom(data) {
  const { symptomType, severity, notes } = data;
  return api.post('/symptoms', { symptomType, severity, notes });
}

export function getSymptoms() {
  return api.get('/symptoms');
}

export function generateReport(fromDate, toDate) {
  return api.post('/reports/generate', { fromDate, toDate });
}

export function getReports() {
  return api.get('/reports');
}
