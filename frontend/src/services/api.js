import axios from 'axios';
import { getAuthHeader } from './auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    if (authHeader['x-auth-token']) {
      config.headers['x-auth-token'] = authHeader['x-auth-token'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  studentRegister: (studentData) => api.post('/auth/student/register', studentData),
  login: (loginData) => api.post('/auth/login', loginData),
};

// Admin API
export const adminAPI = {
  createTeacher: (teacherData) => api.post('/admin/teachers', teacherData),
  getTeachers: () => api.get('/admin/teachers'),
};

// Classroom API
export const classroomAPI = {
  create: (classroomData) => api.post('/classrooms', classroomData),
  getMyClassrooms: () => api.get('/classrooms/my-classrooms'),
  getActiveClassrooms: () => api.get('/classrooms/active'),
  terminate: (classroomId) => api.delete(`/classrooms/${classroomId}`),
  getStats: (classroomId) => api.get(`/classrooms/${classroomId}/stats`),
};

// Attendance API
export const attendanceAPI = {
  mark: (attendanceData) => api.post('/attendance/mark', attendanceData),
  getHistory: () => api.get('/attendance/history'),
  getReport: (classroomId) => api.get(`/attendance/report/${classroomId}`),
};

export default api;