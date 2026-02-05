import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector';

export const getProjects = (params) => axiosInstance.get(`${BASE_URL}/projects`, { params });
export const createProject = (data) => axiosInstance.post(`${BASE_URL}/projects`, data);
export const deleteProject = (id) => axiosInstance.delete(`${BASE_URL}/projects/${id}`);

export const getAttendanceStats = (params) => axiosInstance.get(`${BASE_URL}/attendance/stats`, { params });
export const getAttendances = (params) => axiosInstance.get(`${BASE_URL}/attendance`, { params });
export const createAttendance = (data) => axiosInstance.post(`${BASE_URL}/attendance`, data);
export const updateAttendance = (id, data) => axiosInstance.put(`${BASE_URL}/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`${BASE_URL}/attendance/${id}`);
