import axiosInstance from '../axiosInstance';

export const getAuditLogs = (params) => axiosInstance.get('/education-sector/audit', { params });
