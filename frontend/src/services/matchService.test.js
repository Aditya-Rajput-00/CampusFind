
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
    getMatches,
    getPendingMatches,
    createMatch,
    updateMatchStatus,
} from './matchService';

describe('Match Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch matches for the logged-in user', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'match-1', status: 'PENDING' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const result = await getMatches();

        expect(api.get).toHaveBeenCalledWith('/matches');
        expect(result).toEqual(mockData);
    });

    it('should fetch pending matches', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'match-1', status: 'PENDING' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const result = await getPendingMatches();

        expect(api.get).toHaveBeenCalledWith('/matches/pending');
        expect(result).toEqual(mockData);
    });

    it('should create a new match', async () => {
        const matchData = {
            lostItemId: 'lost-item-1',
            foundItemId: 'found-item-1',
        };

        const mockData = {
            success: true,
            data: { _id: 'match-1', ...matchData },
        };

        api.post.mockResolvedValue({ data: mockData });

        const result = await createMatch(matchData);

        expect(api.post).toHaveBeenCalledWith(
            '/matches',
            matchData
        );

        expect(result).toEqual(mockData);
    });

    it('should update match status', async () => {
        const mockData = {
            success: true,
            message: 'Match status updated',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await updateMatchStatus(
            'match-1',
            'CONFIRMED'
        );

        expect(api.patch).toHaveBeenCalledWith(
            '/matches/match-1/status',
            { status: 'CONFIRMED' }
        );

        expect(result).toEqual(mockData);
    });
});
