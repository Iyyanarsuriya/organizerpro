import axiosInstance from './axiosInstance';

export const getTransactions = async (params = {}) => {
    return await axiosInstance.get('/transactions', { params });
};

export const createTransaction = async (data) => {
    return await axiosInstance.post('/transactions', data);
};

export const updateTransaction = async (id, data) => {
    return await axiosInstance.put(`/transactions/${id}`, data);
};

export const deleteTransaction = async (id, sector) => {
    return await axiosInstance.delete(`/transactions/${id}`, { params: { sector } });
};

export const getTransactionStats = async (params = {}) => {
    return await axiosInstance.get('/transactions/stats', { params });
};
