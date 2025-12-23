import axiosInstance from './axiosInstance';

export const login = async (credentials) => {
    return await axiosInstance.post('/auth/login', credentials);
};

export const signup = async (userData) => {
    return await axiosInstance.post('/auth/signup', userData);
};

export const getMe = async () => {
    return await axiosInstance.get('/auth/me');
};

export const updateProfile = async (userData) => {
    const isFormData = userData instanceof FormData;
    return await axiosInstance.put('/auth/profile', userData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    });
};

export const forgotPassword = async (email) => {
    return await axiosInstance.post('/auth/forgot-password', { email });
};

export const verifyOTP = async (email, otp) => {
    return await axiosInstance.post('/auth/verify-otp', { email, otp });
};

export const resetPasswordWithOTP = async (email, otp, password) => {
    return await axiosInstance.post('/auth/reset-password-otp', { email, otp, password });
};

export const resetPassword = async (token, password) => {
    return await axiosInstance.post(`/auth/reset-password/${token}`, { password });
};
