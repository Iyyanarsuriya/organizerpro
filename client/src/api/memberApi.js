import axiosInstance from './axiosInstance';

export const getMembers = async (params = {}) => {
    return await axiosInstance.get('/members', { params });
};

export const getActiveMembers = async (params) => {
    return await axiosInstance.get('/members/active', { params });
};

export const createMember = async (data) => {
    return await axiosInstance.post('/members', data);
};

export const updateMember = async (id, data) => {
    return await axiosInstance.put(`/members/${id}`, data);
};

export const deleteMember = async (id, params) => {
    return await axiosInstance.delete(`/members/${id}`, { params });
};

export const getGuests = async (params) => {
    return await axiosInstance.get('/members/guests/all', { params });
};
