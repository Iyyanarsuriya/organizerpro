import axiosInstance from '../axiosInstance';

export const getTransactions = (params) => axiosInstance.get('/manufacturing-sector/transactions', { params });
export const createTransaction = (data) => axiosInstance.post('/manufacturing-sector/transactions', data);
export const updateTransaction = (id, data) => axiosInstance.put(`/manufacturing-sector/transactions/${id}`, data);
export const deleteTransaction = (id) => axiosInstance.delete(`/manufacturing-sector/transactions/${id}`);
export const getTransactionStats = (params) => axiosInstance.get('/manufacturing-sector/transactions/stats', { params });

export const getExpenseCategories = (params = { sector: 'manufacturing' }) => axiosInstance.get('/expense-categories', { params });
export const createExpenseCategory = (categoryData) => axiosInstance.post('/expense-categories', { ...categoryData, sector: 'manufacturing' });
export const deleteExpenseCategory = (id, params = { sector: 'manufacturing' }) => axiosInstance.delete(`/expense-categories/${id}`, { params });

// Vehicle Logs
export const getVehicleLogs = () => axiosInstance.get('/manufacturing-sector/vehicle-logs');
export const createVehicleLog = (data) => axiosInstance.post('/manufacturing-sector/vehicle-logs', data);
export const updateVehicleLog = (id, data) => axiosInstance.put(`/manufacturing-sector/vehicle-logs/${id}`, data);
export const deleteVehicleLog = (id) => axiosInstance.delete(`/manufacturing-sector/vehicle-logs/${id}`);
