
import api from './api';

// Fetch all staff registrations waiting for admin approval.
export const getPendingStaff = async () => {
    const response = await api.get('/users/pending-staff');
    return response.data;
};

// Approve a pending staff account.
export const approveStaff = async (id) => {
    const response = await api.patch(`/users/${id}/approve`);
    return response.data;
};

// Reject a pending staff account.
export const rejectStaff = async (id) => {
    const response = await api.patch(`/users/${id}/reject`);
    return response.data;
};
