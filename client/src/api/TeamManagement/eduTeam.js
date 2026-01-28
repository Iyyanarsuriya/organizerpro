import axiosInstance from '../axiosInstance';

export const getMembers = (params) => axiosInstance.get('/education-sector/members', { params });
export const getActiveMembers = (params) => axiosInstance.get('/education-sector/members/active', { params });
export const createMember = (data) => axiosInstance.post('/education-sector/members', data);
export const updateMember = (id, data) => axiosInstance.put(`/education-sector/members/${id}`, data);
export const deleteMember = (id) => axiosInstance.delete(`/education-sector/members/${id}`);

export const getMemberRoles = (params) => axiosInstance.get('/education-sector/member-roles', { params });
export const createMemberRole = (data) => axiosInstance.post('/education-sector/member-roles', data);
export const deleteMemberRole = (id) => axiosInstance.delete(`/education-sector/member-roles/${id}`);

export const getDepartments = (params) => axiosInstance.get('/education-sector/departments', { params });
export const createDepartment = (data) => axiosInstance.post('/education-sector/departments', data);
export const deleteDepartment = (id) => axiosInstance.delete(`/education-sector/departments/${id}`);
