import axiosInstance from '../axiosInstance';

export const getTransactions = (params) => axiosInstance.get('/education-sector/transactions', { params });
export const createTransaction = (data) => axiosInstance.post('/education-sector/transactions', data);
export const updateTransaction = (id, data) => axiosInstance.put(`/education-sector/transactions/${id}`, data);
export const deleteTransaction = (id) => axiosInstance.delete(`/education-sector/transactions/${id}`);
export const getTransactionStats = (params) => axiosInstance.get('/education-sector/transactions/stats', { params });

export const getExpenseCategories = (params = { sector: 'education' }) => axiosInstance.get('/education-sector/expense-categories', { params });
export const createExpenseCategory = (categoryData) => axiosInstance.post('/education-sector/expense-categories', { ...categoryData, sector: 'education' });
export const deleteExpenseCategory = (id, params = { sector: 'education' }) => axiosInstance.delete(`/education-sector/expense-categories/${id}`, { params });
