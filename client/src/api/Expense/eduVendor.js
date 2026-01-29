import axiosInstance from '../axiosInstance';

export const getVendors = (params) => axiosInstance.get('/education-sector/vendors', { params });
export const createVendor = (data) => axiosInstance.post('/education-sector/vendors', data);
export const updateVendor = (id, data) => axiosInstance.put(`/education-sector/vendors/${id}`, data);
export const deleteVendor = (id) => axiosInstance.delete(`/education-sector/vendors/${id}`);
