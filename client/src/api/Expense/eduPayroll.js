import axiosInstance from '../axiosInstance';

export const getPayrolls = (params) => axiosInstance.get('/education-sector/payroll', { params });
export const generatePayroll = (data) => axiosInstance.post('/education-sector/payroll/generate', data);
export const approvePayroll = (id) => axiosInstance.put(`/education-sector/payroll/${id}/approve`);
export const payPayroll = (id, data) => axiosInstance.post(`/education-sector/payroll/${id}/pay`, data);
