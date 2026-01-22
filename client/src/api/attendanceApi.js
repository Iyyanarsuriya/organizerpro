import axiosInstance from './axiosInstance';

export const getAttendances = (params) => axiosInstance.get('/attendance', { params });
export const createAttendance = (data) => axiosInstance.post('/attendance', data);
export const quickMarkAttendance = (data) => axiosInstance.post('/attendance/quick', data);
export const quickMarkITAttendance = (data) => axiosInstance.post('/it-attendance/quick', data);
export const bulkMarkITAttendance = (data) => axiosInstance.post('/it-attendance/bulk', data);
export const updateAttendance = (id, data) => axiosInstance.put(`/attendance/${id}`, data);
export const deleteAttendance = (id, params) => axiosInstance.delete(`/attendance/${id}`, { params });
export const getAttendanceStats = (params) => axiosInstance.get('/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/attendance/summary', { params });
