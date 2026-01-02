import axiosInstance from './axiosInstance';

export const getExpenseCategories = () => axiosInstance.get('/expense-categories');
export const createExpenseCategory = (categoryData) => axiosInstance.post('/expense-categories', categoryData);
export const deleteExpenseCategory = (id) => axiosInstance.delete(`/expense-categories/${id}`);
