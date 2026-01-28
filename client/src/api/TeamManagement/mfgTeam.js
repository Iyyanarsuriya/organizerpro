import axiosInstance from '../axiosInstance';

export const getMembers = (params) => axiosInstance.get('/manufacturing-sector/members', { params });
export const getActiveMembers = (params) => axiosInstance.get('/manufacturing-sector/members/active', { params });
export const createMember = (data) => axiosInstance.post('/manufacturing-sector/members', data);
export const updateMember = (id, data) => axiosInstance.put(`/manufacturing-sector/members/${id}`, data);
export const deleteMember = (id) => axiosInstance.delete(`/manufacturing-sector/members/${id}`);
export const getGuests = (params) => axiosInstance.get('/members/guests/all', { params });

export const getMemberRoles = (params) => axiosInstance.get('/manufacturing-sector/member-roles', { params });
export const createMemberRole = (data) => axiosInstance.post('/manufacturing-sector/member-roles', data);
export const deleteMemberRole = (id) => axiosInstance.delete(`/manufacturing-sector/member-roles/${id}`);
