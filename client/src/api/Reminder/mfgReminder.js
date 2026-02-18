import axiosInstance from '../axiosInstance';

export const getReminders = (params) => axiosInstance.get('/manufacturing-sector/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/manufacturing-sector/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/manufacturing-sector/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/manufacturing-sector/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/manufacturing-sector/reminders/send-missed-alert', payload);

export const getCategories = (params) => axiosInstance.get('/manufacturing-sector/reminder-categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/manufacturing-sector/reminder-categories', categoryData);
export const deleteCategory = (id, params) => axiosInstance.delete(`/manufacturing-sector/reminder-categories/${id}`, { params });

// Notes
// Notes
export const getNotes = (params = { sector: 'manufacturing' }) => axiosInstance.get('/manufacturing-sector/notes', { params });
export const createNote = (data) => axiosInstance.post('/manufacturing-sector/notes', { ...data, sector: 'manufacturing' });
export const updateNote = (id, data) => axiosInstance.put(`/manufacturing-sector/notes/${id}`, { ...data, sector: 'manufacturing' });
export const deleteNote = (id, params = { sector: 'manufacturing' }) => axiosInstance.delete(`/manufacturing-sector/notes/${id}`, { params });
