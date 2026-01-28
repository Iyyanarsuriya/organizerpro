import axiosInstance from '../axiosInstance';

export const getAttendances = (params) => axiosInstance.get('/it-sector/attendance', { params });
export const quickMarkAttendance = (data) => axiosInstance.post('/it-sector/attendance/quick', data);
export const bulkMarkAttendance = (data) => axiosInstance.post('/it-sector/attendance/bulk', data);
export const createAttendance = (data) => axiosInstance.post('/it-sector/attendance', data);
export const updateAttendance = (id, data) => axiosInstance.put(`/it-sector/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`/it-sector/attendance/${id}`);
export const getAttendanceStats = (params) => axiosInstance.get('/it-sector/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/it-sector/attendance/summary', { params });

export const getProjects = (params) => axiosInstance.get('/it-sector/projects', { params });
export const createProject = (data) => axiosInstance.post('/it-sector/projects', data);
export const deleteProject = (id) => axiosInstance.delete(`/it-sector/projects/${id}`);

