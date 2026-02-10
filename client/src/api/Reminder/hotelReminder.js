import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector';

// Reminders
export const getReminders = (params) => axiosInstance.get(`${BASE_URL}/reminders`, { params });
export const createReminder = (data) => axiosInstance.post(`${BASE_URL}/reminders`, data);
export const updateReminder = (id, data) => axiosInstance.put(`${BASE_URL}/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`${BASE_URL}/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/reminders/send-missed-alert', payload);

// Categories
export const getCategories = (params = { sector: 'hotel' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', { ...categoryData, sector: 'hotel' });
export const deleteCategory = (id, params = { sector: 'hotel' }) => axiosInstance.delete(`/categories/${id}`, { params });

// Notes
// Notes
export const getNotes = (params = { sector: 'hotel' }) => axiosInstance.get('/hotel-sector/notes', { params });
export const createNote = (data) => axiosInstance.post('/hotel-sector/notes', { ...data, sector: 'hotel' });
export const updateNote = (id, data) => axiosInstance.put(`/hotel-sector/notes/${id}`, { ...data, sector: 'hotel' });
export const deleteNote = (id, params = { sector: 'hotel' }) => axiosInstance.delete(`/hotel-sector/notes/${id}`, { params });
