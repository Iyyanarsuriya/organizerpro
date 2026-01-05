import axiosInstance from './axiosInstance';

export const getReminders = async () => {
    return await axiosInstance.get('/reminders');
};

export const createReminder = async (reminderData) => {
    return await axiosInstance.post('/reminders', reminderData);
};

export const updateReminder = async (id, updateData) => {
    return await axiosInstance.put(`/reminders/${id}`, updateData);
};

export const deleteReminder = async (id) => {
    return await axiosInstance.delete(`/reminders/${id}`);
};

export const triggerMissedAlert = async (dateOrOptions = null) => {
    let payload = {};
    if (typeof dateOrOptions === 'string') {
        payload = { date: dateOrOptions };
    } else if (typeof dateOrOptions === 'object' && dateOrOptions !== null) {
        payload = dateOrOptions;
    }
    return await axiosInstance.post('/reminders/send-missed-alert', payload);
};
