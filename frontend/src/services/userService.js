
import api from './api';

// Fetch a safe, paginated user directory (admin authorization is enforced by the API).
export const getUsers = async (filters = {}) => {
    const response = await api.get('/users', { params: filters });
    return response.data;
};

// Fetch all staff registrations waiting for admin approval.
export const getPendingStaff = async () => {
    const response = await api.get('/users/pending-staff');
    return response.data;
};

// Fetch a safe, paginated staff directory (admin authorization is enforced by the API).
export const getStaffAccounts = async (filters = {}) => {
    const response = await api.get('/users/staff', { params: filters });
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
