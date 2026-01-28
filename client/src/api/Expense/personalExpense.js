import axiosInstance from '../axiosInstance';

// Transactions
export const getTransactions = (params) => axiosInstance.get('/transactions', { params });
export const createTransaction = (data) => axiosInstance.post('/transactions', data);
export const updateTransaction = (id, data) => axiosInstance.put(`/transactions/${id}`, data);
export const deleteTransaction = (id, sector) => axiosInstance.delete(`/transactions/${id}`, { params: { sector } });
export const getTransactionStats = (params) => axiosInstance.get('/transactions/stats', { params });

// Expense Categories
export const getExpenseCategories = (params = {}) => axiosInstance.get('/expense-categories', { params });
export const createExpenseCategory = (categoryData) => axiosInstance.post('/expense-categories', categoryData);
export const deleteExpenseCategory = (id, sector) => axiosInstance.delete(`/expense-categories/${id}`, { params: { sector } });

// Vehicle Logs
export const getVehicleLogs = () => axiosInstance.get('/vehicle-logs');
export const createVehicleLog = (data) => axiosInstance.post('/vehicle-logs', data);
export const updateVehicleLog = (id, data) => axiosInstance.put(`/vehicle-logs/${id}`, data);
export const deleteVehicleLog = (id) => axiosInstance.delete(`/vehicle-logs/${id}`);
