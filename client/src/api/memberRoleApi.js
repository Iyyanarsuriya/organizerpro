import axios from './axiosInstance';

export const getMemberRoles = (params) => axios.get('/member-roles', { params });
export const createMemberRole = (data) => axios.post('/member-roles', data);
export const deleteMemberRole = (id, params) => axios.delete(`/member-roles/${id}`, { params });
