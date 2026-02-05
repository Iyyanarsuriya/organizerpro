import axiosInstance from '../axiosInstance';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hotel`;

// Units
export const getUnits = () => axiosInstance.get(`${BASE_URL}/units`);
export const createUnit = (data) => axiosInstance.post(`${BASE_URL}/units`, data);
export const updateUnit = (id, data) => axiosInstance.put(`${BASE_URL}/units/${id}`, data);

// Guests
export const getGuests = () => axiosInstance.get(`${BASE_URL}/guests`);
export const createGuest = (data) => axiosInstance.post(`${BASE_URL}/guests`, data);

// Bookings
export const getBookings = () => axiosInstance.get(`${BASE_URL}/bookings`);
export const createBooking = (data) => axiosInstance.post(`${BASE_URL}/bookings`, data);
export const updateBookingStatus = (id, status) => axiosInstance.put(`${BASE_URL}/bookings/${id}/status`, { status });

// Payments
export const getPaymentsByBooking = (bookingId) => axiosInstance.get(`${BASE_URL}/payments/booking/${bookingId}`);

// Ops
export const getMaintenance = () => axiosInstance.get(`${BASE_URL}/maintenance`);

// Settings
export const getSettings = () => axiosInstance.get(`${BASE_URL}/settings`);
export const updateSettings = (data) => axiosInstance.put(`${BASE_URL}/settings`, data);
