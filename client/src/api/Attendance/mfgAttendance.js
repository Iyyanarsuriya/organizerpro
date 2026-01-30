import axiosInstance from '../axiosInstance';

// Attendance
export const getAttendances = (params) => axiosInstance.get('/manufacturing-sector/attendance', { params });
export const createAttendance = (data) => axiosInstance.post('/manufacturing-sector/attendance', data);
export const quickMarkAttendance = (data) => axiosInstance.post('/manufacturing-sector/attendance/quick', data);
export const bulkMarkAttendance = (data) => axiosInstance.post('/manufacturing-sector/attendance/bulk', data);
export const updateAttendance = (id, data) => axiosInstance.put(`/manufacturing-sector/attendance/${id}`, data);
export const deleteAttendance = (id) => axiosInstance.delete(`/manufacturing-sector/attendance/${id}`);
export const getAttendanceStats = (params) => axiosInstance.get('/manufacturing-sector/attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/manufacturing-sector/attendance/summary', { params });

// Projects
export const getProjects = (params) => axiosInstance.get('/manufacturing-sector/projects', { params });
export const createProject = (data) => axiosInstance.post('/manufacturing-sector/projects', data);
export const deleteProject = (id) => axiosInstance.delete(`/manufacturing-sector/projects/${id}`);

// Work Logs
export const createWorkLog = (data) => axiosInstance.post('/manufacturing-sector/work-logs', data);
export const getWorkLogs = (params) => axiosInstance.get('/manufacturing-sector/work-logs', { params });
export const getMonthlyTotal = (params) => axiosInstance.get('/manufacturing-sector/work-logs/monthly-total', { params });
export const updateWorkLog = (id, data) => axiosInstance.put(`/manufacturing-sector/work-logs/${id}`, data);
export const deleteWorkLog = (id) => axiosInstance.delete(`/manufacturing-sector/work-logs/${id}`);

// Work Types
export const getWorkTypes = (params) => axiosInstance.get('/manufacturing-sector/work-types', { params });
export const createWorkType = (data) => axiosInstance.post('/manufacturing-sector/work-types', data);
export const deleteWorkType = (id) => axiosInstance.delete(`/manufacturing-sector/work-types/${id}`);
