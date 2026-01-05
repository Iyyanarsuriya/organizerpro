import axiosInstance from './axiosInstance';

export const getWorkers = async () => {
    return await axiosInstance.get('/workers');
};

export const getActiveWorkers = async () => {
    return await axiosInstance.get('/workers/active');
};

export const createWorker = async (data) => {
    return await axiosInstance.post('/workers', data);
};

export const updateWorker = async (id, data) => {
    return await axiosInstance.put(`/workers/${id}`, data);
};

export const deleteWorker = async (id) => {
    return await axiosInstance.delete(`/workers/${id}`);
};
