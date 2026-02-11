import axiosInstance from '../axiosInstance';

const BASE_URL = '/hotel-sector';

// Units
export const getUnits = () => axiosInstance.get(`${BASE_URL}/units`);
export const createUnit = (data) => axiosInstance.post(`${BASE_URL}/units`, data);
export const updateUnit = (id, data) => axiosInstance.put(`${BASE_URL}/units/${id}`, data);

// Bookings
export const getBookings = () => axiosInstance.get(`${BASE_URL}/bookings`);
export const createBooking = (data) => axiosInstance.post(`${BASE_URL}/bookings`, data);
export const updateBookingStatus = (id, status) => axiosInstance.put(`${BASE_URL}/bookings/${id}/status`, { status });

// Payments
export const getPaymentsByBooking = (bookingId) => axiosInstance.get(`${BASE_URL}/payments/booking/${bookingId}`);
export const addPayment = (data) => axiosInstance.post(`${BASE_URL}/payments`, data);
