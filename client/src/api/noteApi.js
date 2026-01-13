import axios from './axiosInstance';

export const getNotes = async () => axios.get('/notes');
export const createNote = async (data) => axios.post('/notes', data);
export const updateNote = async (id, data) => axios.put(`/notes/${id}`, data);
export const deleteNote = async (id) => axios.delete(`/notes/${id}`);
