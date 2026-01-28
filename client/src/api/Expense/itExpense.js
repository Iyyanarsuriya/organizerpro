import axiosInstance from '../axiosInstance';

export const getTransactions = (params) => axiosInstance.get('/it-sector/transactions', { params });
export const createTransaction = (data) => axiosInstance.post('/it-sector/transactions', data);
export const updateTransaction = (id, data) => axiosInstance.put(`/it-sector/transactions/${id}`, data);
export const deleteTransaction = (id) => axiosInstance.delete(`/it-sector/transactions/${id}`);
export const getTransactionStats = (params) => axiosInstance.get('/it-sector/transactions/stats', { params });

export const getExpenseCategories = (params = { sector: 'it' }) => axiosInstance.get('/expense-categories', { params });
export const createExpenseCategory = (categoryData) => axiosInstance.post('/expense-categories', { ...categoryData, sector: 'it' });
export const deleteExpenseCategory = (id, params = { sector: 'it' }) => axiosInstance.delete(`/expense-categories/${id}`, { params });
