import axiosInstance from '../axiosInstance';

export const getReminders = (params) => axiosInstance.get('/education-sector/reminders', { params });
export const createReminder = (data) => axiosInstance.post('/education-sector/reminders', data);
export const updateReminder = (id, data) => axiosInstance.put(`/education-sector/reminders/${id}`, data);
export const deleteReminder = (id, params) => axiosInstance.delete(`/education-sector/reminders/${id}`, { params });
export const triggerMissedAlert = (payload) => axiosInstance.post('/reminders/send-missed-alert', payload);

export const getCategories = (params = { sector: 'education' }) => axiosInstance.get('/categories', { params });
export const createCategory = (categoryData) => axiosInstance.post('/categories', { ...categoryData, sector: 'education' });
export const deleteCategory = (id, params = { sector: 'education' }) => axiosInstance.delete(`/categories/${id}`, { params });

// Notes
export const getNotes = (params = { sector: 'education' }) => axiosInstance.get('/notes', { params });
export const createNote = (data) => axiosInstance.post('/notes', { ...data, sector: 'education' });
export const updateNote = (id, data) => axiosInstance.put(`/notes/${id}`, { ...data, sector: 'education' });
export const deleteNote = (id, params = { sector: 'education' }) => axiosInstance.delete(`/notes/${id}`, { params });
