
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

import api from './api';
import {
    getClaims,
    getPendingClaims,
    getVerificationQueue,
    createClaim,
    updateClaimStatus,
    verifyClaim,
} from './claimService';

describe('Claim Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch all claims', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'claim-1', status: 'PENDING' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const result = await getClaims();

        expect(api.get).toHaveBeenCalledWith('/claims');
        expect(result).toEqual(mockData);
    });

    it('should fetch pending claims', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'claim-1', status: 'PENDING' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const result = await getPendingClaims();

        expect(api.get).toHaveBeenCalledWith('/claims/pending');
        expect(result).toEqual(mockData);
    });

    it('should fetch the ownership verification queue', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'claim-1', status: 'APPROVED' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const result = await getVerificationQueue();

        expect(api.get).toHaveBeenCalledWith(
            '/claims/verification-queue'
        );

        expect(result).toEqual(mockData);
    });

    it('should create a new claim', async () => {
        const claimData = {
            itemId: 'item-1',
            proof: {
                description: 'This item belongs to me',
                additionalDetails: 'Black laptop bag',
            },
        };

        const mockData = {
            success: true,
            data: { _id: 'claim-1', ...claimData },
        };

        api.post.mockResolvedValue({ data: mockData });

        const result = await createClaim(claimData);

        expect(api.post).toHaveBeenCalledWith(
            '/claims',
            claimData
        );

        expect(result).toEqual(mockData);
    });

    it('should update claim status', async () => {
        const mockData = {
            success: true,
            message: 'Claim status updated',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await updateClaimStatus(
            'claim-1',
            'APPROVED'
        );

        expect(api.patch).toHaveBeenCalledWith(
            '/claims/claim-1/status',
            { status: 'APPROVED' }
        );

        expect(result).toEqual(mockData);
    });

    it('should verify claim ownership with notes', async () => {
        const mockData = {
            success: true,
            message: 'Ownership verified',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await verifyClaim(
            'claim-1',
            'VERIFIED',
            'Student provided valid proof'
        );

        expect(api.patch).toHaveBeenCalledWith(
            '/claims/claim-1/verify',
            {
                result: 'VERIFIED',
                notes: 'Student provided valid proof',
            }
        );

        expect(result).toEqual(mockData);
    });
});
