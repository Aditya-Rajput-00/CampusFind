import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { getStats, getItems, getClaims, getMatches, getUsers, useAuth } = vi.hoisted(() => ({
    getStats: vi.fn(), getItems: vi.fn(), getClaims: vi.fn(), getMatches: vi.fn(), getUsers: vi.fn(), useAuth: vi.fn(),
}));

vi.mock('../../context/useAuth.js', () => ({ useAuth }));
vi.mock('../../services/dashboardService', () => ({ getDashboardStats: getStats }));
vi.mock('../../services/itemService', () => ({ getItems }));
vi.mock('../../services/claimService', () => ({ getClaims }));
vi.mock('../../services/matchService', () => ({ getMatches }));
vi.mock('../../services/userService', () => ({ getUsers }));

import Dashboard from './Dashboard';

const stats = { totalUsers: 18, totalItems: 25, lostItems: 11, foundItems: 14, activeItems: 16, returnedItems: 3, pendingClaims: 4, pendingMatches: 2 };
const paged = (data = []) => ({ success: true, data, pagination: { page: 1, limit: 10, totalRecords: data.length, totalPages: 1 } });
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
    });

    it('renders all eight statistics as accessible controls', async () => {
        render(<Dashboard />);
        for (const label of ['Total Users', 'Total Items', 'Lost Items', 'Found Items', 'Active Items', 'Returned Items', 'Pending Claims', 'Pending Matches']) {
            expect(await screen.findByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
        }
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

    it('shows safe user records and supports role/status filters for administrators', async () => {
        getUsers.mockResolvedValue(paged([{ name: 'Asha Rao', email: 'asha@example.test', role: 'staff', accountStatus: 'approved', department: 'Library', createdAt: '2026-01-10' }]));
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));
        expect(await screen.findByText('asha@example.test')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'staff' } });
        fireEvent.change(screen.getByLabelText('Account status'), { target: { value: 'approved' } });
        await waitFor(() => expect(getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'staff', accountStatus: 'approved' })));
    });

    it('does not request the user directory for staff, even when its card is selected', async () => {
        useAuth.mockReturnValue({ user: { role: 'staff' } });
        render(<Dashboard />);
        fireEvent.click(await screen.findByRole('button', { name: /Total Users/ }));
        expect(await screen.findByRole('alert')).toHaveTextContent('administrators only');
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
