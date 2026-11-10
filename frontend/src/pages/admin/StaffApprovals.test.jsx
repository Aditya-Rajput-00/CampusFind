
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StaffApprovals from './StaffApprovals';
import {
    getPendingStaff,
    approveStaff,
    rejectStaff,
} from '../../services/userService';

vi.mock('../../services/userService', () => ({
    getPendingStaff: vi.fn(),
    approveStaff: vi.fn(),
    rejectStaff: vi.fn(),
}));

describe('StaffApprovals Component Tests', () => {
    const mockStaff = [
        {
            _id: 'staff123',
            name: 'Test Staff',
            email: 'staff@test.com',
            department: 'Computer Science',
            phone: '9876543210',
            role: 'staff',
            accountStatus: 'pending',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        getPendingStaff.mockResolvedValue({
            success: true,
            message: 'Pending staff registrations fetched successfully',
            data: mockStaff,
        });
    });

    it('displays pending staff registrations', async () => {
        render(<StaffApprovals />);

        expect(await screen.findByText('Test Staff')).toBeInTheDocument();
        expect(screen.getByText('staff@test.com')).toBeInTheDocument();
        expect(screen.getByText('Computer Science')).toBeInTheDocument();

        expect(getPendingStaff).toHaveBeenCalledTimes(1);
    });

    it('displays an empty message when there are no pending requests', async () => {
        getPendingStaff.mockResolvedValue({
            success: true,
            data: [],
        });

        render(<StaffApprovals />);

        expect(
            await screen.findByText('No Pending Requests')
        ).toBeInTheDocument();
    });

    it('approves a staff account successfully', async () => {
        approveStaff.mockResolvedValue({
            success: true,
            message: 'Staff account approved successfully',
        });

        render(<StaffApprovals />);

        await screen.findByText('Test Staff');

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        await waitFor(() => {
            expect(approveStaff).toHaveBeenCalledWith('staff123');
        });

        expect(await screen.findByRole('status'))
            .toHaveTextContent('Staff account approved successfully');

        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
    });

    it('rejects a staff account successfully', async () => {
        rejectStaff.mockResolvedValue({
            success: true,
            message: 'Staff account rejected successfully',
        });

        render(<StaffApprovals />);

        await screen.findByText('Test Staff');

        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        await waitFor(() => {
            expect(rejectStaff).toHaveBeenCalledWith('staff123');
        });

        expect(await screen.findByRole('status'))
            .toHaveTextContent('Staff account rejected successfully');

        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
    });

    it('displays an error when pending staff cannot be fetched', async () => {
        getPendingStaff.mockRejectedValue({
            response: {
                data: {
                    message: 'Admin access required',
                },
            },
        });

        render(<StaffApprovals />);

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Admin access required');
    });

    it('displays an error when approval fails', async () => {
        approveStaff.mockRejectedValue({
            response: {
                data: {
                    message: 'Approval failed',
                },
            },
        });

        render(<StaffApprovals />);

        await screen.findByText('Test Staff');

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Approval failed');

        expect(screen.getByText('Test Staff')).toBeInTheDocument();
    });

    it('displays an error when rejection fails', async () => {
        rejectStaff.mockRejectedValue({
            response: {
                data: {
                    message: 'Rejection failed',
                },
            },
        });

        render(<StaffApprovals />);

        await screen.findByText('Test Staff');

        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Rejection failed');

        expect(screen.getByText('Test Staff')).toBeInTheDocument();
    });

    it('refreshes and displays updated pending staff registrations', async () => {
        const updatedStaff = [
            {
                _id: 'staff456',
                name: 'New Staff Member',
                email: 'newstaff@test.com',
                department: 'Information Technology',
                phone: '9876543211',
                role: 'staff',
                accountStatus: 'pending',
            },
        ];

        getPendingStaff
            .mockResolvedValueOnce({
                success: true,
                data: mockStaff,
            })
            .mockResolvedValueOnce({
                success: true,
                data: updatedStaff,
            });

        render(<StaffApprovals />);

        expect(await screen.findByText('Test Staff')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

        expect(
            await screen.findByText('New Staff Member')
        ).toBeInTheDocument();

        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();

        expect(getPendingStaff).toHaveBeenCalledTimes(2);
    });
});
