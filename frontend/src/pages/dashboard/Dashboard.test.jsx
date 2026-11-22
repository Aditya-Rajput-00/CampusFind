import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { getStats, getItems, getClaims, getMatches, getUsers, getApprovedStudents, deleteUserAccount, useAuth } = vi.hoisted(() => ({
    getStats: vi.fn(), getItems: vi.fn(), getClaims: vi.fn(), getMatches: vi.fn(), getUsers: vi.fn(), getApprovedStudents: vi.fn(), deleteUserAccount: vi.fn(), useAuth: vi.fn(),
}));

vi.mock('../../context/useAuth.js', () => ({ useAuth }));
vi.mock('../../services/dashboardService', () => ({ getDashboardStats: getStats }));
vi.mock('../../services/itemService', () => ({ getItems }));
vi.mock('../../services/claimService', () => ({ getClaims }));
vi.mock('../../services/matchService', () => ({ getMatches }));
vi.mock('../../services/userService', () => ({ getUsers, getApprovedStudents, deleteUserAccount }));

import Dashboard from './Dashboard';

const stats = { totalUsers: 18, totalStudents: 42, totalItems: 25, lostItems: 11, foundItems: 14, activeItems: 16, returnedItems: 3, pendingClaims: 4, pendingMatches: 2 };
const paged = (data = [], pagination = {}) => ({ success: true, data, pagination: { page: 1, limit: 10, totalRecords: data.length, totalPages: 1, ...pagination } });
const itemPage = (items = []) => ({ success: true, data: { items, pagination: { page: 1, limit: 10, totalItems: items.length, totalPages: 1 } } });

describe('Dashboard management view', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: { role: 'admin' } });
        getStats.mockResolvedValue({ success: true, data: stats });
        getItems.mockResolvedValue(itemPage());
        getClaims.mockResolvedValue(paged());
        getMatches.mockResolvedValue(paged());
        getUsers.mockResolvedValue(paged());
        getApprovedStudents.mockResolvedValue(paged());
        deleteUserAccount.mockResolvedValue({ success: true, message: 'Account deleted successfully' });
    });

    it('renders all eight statistics as accessible controls', async () => {
        render(<Dashboard />);

        for (const label of [
            'Total Users',
            'Total Items',
            'Lost Items',
            'Found Items',
            'Active Items',
            'Returned Items',
            'Pending Claims',
            'Pending Matches',
        ]) {
            expect(await screen.findByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
        }

        expect(screen.getByRole('button', { name: /Total Users/ })).toHaveTextContent('18');
        expect(screen.getByRole('heading', { name: 'Campus activity' })).toBeInTheDocument();
    });

    it('shows an accessible Lost versus Found comparison using actual statistic values', async () => {
        render(<Dashboard />);

        expect(await screen.findByRole('img', {
            name: /Lost versus Found comparison\. 11 lost items and 14 found items/,
        })).toBeInTheDocument();
        expect(screen.getByText('Lost items')).toBeInTheDocument();
        expect(screen.getByText('Found items')).toBeInTheDocument();
    });

    it('renders zero counts with zero-width bars when no items are reported', async () => {
        getStats.mockResolvedValueOnce({
            success: true,
            data: { ...stats, lostItems: 0, foundItems: 0 },
        });
        const { container } = render(<Dashboard />);

        expect(await screen.findByRole('img', {
            name: /0 lost items and 0 found items/,
        })).toBeInTheDocument();
        expect(container.querySelector('.dashboard-comparison-bar.lost')).toHaveStyle({ width: '0%' });
        expect(container.querySelector('.dashboard-comparison-bar.found')).toHaveStyle({ width: '0%' });
    });

    it('loads the selected item section using its server filter and can return to overview', async () => {
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Lost Items/ }));
        expect(await screen.findByRole('heading', { name: 'Lost items' })).toBeInTheDocument();
        await waitFor(() => expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ type: 'lost', page: 1, limit: 10 })));
        fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
        expect(screen.queryByRole('heading', { name: 'Lost items' })).not.toBeInTheDocument();
    });

    it('loads claims and matches only when their cards are selected', async () => {
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Pending Claims/ }));
        await waitFor(() => expect(getClaims).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10, status: 'PENDING' })));
        fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
        fireEvent.click(screen.getByRole('button', { name: /Pending Matches/ }));
        await waitFor(() => expect(getMatches).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10, status: 'PENDING' })));
    });

    it('opens Total Users and lists all account types without empty filters', async () => {
        getUsers.mockResolvedValue(paged([
            {
                _id: 'staff-1',
                name: 'Asha Rao',
                email: 'asha@example.test',
                role: 'staff',
                accountStatus: 'approved',
                department: 'Library',
                createdAt: '2026-01-10',
            },
        ]));

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));

        expect(await screen.findByText('asha@example.test')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        expect(screen.getByText('1 record')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Total Users/ })).toHaveTextContent('18');

        expect(getUsers).toHaveBeenCalledWith({ page: 1, limit: 10, search: '' });
    });

    it('searches user records by name or email', async () => {
        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));

        fireEvent.change(screen.getByLabelText('Search'), {
            target: { value: 'asha' },
        });

        await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith({
            page: 1,
            limit: 10,
            search: 'asha',
        }));
    });
    it('applies role and account-status filters only when selected', async () => {
        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));

        fireEvent.change(screen.getByLabelText('Role'), {
            target: { value: 'staff' },
        });

        await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith({
            page: 1,
            limit: 10,
            search: '',
            role: 'staff',
        }));

        fireEvent.change(screen.getByLabelText('Account status'), {
            target: { value: 'approved' },
        });

        await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith({
            page: 1,
            limit: 10,
            search: '',
            role: 'staff',
            accountStatus: 'approved',
        }));
    });
    it('paginates the user directory with the server page metadata', async () => {
        getUsers.mockImplementation(({ page }) => Promise.resolve(paged(
            [{ name: `User ${page}`, email: `user${page}@example.test`, role: 'student', accountStatus: 'approved' }],
            { page, totalRecords: 21, totalPages: 3 },
        )));

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));

        expect(await screen.findByText('User 1')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        expect(await screen.findByText('User 2')).toBeInTheDocument();
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        expect(getUsers).toHaveBeenLastCalledWith({ page: 2, limit: 10, search: '' });
    });

    it('shows backend validation details instead of a misleading empty directory', async () => {
        getUsers.mockRejectedValueOnce({
            response: {
                status: 400,
                data: {
                    success: false,
                    message: 'Validation failed',
                    errors: [{ path: 'role', msg: 'role has an unsupported value' }],
                },
            },
        });
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Validation failed: role: role has an unsupported value');
        expect(screen.queryByRole('heading', { name: 'No records found' }))
            .not.toBeInTheDocument();
        expect(screen.getByText('Record count unavailable')).toBeInTheDocument();
    });

    it('confirms admin deletion, refreshes the directory and refreshes dashboard totals', async () => {
        const student = {
            _id: 'student-1',
            name: 'Asha Rao',
            email: 'asha@example.test',
            role: 'student',
            accountStatus: 'approved',
            department: 'Science',
            createdAt: '2026-01-10',
        };

        getStats
            .mockResolvedValueOnce({ success: true, data: stats })
            .mockResolvedValueOnce({
                success: true,
                data: { ...stats, totalStudents: 41, totalUsers: 17 },
            });

        getUsers
            .mockResolvedValueOnce(paged([student]))
            .mockResolvedValueOnce(paged([]));

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));
        fireEvent.click(await screen.findByRole('button', { name: 'Delete Asha Rao' }));

        const dialog = screen.getByRole('dialog', { name: 'Delete account?' });

        expect(dialog).toHaveTextContent('Asha Rao');
        expect(dialog).toHaveTextContent('asha@example.test');

        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

        await waitFor(() => expect(deleteUserAccount).toHaveBeenCalledWith('student-1'));

        expect(await screen.findByText('Asha Rao was deleted. Account history has been retained.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Total Users/ })).toHaveTextContent('17');
        expect(await screen.findByRole('heading', { name: 'No records found' })).toBeInTheDocument();
        expect(getUsers).toHaveBeenCalledTimes(2);
        expect(getStats).toHaveBeenCalledTimes(2);
    });

    it('prevents duplicate account deletion submissions and shows deletion errors', async () => {
        let resolveDeletion;
        deleteUserAccount.mockReturnValueOnce(new Promise((resolve) => { resolveDeletion = resolve; }));
        getUsers.mockResolvedValue(paged([{ _id: 'staff-1', name: 'Sam Staff', email: 'sam@example.test', role: 'staff', accountStatus: 'approved' }]));
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));
        fireEvent.click(await screen.findByRole('button', { name: 'Delete Sam Staff' }));
        const confirmButton = screen.getByRole('button', { name: 'Delete account' });

        fireEvent.click(confirmButton);
        expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Deleting…' }));
        expect(deleteUserAccount).toHaveBeenCalledTimes(1);

        resolveDeletion({ success: false, message: 'Unable to delete this account.' });
        expect(await screen.findByRole('alert')).toHaveTextContent('Unable to delete this account.');
        expect(screen.getByRole('dialog', { name: 'Delete account?' })).toBeInTheDocument();
    });

    it('loads the approved student directory for staff with delete access', async () => {
        useAuth.mockReturnValue({ user: { role: 'staff' } });

        getApprovedStudents.mockResolvedValue(paged([{
            _id: 'student-1',
            name: 'Asha Rao',
            email: 'asha@example.test',
            department: 'Library',
        }]));

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Students/ }));

        expect(await screen.findByRole('heading', { name: 'Student directory' })).toBeInTheDocument();
        expect(await screen.findByText('asha@example.test')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();

        expect(screen.queryByRole('columnheader', { name: 'Role' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Delete Asha Rao' })).toBeInTheDocument();

        expect(getApprovedStudents).toHaveBeenCalledWith({ page: 1, limit: 10, search: '' });
        expect(getUsers).not.toHaveBeenCalled();
    });

    it('allows staff to delete a student account and refreshes the directory', async () => {
        useAuth.mockReturnValue({ user: { role: 'staff' } });

        const student = {
            _id: 'student-1',
            name: 'Asha Rao',
            email: 'asha@example.test',
            department: 'Library',
        };

        getApprovedStudents
            .mockResolvedValueOnce(paged([student]))
            .mockResolvedValueOnce(paged([]));

        render(<Dashboard />);

        fireEvent.click(await screen.findByRole('button', { name: /Total Students/ }));

        fireEvent.click(await screen.findByRole('button', { name: 'Delete Asha Rao' }));

        const dialog = screen.getByRole('dialog', { name: 'Delete account?' });

        expect(dialog).toHaveTextContent('Asha Rao');
        expect(dialog).toHaveTextContent('asha@example.test');

        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

        await waitFor(() => {
            expect(deleteUserAccount).toHaveBeenCalledWith('student-1');
        });

        expect(await screen.findByText('Asha Rao was deleted. Account history has been retained.')).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'No records found' })).toBeInTheDocument();
        expect(getApprovedStudents).toHaveBeenCalledTimes(2);
        expect(getUsers).not.toHaveBeenCalled();
    });

    it('searches and paginates the staff-visible student directory', async () => {
        useAuth.mockReturnValue({ user: { role: 'staff' } });
        getApprovedStudents.mockImplementation(({ page }) => Promise.resolve(paged(
            [{ name: `Student ${page}`, email: `student${page}@example.test`, department: 'Science' }],
            { page, totalRecords: 21, totalPages: 3 },
        )));
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Students/ }));

        fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'asha' } });
        await waitFor(() => expect(getApprovedStudents).toHaveBeenLastCalledWith({
            page: 1,
            limit: 10,
            search: 'asha',
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(await screen.findByText('Student 2')).toBeInTheDocument();
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });

    it('shows staff directory validation errors and empty state', async () => {
        useAuth.mockReturnValue({ user: { role: 'staff' } });
        getApprovedStudents.mockRejectedValueOnce({
            response: { data: { message: 'Validation failed', errors: [{ path: 'page', msg: 'page must be positive' }] } },
        });
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Students/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Validation failed: page: page must be positive');

        getApprovedStudents.mockResolvedValueOnce(paged([]));
        fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
        fireEvent.click(screen.getByRole('button', { name: /Total Students/ }));
        expect(await screen.findByRole('heading', { name: 'No records found' })).toBeInTheDocument();
    });

    it('does not request a staff directory for students', async () => {
        useAuth.mockReturnValue({ user: { role: 'student' } });
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Students/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent('staff and administrators only');
        expect(getApprovedStudents).not.toHaveBeenCalled();
        expect(getUsers).not.toHaveBeenCalled();
    });

    it('filters and paginates records through the server API', async () => {
        getItems.mockResolvedValue({ success: true, data: { items: [{ _id: 'i1', title: 'Blue notebook', category: 'Books', type: 'found', status: 'ACTIVE', location: { building: 'Library' }, date: '2026-04-01' }], pagination: { page: 1, limit: 10, totalItems: 11, totalPages: 2 } } });
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Items/ }));
        expect(await screen.findByText('Blue notebook')).toBeInTheDocument();
        expect(screen.getByText('11 records')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'notebook' } });
        await waitFor(() => expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'notebook' })), { timeout: 1500 });
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
    });

    it('shows loading, error and empty record states', async () => {
        let resolveClaims;
        getClaims.mockReturnValueOnce(new Promise((resolve) => { resolveClaims = resolve; }));
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Pending Claims/ }));
        expect(await screen.findByText('Loading records…')).toBeInTheDocument();
        resolveClaims(paged());
        expect(await screen.findByRole('heading', { name: 'No records found' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Back to overview' }));
        getItems.mockRejectedValueOnce(new Error('Records unavailable'));
        fireEvent.click(screen.getByRole('button', { name: /Total Items/ }));
        expect(await screen.findByText('Records unavailable')).toBeInTheDocument();
    });

    it('refreshes dashboard statistics', async () => {
        render(<Dashboard />);
        await screen.findByRole('button', { name: /Total Items/ });
        fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard' }));
        await waitFor(() => expect(getStats).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/Last refreshed on this device at/)).toBeInTheDocument();
    });

    it('refreshes the selected management records along with the statistics', async () => {
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Items/ }));
        await waitFor(() => expect(getItems).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard' }));

        await waitFor(() => {
            expect(getStats).toHaveBeenCalledTimes(2);
            expect(getItems).toHaveBeenCalledTimes(2);
        });
    });
});
