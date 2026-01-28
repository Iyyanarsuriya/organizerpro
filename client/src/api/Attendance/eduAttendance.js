import axiosInstance from '../axiosInstance';

export const getAttendances = (params) => axiosInstance.get('/education-sector/attendance', { params });
export const quickMarkAttendance = (data) => axiosInstance.post('/education-sector/attendance/quick', data);
export const getAttendanceStats = (params) => axiosInstance.get('/education-sector/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/education-sector/attendance/summary', { params });
export const updateAttendance = (id, data) => axiosInstance.put(`/education-sector/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`/education-sector/attendance/${id}`);

export const getProjects = (params) => axiosInstance.get('/projects', { params: { ...params, sector: 'education' } });
export const createProject = (data) => axiosInstance.post('/projects', { ...data, sector: 'education' });
export const deleteProject = (id, params) => axiosInstance.delete(`/projects/${id}`, { params: { ...params, sector: 'education' } });
