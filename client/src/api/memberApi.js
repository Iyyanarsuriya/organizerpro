import axiosInstance from './axiosInstance';

export const getMembers = async (params = {}) => {
    return await axiosInstance.get('/members', { params });
};

export const getActiveMembers = async () => {
    return await axiosInstance.get('/members/active');
};

export const createMember = async (data) => {
    return await axiosInstance.post('/members', data);
};

export const updateMember = async (id, data) => {
    return await axiosInstance.put(`/members/${id}`, data);
};

export const deleteMember = async (id) => {
    return await axiosInstance.delete(`/members/${id}`);
};

export const getGuests = async () => {
    return await axiosInstance.get('/members/guests/all');
};
