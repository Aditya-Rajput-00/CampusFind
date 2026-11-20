import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { getItems, getClaims, createClaim, updateClaimStatus, verifyClaim, useAuth } = vi.hoisted(() => ({
    getItems: vi.fn(),
    getClaims: vi.fn(),
    createClaim: vi.fn(),
    updateClaimStatus: vi.fn(),
    verifyClaim: vi.fn(),
    useAuth: vi.fn(),
}));

vi.mock('../../context/useAuth.js', () => ({ useAuth }));
vi.mock('../../services/itemService', () => ({ getItems }));
vi.mock('../../services/claimService', () => ({
    getClaims,
    createClaim,
    updateClaimStatus,
    verifyClaim,
}));

import Claims from './Claims';

const claim = (id, status = 'PENDING') => ({
    _id: id,
    status,
    createdAt: '2026-10-12T12:00:00.000Z',
    itemId: { title: `Item ${id}`, type: 'found' },
    claimantId: { name: 'Student Example', email: 'student@example.test' },
    proof: { description: 'Identifying details' },
});

const claimsPage = (data, page = 1, totalRecords = 21, totalPages = 2) => ({
    success: true,
    data,
    pagination: { page, limit: 20, totalRecords, totalPages },
});

describe('Claims pagination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: { role: 'staff' } });
        getClaims.mockResolvedValue(claimsPage([claim('claim-1')]));
        getItems.mockResolvedValue({ success: true, data: { items: [] } });
        updateClaimStatus.mockResolvedValue({ success: true });
        verifyClaim.mockResolvedValue({ success: true });
        createClaim.mockResolvedValue({ success: true });
    });

    it('loads server pages and preserves staff claim actions after changing page', async () => {
        getClaims
            .mockResolvedValueOnce(claimsPage([claim('claim-1')]))
            .mockResolvedValueOnce(claimsPage([claim('claim-21')], 2))
            .mockResolvedValueOnce(claimsPage([claim('claim-21', 'APPROVED')], 2));

        render(<Claims />);

        expect(await screen.findByRole('heading', { name: 'Item claim-1' }))
            .toBeInTheDocument();
        expect(screen.getByText('Showing 1–1 of 21 claims')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        expect(await screen.findByRole('heading', { name: 'Item claim-21' }))
            .toBeInTheDocument();
        expect(getClaims).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
        expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
        await waitFor(() => expect(updateClaimStatus).toHaveBeenCalledWith('claim-21', 'APPROVED'));
        expect(await screen.findByText('Claim approved successfully.')).toBeInTheDocument();
        expect(getClaims).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
    });

    it('keeps the student claim form and uses the existing item lookup', async () => {
        useAuth.mockReturnValue({ user: { role: 'student' } });
        getItems.mockResolvedValue({
            success: true,
            data: { items: [{ _id: 'item-1', title: 'Found keys' }] },
        });
        getClaims.mockResolvedValue(claimsPage([], 1, 0, 0));

        render(<Claims />);

        expect(await screen.findByRole('heading', { name: 'Submit a New Claim' }))
            .toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Found keys' })).toBeInTheDocument();
        expect(getItems).toHaveBeenCalledWith({ type: 'found', status: 'ACTIVE', limit: 100 });
        expect(getClaims).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
});
