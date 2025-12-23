import axiosInstance from './axiosInstance';

export const getUserProfile = async () => {
    return await axiosInstance.get('/auth/me');
};
