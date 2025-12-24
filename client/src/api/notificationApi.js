import axiosInstance from './axiosInstance';

export const subscribeToPush = async (subscription) => {
    return await axiosInstance.post('/notifications/subscribe', { subscription });
};
