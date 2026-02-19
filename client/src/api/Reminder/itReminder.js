import axiosInstance from '../axiosInstance';

export const getReminders = (params) => axiosInstance.get('/it-sector/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/it-sector/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/it-sector/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/it-sector/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/it-sector/reminders/send-missed-alert', payload);

const BASE_URL = '/it-sector';

export const getCategories = (params) => axiosInstance.get(`${BASE_URL}/reminder-categories`, { params });
export const createCategory = (categoryData) => axiosInstance.post(`${BASE_URL}/reminder-categories`, categoryData);
export const deleteCategory = (id, params) => axiosInstance.delete(`${BASE_URL}/reminder-categories/${id}`, { params });

// Notes
// Notes
export const getNotes = (params = { sector: 'it' }) => axiosInstance.get('/it-sector/notes', { params });
export const createNote = (data) => axiosInstance.post('/it-sector/notes', { ...data, sector: 'it' });
export const updateNote = (id, data) => axiosInstance.put(`/it-sector/notes/${id}`, { ...data, sector: 'it' });
export const deleteNote = (id, params = { sector: 'it' }) => axiosInstance.delete(`/it-sector/notes/${id}`, { params });
