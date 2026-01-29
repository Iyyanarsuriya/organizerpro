import axiosInstance from '../axiosInstance';

export const getAttendances = (params) => axiosInstance.get('/education-sector/attendance', { params });
export const quickMarkAttendance = (data) => axiosInstance.post('/education-sector/attendance/quick', data);
export const getAttendanceStats = (params) => axiosInstance.get('/education-sector/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/education-sector/attendance/summary', { params });
export const updateAttendance = (id, data) => axiosInstance.put(`/education-sector/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`/education-sector/attendance/${id}`);
export const lockAttendance = (date) => axiosInstance.post('/education-sector/attendance/lock', { date });
export const unlockAttendance = (date) => axiosInstance.post('/education-sector/attendance/unlock', { date });
export const getLockedDates = (month, year) => axiosInstance.get('/education-sector/attendance/locked-dates', { params: { month, year } });
