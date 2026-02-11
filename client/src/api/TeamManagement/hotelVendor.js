import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector/vendors';

export const getVendors = () => axiosInstance.get(BASE_URL);
export const createVendor = (data) => axiosInstance.post(BASE_URL, data);
export const updateVendor = (id, data) => axiosInstance.put(`${BASE_URL}/${id}`, data);
export const deleteVendor = (id) => axiosInstance.delete(`${BASE_URL}/${id}`);
