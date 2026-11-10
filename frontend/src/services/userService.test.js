
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import {
    getPendingStaff,
    approveStaff,
    rejectStaff,
} from './userService';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('userService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches pending staff registrations', async () => {
        const mockData = [
            {
                _id: 'staff123',
                name: 'Test Staff',
                email: 'staff@test.com',
                role: 'staff',
                accountStatus: 'pending',
            },
        ];

        api.get.mockResolvedValue({
            data: {
                success: true,
                message: 'Pending staff registrations fetched successfully',
                data: mockData,
            },
        });

        const result = await getPendingStaff();

        expect(api.get).toHaveBeenCalledWith('/users/pending-staff');
        expect(result.data).toEqual(mockData);
    });

    it('approves a pending staff account', async () => {
        const mockResponse = {
            success: true,
            message: 'Staff account approved successfully',
            data: {
                user: {
                    id: 'staff123',
                    name: 'Test Staff',
                    accountStatus: 'approved',
                },
            },
        };

        api.patch.mockResolvedValue({
            data: mockResponse,
        });

        const result = await approveStaff('staff123');

        expect(api.patch).toHaveBeenCalledWith(
            '/users/staff123/approve'
        );
        expect(result).toEqual(mockResponse);
    });

    it('rejects a pending staff account', async () => {
        const mockResponse = {
            success: true,
            message: 'Staff account rejected successfully',
            data: {
                user: {
                    id: 'staff123',
                    name: 'Test Staff',
                    accountStatus: 'rejected',
                },
            },
        };

        api.patch.mockResolvedValue({
            data: mockResponse,
        });

        const result = await rejectStaff('staff123');

        expect(api.patch).toHaveBeenCalledWith(
            '/users/staff123/reject'
        );
        expect(result).toEqual(mockResponse);
    });
});
