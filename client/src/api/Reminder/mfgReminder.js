import axiosInstance from '../axiosInstance';

export const getReminders = (params) => axiosInstance.get('/manufacturing-sector/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/manufacturing-sector/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/manufacturing-sector/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/manufacturing-sector/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/reminders/send-missed-alert', payload);

export const getCategories = (params = { sector: 'manufacturing' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', { ...categoryData, sector: 'manufacturing' });
export const deleteCategory = (id, params = { sector: 'manufacturing' }) => axiosInstance.delete(`/categories/${id}`, { params });

// Notes
export const getNotes = (params = { sector: 'manufacturing' }) => axiosInstance.get('/notes', { params });
export const createNote = (data) => axiosInstance.post('/notes', { ...data, sector: 'manufacturing' });
export const updateNote = (id, data) => axiosInstance.put(`/notes/${id}`, { ...data, sector: 'manufacturing' });
export const deleteNote = (id, params = { sector: 'manufacturing' }) => axiosInstance.delete(`/notes/${id}`, { params });
