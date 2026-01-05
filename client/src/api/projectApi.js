import axiosInstance from './axiosInstance';

export const getProjects = () => axiosInstance.get('/projects');
export const createProject = (data) => axiosInstance.post('/projects', data);
export const deleteProject = (id) => axiosInstance.delete(`/projects/${id}`);
