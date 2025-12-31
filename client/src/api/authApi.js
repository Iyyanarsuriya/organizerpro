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
    return await axiosInstance.put('/auth/profile', userData);
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

export const getGoogleAuthUrl = async () => {
    return await axiosInstance.get('/auth/google');
};

export const disconnectGoogle = async () => {
    return await axiosInstance.post('/auth/google/disconnect');
};
