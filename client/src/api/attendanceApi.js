import axiosInstance from './axiosInstance';

// ==========================================
// MANUFACTURING SECTOR ATTENDANCE API
// Base path: /manufacturing-attendance
// ==========================================

export const getAttendances = (params) => axiosInstance.get('/manufacturing-attendance', { params });
export const createAttendance = (data) => axiosInstance.post('/manufacturing-attendance', data);
export const quickMarkAttendance = (data) => axiosInstance.post('/manufacturing-attendance/quick', data);
export const updateAttendance = (id, data) => axiosInstance.put(`/manufacturing-attendance/${id}`, data);
export const deleteAttendance = (id, params) => axiosInstance.delete(`/manufacturing-attendance/${id}`, { params });
export const getAttendanceStats = (params) => axiosInstance.get('/manufacturing-attendance/stats', { params });
export const getMemberSummary = (params) => axiosInstance.get('/manufacturing-attendance/summary', { params });

// Explicit Manufacturing Aliases
export const getMfgAttendances = getAttendances;
export const quickMarkMfgAttendance = quickMarkAttendance;
export const updateMfgAttendance = updateAttendance;
export const deleteMfgAttendance = deleteAttendance;
export const getMfgAttendanceStats = getAttendanceStats;
export const getMfgMemberSummary = getMemberSummary;


// ==========================================
// IT SECTOR ATTENDANCE API
// Base path: /it-attendance
// ==========================================

export const getITAttendances = (params) => axiosInstance.get('/it-attendance', { params });
export const quickMarkITAttendance = (data) => axiosInstance.post('/it-attendance/quick', data);
export const bulkMarkITAttendance = (data) => axiosInstance.post('/it-attendance/bulk', data);
export const getITAttendanceStats = (params) => axiosInstance.get('/it-attendance/stats', { params }); // Assuming backend supports this route
export const getITMemberSummary = (params) => axiosInstance.get('/it-attendance/summary', { params }); // Assuming backend supports this route


// ==========================================
// EDUCATION SECTOR ATTENDANCE API
// Base path: /education-attendance
// ==========================================

export const getEduAttendances = (params) => axiosInstance.get('/education-attendance', { params });
export const quickMarkEduAttendance = (data) => axiosInstance.post('/education-attendance/quick', data);
export const getEduAttendanceStats = (params) => axiosInstance.get('/education-attendance/stats', { params });
export const getEduMemberSummary = (params) => axiosInstance.get('/education-attendance/summary', { params });
export const updateEduAttendance = (id, data) => axiosInstance.put(`/education-attendance/${id}`, data);
export const deleteEduAttendance = (id, params) => axiosInstance.delete(`/education-attendance/${id}`, { params });
