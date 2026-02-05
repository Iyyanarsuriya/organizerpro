import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector';

export const getMembers = (params) => axiosInstance.get(`${BASE_URL}/members`, { params });
export const getActiveMembers = (params) => axiosInstance.get(`${BASE_URL}/members/active`, { params });
export const createMember = (data) => axiosInstance.post(`${BASE_URL}/members`, data);
export const updateMember = (id, data) => axiosInstance.put(`${BASE_URL}/members/${id}`, data);
export const deleteMember = (id, params) => axiosInstance.delete(`${BASE_URL}/members/${id}`, { params });
export const getGuests = (params) => axiosInstance.get(`${BASE_URL}/members/guests/all`, { params });

export const getMemberRoles = (params) => axiosInstance.get(`${BASE_URL}/member-roles`, { params });
export const createMemberRole = (data) => axiosInstance.post(`${BASE_URL}/member-roles`, data);
export const deleteMemberRole = (id, params) => axiosInstance.delete(`${BASE_URL}/member-roles/${id}`, { params });
