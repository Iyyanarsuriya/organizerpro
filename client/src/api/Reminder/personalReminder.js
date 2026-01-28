import axiosInstance from '../axiosInstance';

// General Reminders
export const getReminders = (params) => axiosInstance.get('/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/reminders/send-missed-alert', payload);

// Categories
export const getCategories = (params = { sector: 'personal' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', categoryData);
export const deleteCategory = (id, params = { sector: 'personal' }) => axiosInstance.delete(`/categories/${id}`, { params });

// Notes
export const getNotes = (params = { sector: 'personal' }) => axiosInstance.get('/notes', { params });
export const createNote = (data) => axiosInstance.post('/notes', { ...data, sector: data.sector || 'personal' });
export const updateNote = (id, data) => axiosInstance.put(`/notes/${id}`, { ...data, sector: data.sector || 'personal' });
export const deleteNote = (id, params = { sector: 'personal' }) => axiosInstance.delete(`/notes/${id}`, { params });

// Push Notifications
export const getVapidPublicKey = () => axiosInstance.get('/push/public-key');
export const subscribeToPush = (subscription) => axiosInstance.post('/push/subscribe', subscription);
export const sendTestNotification = () => axiosInstance.post('/push/test');
