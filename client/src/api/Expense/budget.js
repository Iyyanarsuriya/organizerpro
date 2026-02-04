import axios from '../axiosInstance';

// Budget API
// The axiosInstance already includes '/api' in the baseURL, so we just need the resources
export const getBudgets = async (params) => {
    return await axios.get('/budgets', { params });
};

export const createBudget = async (data) => {
    return await axios.post('/budgets', data);
};

export const deleteBudget = async (id) => {
    return await axios.delete(`/budgets/${id}`);
};

export const getBudgetStatus = async (params = {}) => {
    return await axios.get('/budgets/status', { params });
};
