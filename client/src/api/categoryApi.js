import axiosInstance from './axiosInstance';

export const getCategories = (params = { sector: 'personal' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', categoryData);
export const deleteCategory = (id, params = { sector: 'personal' }) => axiosInstance.delete(`/categories/${id}`, { params });
