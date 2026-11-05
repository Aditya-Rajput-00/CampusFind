
import api from './api';

// Fetch matches for the logged-in user.
export const getMatches = async () => {
    const response = await api.get('/matches');
    return response.data;
};

// Fetch pending matches (Staff/Admin).
export const getPendingMatches = async () => {
    const response = await api.get('/matches/pending');
    return response.data;
};

// Create a new match.
export const createMatch = async (matchData) => {
    const response = await api.post('/matches', matchData);
    return response.data;
};

// Confirm or reject a match (Staff/Admin).
export const updateMatchStatus = async (id, status) => {
    const response = await api.patch(`/matches/${id}/status`, {
        status,
    });

    return response.data;
};
