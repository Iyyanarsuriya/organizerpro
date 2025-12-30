import axiosInstance from './axiosInstance';

export const getVapidPublicKey = async () => {
    return await axiosInstance.get('/push/public-key');
};

export const subscribeToPush = async (subscription) => {
    return await axiosInstance.post('/push/subscribe', subscription);
};

export const sendTestNotification = async () => {
    return await axiosInstance.post('/push/test');
};
