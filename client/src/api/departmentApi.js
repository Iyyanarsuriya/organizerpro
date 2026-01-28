import axios from './axiosInstance';

export const getDepartments = (params) => axios.get('/departments', { params });
export const createDepartment = (data) => axios.post('/departments', data);
export const deleteDepartment = (id, params) => axios.delete(`/departments/${id}`, { params });
