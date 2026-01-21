import axiosInstance from './axiosInstance';

export const getExpenseCategories = (params = {}) => axiosInstance.get('/expense-categories', { params });
export const createExpenseCategory = (categoryData) => axiosInstance.post('/expense-categories', categoryData);
export const deleteExpenseCategory = (id, sector) => axiosInstance.delete(`/expense-categories/${id}`, { params: { sector } });
