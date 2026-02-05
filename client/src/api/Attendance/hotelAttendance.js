import axiosInstance from '../axiosInstance';

// NOTE: Using the generic manufacturing routes which are mounted at /api/hotel-sector/attendance
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hotel-sector`;

// Attendance
export const getAttendances = (params) => axiosInstance.get(`${BASE_URL}/attendance`, { params });
export const createAttendance = (data) => axiosInstance.post(`${BASE_URL}/attendance`, data);
export const quickMarkAttendance = (data) => axiosInstance.post(`${BASE_URL}/attendance/quick`, data);
export const bulkMarkAttendance = (data) => axiosInstance.post(`${BASE_URL}/attendance/bulk`, data);
export const getAttendanceStats = (params) => axiosInstance.get(`${BASE_URL}/attendance/stats`, { params });
export const getMemberSummary = (params) => axiosInstance.get(`${BASE_URL}/attendance/summary`, { params });
export const updateAttendance = (id, data) => axiosInstance.put(`${BASE_URL}/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`${BASE_URL}/attendance/${id}`);

// Projects (Departments)
export const getProjects = (params) => axiosInstance.get(`${BASE_URL}/projects`, { params });
export const createProject = (data) => axiosInstance.post(`${BASE_URL}/projects`, data);
export const deleteProject = (id) => axiosInstance.delete(`${BASE_URL}/projects/${id}`);

// Holidays & Shifts (Leveraging the generic backend)
export const getHolidays = (params) => axiosInstance.get(`${BASE_URL}/attendance/holidays`, { params });
export const createHoliday = (data) => axiosInstance.post(`${BASE_URL}/attendance/holidays`, data);
export const deleteHoliday = (id) => axiosInstance.delete(`${BASE_URL}/attendance/holidays/${id}`);

export const getShifts = (params) => axiosInstance.get(`${BASE_URL}/attendance/shifts`, { params });
export const createShift = (data) => axiosInstance.post(`${BASE_URL}/attendance/shifts`, data);
export const deleteShift = (id) => axiosInstance.delete(`${BASE_URL}/attendance/shifts/${id}`);
