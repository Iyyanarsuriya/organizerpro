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

export const deleteTransaction = async (id) => {
    return await axiosInstance.delete(`/transactions/${id}`);
};

export const getTransactionStats = async (period, projectId, startDate, endDate, workerId) => {
    return await axiosInstance.get('/transactions/stats', { params: { period, projectId, startDate, endDate, workerId } });
};
