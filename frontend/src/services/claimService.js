
import api from './api';

// Fetch all claims
export const getClaims = async () => {
    const response = await api.get('/claims');
    return response.data;
};

// Fetch pending claims (Staff/Admin)
export const getPendingClaims = async () => {
    const response = await api.get('/claims/pending');
    return response.data;
};

// Fetch claims awaiting ownership verification (Staff/Admin)
export const getVerificationQueue = async () => {
    const response = await api.get('/claims/verification-queue');
    return response.data;
};

// Submit a claim for an item
export const createClaim = async (claimData) => {
    const response = await api.post('/claims', claimData);
    return response.data;
};

// Approve or reject a claim (Staff/Admin)
export const updateClaimStatus = async (id, status) => {
    const response = await api.patch(`/claims/${id}/status`, {
        status,
    });

    return response.data;
};

// Record ownership verification (Staff/Admin)
export const verifyClaim = async (id, result, notes = '') => {
    const response = await api.patch(`/claims/${id}/verify`, {
        result,
        notes,
    });

    return response.data;
};
