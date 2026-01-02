import axiosInstance from './axiosInstance';

export const getTransactions = async () => {
    return await axiosInstance.get('/transactions');
};

export const createTransaction = async (data) => {
    return await axiosInstance.post('/transactions', data);
};

export const deleteTransaction = async (id) => {
    return await axiosInstance.delete(`/transactions/${id}`);
};

export const getTransactionStats = async (month) => {
    return await axiosInstance.get('/transactions/stats', { params: { month } });
};
