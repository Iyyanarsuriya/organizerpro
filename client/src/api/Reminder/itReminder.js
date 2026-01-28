import axiosInstance from '../axiosInstance';

export const getReminders = (params) => axiosInstance.get('/it-sector/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/it-sector/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/it-sector/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/it-sector/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/reminders/send-missed-alert', payload);

export const getCategories = (params = { sector: 'it' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', { ...categoryData, sector: 'it' });
export const deleteCategory = (id, params = { sector: 'it' }) => axiosInstance.delete(`/categories/${id}`, { params });

// Notes
export const getNotes = (params = { sector: 'it' }) => axiosInstance.get('/notes', { params });
export const createNote = (data) => axiosInstance.post('/notes', { ...data, sector: 'it' });
export const updateNote = (id, data) => axiosInstance.put(`/notes/${id}`, { ...data, sector: 'it' });
export const deleteNote = (id, params = { sector: 'it' }) => axiosInstance.delete(`/notes/${id}`, { params });
