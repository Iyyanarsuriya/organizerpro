import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector';

export const getTransactions = (params) => axiosInstance.get(`${BASE_URL}/transactions`, { params });
export const createTransaction = (data) => axiosInstance.post(`${BASE_URL}/transactions`, data);
export const updateTransaction = (id, data) => axiosInstance.put(`${BASE_URL}/transactions/${id}`, data);
export const deleteTransaction = (id) => axiosInstance.delete(`${BASE_URL}/transactions/${id}`);
export const getTransactionStats = (params) => axiosInstance.get(`${BASE_URL}/transactions/stats`, { params });

export const getExpenseCategories = (params) => axiosInstance.get(`${BASE_URL}/categories`, { params });
export const createExpenseCategory = (data) => axiosInstance.post(`${BASE_URL}/categories`, data);
export const deleteExpenseCategory = (id) => axiosInstance.delete(`${BASE_URL}/categories/${id}`);

export const getVehicleLogs = (params) => axiosInstance.get(`${BASE_URL}/vehicle-logs`, { params });
