
import api from './api';

// Fetch dashboard statistics for staff and admin users.
export const getDashboardStats = async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
};
