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
// Notes
export const getNotes = (params = { sector: 'manufacturing' }) => axiosInstance.get('/manufacturing-sector/notes', { params });
export const createNote = (data) => axiosInstance.post('/manufacturing-sector/notes', { ...data, sector: 'manufacturing' });
export const updateNote = (id, data) => axiosInstance.put(`/manufacturing-sector/notes/${id}`, { ...data, sector: 'manufacturing' });
export const deleteNote = (id, params = { sector: 'manufacturing' }) => axiosInstance.delete(`/manufacturing-sector/notes/${id}`, { params });
