import axiosInstance from '../axiosInstance';

// Members
export const getMembers = (params) => axiosInstance.get('/members', { params });
export const getActiveMembers = (params) => axiosInstance.get('/members/active', { params });
export const createMember = (data) => axiosInstance.post('/members', data);
export const updateMember = (id, data) => axiosInstance.put(`/members/${id}`, data);
export const deleteMember = (id, params) => axiosInstance.delete(`/members/${id}`, { params });
export const getGuests = (params) => axiosInstance.get('/members/guests/all', { params });

// Roles
export const getMemberRoles = (params) => axiosInstance.get('/member-roles', { params });
export const createMemberRole = (data) => axiosInstance.post('/member-roles', data);
export const deleteMemberRole = (id, params) => axiosInstance.delete(`/member-roles/${id}`, { params });

// Departments
export const getDepartments = (params) => axiosInstance.get('/departments', { params });
export const createDepartment = (data) => axiosInstance.post('/departments', data);
export const deleteDepartment = (id, params) => axiosInstance.delete(`/departments/${id}`, { params });
