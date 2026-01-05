import axiosInstance from './axiosInstance';

export const getAttendances = (params) => axiosInstance.get('/attendance', { params });
export const createAttendance = (data) => axiosInstance.post('/attendance', data);
export const quickMarkAttendance = (data) => axiosInstance.post('/attendance/quick', data);
export const updateAttendance = (id, data) => axiosInstance.put(`/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`/attendance/${id}`);
export const getAttendanceStats = (params) => axiosInstance.get('/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/attendance/summary', { params });
