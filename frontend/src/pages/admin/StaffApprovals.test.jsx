import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import StaffApprovals from './StaffApprovals';
import { getUsers, getStaffAccounts, approveStaff, rejectStaff } from '../../services/userService';

vi.mock('../../services/userService', () => ({
    getUsers: vi.fn(),
    getStaffAccounts: vi.fn(),
    approveStaff: vi.fn(),
    rejectStaff: vi.fn(),
}));

const pendingStaff = {
    _id: 'staff123',
    name: 'Test Staff',
    email: 'staff@test.com',
    department: 'Computer Science',
    phone: '9876543210',
    role: 'staff',
    accountStatus: 'pending',
    createdAt: '2026-10-01T00:00:00.000Z',
};

const staffListResult = (data = [pendingStaff], pagination = {}) => ({
    success: true,
    data,
    pagination: { page: 1, limit: 10, totalRecords: data.length, totalPages: data.length ? 1 : 0, ...pagination },
});

describe('StaffApprovals', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUsers.mockImplementation(({ accountStatus } = {}) => Promise.resolve({
            success: true,
            pagination: { totalRecords: { pending: 8, approved: 15, rejected: 2 }[accountStatus] ?? 25 },
        }));
        getStaffAccounts.mockResolvedValue(staffListResult());
        approveStaff.mockResolvedValue({ success: true, message: 'Staff account approved successfully' });
        rejectStaff.mockResolvedValue({ success: true, message: 'Staff account rejected successfully' });
    });

    it('shows all four statistics from server pagination counts', async () => {
        render(<StaffApprovals />);
        expect(await screen.findByText('25')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(getUsers).toHaveBeenCalledTimes(4);
        expect(getUsers).toHaveBeenCalledWith({ role: 'staff', page: 1, limit: 1 });
        expect(getUsers).toHaveBeenCalledWith({ role: 'staff', accountStatus: 'rejected', page: 1, limit: 1 });
    });

    it('shows separate list and statistics loading states', async () => {
        let resolveStats;
        let resolveList;
        getUsers.mockReturnValue(new Promise((resolve) => { resolveStats = resolve; }));
        getStaffAccounts.mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
        render(<StaffApprovals />);
        expect(screen.getByText('Loading staff accounts…')).toBeInTheDocument();
        expect(screen.getByLabelText('Total Staff loading')).toHaveTextContent('…');
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalled());
        await act(async () => {
            resolveStats({ success: true, pagination: { totalRecords: 0 } });
            resolveList(staffListResult());
        });
        expect((await screen.findAllByText('Test Staff')).length).toBeGreaterThan(0);
        expect(screen.getByText('Total Staff')).toBeInTheDocument();
    });

    it('renders staff records and handles missing optional fields', async () => {
        getStaffAccounts.mockResolvedValueOnce(staffListResult([
            { ...pendingStaff, department: undefined, phone: undefined },
        ]));
        render(<StaffApprovals />);
        expect((await screen.findAllByText('Test Staff')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('staff@test.com').length).toBeGreaterThan(0);
        expect(screen.getAllByText('pending').length).toBeGreaterThan(0);
        expect(screen.queryByText('Not provided')).not.toBeInTheDocument();
    });

    it('sends a debounced server search by name or email', async () => {
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        const initialRequests = getStaffAccounts.mock.calls.length;
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search staff' }), { target: { value: 'sam@example.com' } });
        expect(getStaffAccounts).toHaveBeenCalledTimes(initialRequests);
        await waitFor(() => expect(getStaffAccounts).toHaveBeenLastCalledWith({ search: 'sam@example.com', page: 1, limit: 10 }), { timeout: 1500 });
    });

    it('does not show old records as results while the new search is debounced', async () => {
        const updatedStaff = { ...pendingStaff, _id: 'searched', name: 'New Search Result' };
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult())
            .mockResolvedValueOnce(staffListResult([updatedStaff]));
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search staff' }), { target: { value: 'new query' } });
        expect(screen.getByRole('status')).toHaveTextContent('Updating search results');
        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
        expect(await screen.findAllByText('New Search Result', {}, { timeout: 1500 })).not.toHaveLength(0);
    });

    it('settles outstanding list and statistics requests safely after unmount', async () => {
        let resolveList;
        const resolveStats = [];
        getStaffAccounts.mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));
        getUsers.mockImplementation(() => new Promise((resolve) => resolveStats.push(() => resolve({
            success: true,
            pagination: { totalRecords: 0 },
        }))));
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const { unmount } = render(<StaffApprovals />);
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(4));
        unmount();
        await act(async () => {
            resolveList(staffListResult());
            resolveStats.forEach((resolve) => resolve());
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('applies status filters to the server request', async () => {
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getByRole('button', { name: 'Approved' }));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenLastCalledWith({ accountStatus: 'approved', page: 1, limit: 10 }));
    });

    it('paginates using returned metadata', async () => {
        getStaffAccounts.mockResolvedValue(staffListResult([pendingStaff], { totalRecords: 11, totalPages: 2 }));
        render(<StaffApprovals />);
        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenLastCalledWith({ page: 2, limit: 10 }));
        expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
    });

    it('keeps pagination controls disabled while the requested page is loading', async () => {
        let resolvePage;
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult([pendingStaff], { totalRecords: 11, totalPages: 2 }))
            .mockReturnValueOnce(new Promise((resolve) => { resolvePage = resolve; }));
        render(<StaffApprovals />);
        await screen.findByText('Page 1 of 2');
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
        await act(async () => resolvePage(staffListResult([pendingStaff], { page: 2, totalRecords: 11, totalPages: 2 })));
    });

    it('ignores an older list response after a filter request becomes current', async () => {
        let resolveInitial;
        getStaffAccounts
            .mockReturnValueOnce(new Promise((resolve) => { resolveInitial = resolve; }))
            .mockResolvedValueOnce(staffListResult([{ ...pendingStaff, _id: 'new', name: 'Approved Staff', accountStatus: 'approved' }]));
        render(<StaffApprovals />);
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(1));
        fireEvent.click(screen.getByRole('button', { name: 'Approved' }));
        expect(await screen.findAllByText('Approved Staff')).not.toHaveLength(0);
        await act(async () => resolveInitial(staffListResult([pendingStaff])));
        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
        expect(screen.getAllByText('Approved Staff').length).toBeGreaterThan(0);
    });

    it('ignores an older search response after a newer search completes', async () => {
        let resolveFirstSearch;
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult())
            .mockReturnValueOnce(new Promise((resolve) => { resolveFirstSearch = resolve; }))
            .mockResolvedValueOnce(staffListResult([{ ...pendingStaff, _id: 'latest', name: 'Latest Search Result' }]));
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        const searchInput = screen.getByRole('searchbox', { name: 'Search staff' });
        fireEvent.change(searchInput, { target: { value: 'older query' } });
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2), { timeout: 2000 });
        fireEvent.change(searchInput, { target: { value: 'latest query' } });
        expect(await screen.findAllByText('Latest Search Result', {}, { timeout: 2000 })).not.toHaveLength(0);
        await act(async () => resolveFirstSearch(staffListResult([{ ...pendingStaff, name: 'Older Search Result' }])));
        expect(screen.queryByText('Older Search Result')).not.toBeInTheDocument();
        expect(screen.getAllByText('Latest Search Result').length).toBeGreaterThan(0);
    });

    it('keeps the newest statistics when an older statistics batch finishes later', async () => {
        const oldStatsResolvers = [];
        getUsers.mockImplementation(() => {
            if (oldStatsResolvers.length < 4) {
                return new Promise((resolve) => oldStatsResolvers.push(() => resolve({
                    success: true,
                    pagination: { totalRecords: 1 },
                })));
            }
            return Promise.resolve({ success: true, pagination: { totalRecords: 99 } });
        });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        expect(await screen.findByLabelText('Total Staff: 99')).toBeInTheDocument();
        await act(async () => oldStatsResolvers.forEach((resolve) => resolve()));
        expect(screen.getByLabelText('Total Staff: 99')).toBeInTheDocument();
        expect(screen.getByLabelText('Pending Approvals: 99')).toBeInTheDocument();
    });

    it('opens account details and shows safe available fields', async () => {
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        const opener = screen.getAllByRole('button', { name: 'View Details' })[0];
        opener.focus();
        fireEvent.click(opener);
        const dialog = screen.getByRole('dialog', { name: 'Account details' });
        expect(dialog).toContainElement(document.activeElement);
        expect(dialog).toHaveTextContent('Computer Science');
        expect(dialog).toHaveTextContent('9876543210');
        expect(dialog).toHaveTextContent('1 Oct 2026');
        expect(dialog).not.toHaveTextContent('passwordHash');
        fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await waitFor(() => expect(opener).toHaveFocus());
    });

    it('requires confirmation before approving and refreshes list and counts', async () => {
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        const dialog = screen.getByRole('dialog', { name: 'Approve staff account?' });
        expect(dialog).toHaveTextContent('Test Staff');
        expect(approveStaff).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        await waitFor(() => expect(approveStaff).toHaveBeenCalledWith('staff123'));
        expect(await screen.findByRole('status')).toHaveTextContent('Staff account approved successfully');
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
    });

    it('shows approval API failure feedback without a success message', async () => {
        approveStaff.mockRejectedValueOnce({ response: { data: { message: 'Approval failed' } } });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        expect(await screen.findByText('Approval failed')).toBeInTheDocument();
        expect(screen.queryByText(/approved successfully/i)).not.toBeInTheDocument();
    });

    it('confirms rejection before calling the existing service', async () => {
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
        expect(screen.getByRole('dialog', { name: 'Reject staff account?' })).toBeInTheDocument();
        expect(rejectStaff).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));
        await waitFor(() => expect(rejectStaff).toHaveBeenCalledWith('staff123'));
        expect(await screen.findByRole('status')).toHaveTextContent('Staff account rejected successfully');
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
    });

    it('shows rejection API failure feedback without a success message', async () => {
        rejectStaff.mockRejectedValueOnce({ response: { data: { message: 'Rejection failed' } } });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Rejection failed');
        expect(screen.queryByText(/rejected successfully/i)).not.toBeInTheDocument();
    });

    it('refreshes the list and all statistics after an approval 409 conflict', async () => {
        approveStaff.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Conflict' } } });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('This account status changed while you were reviewing it. The latest account information has been refreshed.');
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        expect(screen.queryByText(/approved successfully/i)).not.toBeInTheDocument();
    });

    it('shows incomplete refresh feedback when a 409 list refresh fails', async () => {
        approveStaff.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Conflict' } } });
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult())
            .mockRejectedValueOnce({ response: { data: { message: 'Refresh failed' } } });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        expect(await screen.findByText(/latest information could not be fully refreshed/)).toBeInTheDocument();
        expect(screen.getByText('Staff list unavailable')).toBeInTheDocument();
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
    });

    it('shows incomplete refresh feedback when a 409 statistics refresh fails', async () => {
        approveStaff.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Conflict' } } });
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        await screen.findByText('25');
        getUsers.mockRejectedValue({ response: { data: { message: 'Statistics refresh failed' } } });
        fireEvent.click(screen.getAllByRole('button', { name: 'Approve' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm approval' }));
        expect(await screen.findByText(/latest information could not be fully refreshed/)).toBeInTheDocument();
        expect(await screen.findAllByText('Statistics refresh failed')).not.toHaveLength(0);
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
    });

    it('reconciles a rejection 409 and displays the refreshed account status', async () => {
        rejectStaff.mockRejectedValueOnce({ response: { status: 409, data: { message: 'Conflict' } } });
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult())
            .mockResolvedValueOnce(staffListResult([{ ...pendingStaff, _id: 'updated', name: 'Refreshed Staff', accountStatus: 'approved' }]));
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        await screen.findByText('25');
        getUsers.mockImplementation(() => Promise.resolve({ success: true, pagination: { totalRecords: 22 } }));
        fireEvent.click(screen.getAllByRole('button', { name: 'Reject' })[0]);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm rejection' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('This account status changed while you were reviewing it. The latest account information has been refreshed.');
        expect(await screen.findAllByText('Refreshed Staff')).not.toHaveLength(0);
        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
        expect(screen.getAllByText('approved').length).toBeGreaterThan(0);
        expect(screen.getByLabelText('Total Staff: 22')).toBeInTheDocument();
        expect(screen.queryByText(/rejected successfully/i)).not.toBeInTheDocument();
        await waitFor(() => expect(rejectStaff).toHaveBeenCalledWith('staff123'));
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
    });

    it('manually refreshes the current list and all four statistics', async () => {
        const updatedStaff = { ...pendingStaff, _id: 'updated', name: 'Updated Staff', accountStatus: 'approved' };
        getStaffAccounts
            .mockResolvedValueOnce(staffListResult())
            .mockResolvedValueOnce(staffListResult([updatedStaff]));
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        await screen.findByText('25');
        getUsers.mockImplementation(() => Promise.resolve({ success: true, pagination: { totalRecords: 31 } }));
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(await screen.findAllByText('Updated Staff')).not.toHaveLength(0);
        expect(screen.queryByText('Test Staff')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Total Staff: 31')).toBeInTheDocument();
        await waitFor(() => expect(getStaffAccounts).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(getUsers).toHaveBeenCalledTimes(8));
    });

    it('does not offer approval actions for non-pending accounts', async () => {
        getStaffAccounts.mockResolvedValueOnce(staffListResult([
            { ...pendingStaff, accountStatus: 'approved' },
        ]));
        render(<StaffApprovals />);
        await screen.findAllByText('Test Staff');
        expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    });

    it('shows an empty state and handles zero counts', async () => {
        getUsers.mockResolvedValue({ success: true, pagination: { totalRecords: 0 } });
        getStaffAccounts.mockResolvedValueOnce(staffListResult([], { totalRecords: 0, totalPages: 0 }));
        render(<StaffApprovals />);
        expect(await screen.findByText('No staff accounts found')).toBeInTheDocument();
        expect(await screen.findAllByText('0')).toHaveLength(4);
        expect(screen.queryByRole('navigation', { name: 'Staff accounts pages' })).not.toBeInTheDocument();
    });

    it('shows a no-results message for a search with no matches', async () => {
        getStaffAccounts.mockResolvedValue(staffListResult([], { totalRecords: 0, totalPages: 0 }));
        render(<StaffApprovals />);
        await screen.findByText('No staff accounts found');
        fireEvent.change(screen.getByRole('searchbox', { name: 'Search staff' }), { target: { value: 'missing person' } });
        expect(await screen.findByText('No matching staff accounts')).toBeInTheDocument();
    });

    it('shows API errors for the list and statistics', async () => {
        getStaffAccounts.mockRejectedValueOnce({ response: { data: { message: 'Staff list denied' } } });
        getUsers.mockRejectedValue({ response: { data: { message: 'Statistics denied' } } });
        render(<StaffApprovals />);
        expect(await screen.findByText('Staff list unavailable')).toBeInTheDocument();
        expect(screen.getByText('Staff list denied')).toBeInTheDocument();
        expect(screen.getByText('Statistics denied')).toBeInTheDocument();
    });
});
