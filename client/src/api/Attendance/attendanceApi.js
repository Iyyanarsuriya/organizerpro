import axiosInstance from '../axiosInstance';

export const getProjects = (params) => axiosInstance.get('/projects', { params });
export const createProject = (data) => axiosInstance.post('/projects', data);
export const deleteProject = (id, params) => axiosInstance.delete(`/projects/${id}`, { params });
