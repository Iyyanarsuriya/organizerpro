import axiosInstance from '../axiosInstance';

export const getMfgPayroll = (params) => {
    return axiosInstance.get('/manufacturing-sector/payroll', { params });
};

export const generateMfgPayroll = (data) => {
    return axiosInstance.post('/manufacturing-sector/payroll/generate', data);
};

export const approveMfgPayroll = (id) => {
    return axiosInstance.post(`/manufacturing-sector/payroll/${id}/approve`);
};

export const deleteMfgPayroll = (id) => {
    return axiosInstance.delete(`/manufacturing-sector/payroll/${id}`);
};
