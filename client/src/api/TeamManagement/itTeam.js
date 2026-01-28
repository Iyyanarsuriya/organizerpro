import axiosInstance from '../axiosInstance';

export const getMembers = (params) => axiosInstance.get('/it-sector/members', { params });
export const getActiveMembers = (params) => axiosInstance.get('/it-sector/members/active', { params });
export const createMember = (data) => axiosInstance.post('/it-sector/members', data);
export const updateMember = (id, data) => axiosInstance.put(`/it-sector/members/${id}`, data);
export const deleteMember = (id) => axiosInstance.delete(`/it-sector/members/${id}`);
export const getGuests = (params) => axiosInstance.get('/members/guests/all', { params });

export const getMemberRoles = (params) => axiosInstance.get('/it-sector/member-roles', { params });
export const createMemberRole = (data) => axiosInstance.post('/it-sector/member-roles', data);
export const deleteMemberRole = (id) => axiosInstance.delete(`/it-sector/member-roles/${id}`);

export const getProjects = (params) => axiosInstance.get('/it-sector/projects', { params });
export const createProject = (data) => axiosInstance.post('/it-sector/projects', data);
export const deleteProject = (id) => axiosInstance.delete(`/it-sector/projects/${id}`);

