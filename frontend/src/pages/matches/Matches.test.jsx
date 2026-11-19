import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Matches from './Matches';

const { getMatchesMock, updateMatchStatusMock, useAuthMock } = vi.hoisted(() => ({
    getMatchesMock: vi.fn(),
    updateMatchStatusMock: vi.fn(),
    useAuthMock: vi.fn(),
}));

vi.mock('../../context/useAuth.js', () => ({
    useAuth: useAuthMock,
}));

vi.mock('../../services/matchService', () => ({
    getMatches: getMatchesMock,
    updateMatchStatus: updateMatchStatusMock,
}));

const match = {
    _id: 'match-1',
    status: 'PENDING',
    matchScore: 92,
    createdAt: '2026-10-12T12:00:00.000Z',
    lostItemId: {
        title: 'Canvas backpack',
        category: 'Bags',
        location: { building: 'Library' },
    },
    foundItemId: {
        title: 'Blue backpack',
        category: 'Bags',
        location: { building: 'Science Hall' },
    },
};

const matchesResult = (data = []) => ({ success: true, data });

describe('Matches page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuthMock.mockReturnValue({ user: { role: 'student' } });
        getMatchesMock.mockResolvedValue(matchesResult());
        updateMatchStatusMock.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the custom empty state and student-specific guidance', async () => {
        const { container } = render(<Matches />);

        expect(await screen.findByRole('heading', { name: 'No Matches Found' }))
            .toBeInTheDocument();
        expect(screen.getByText(
            'No matches have been found for your reported items yet.'
        )).toBeInTheDocument();
        expect(container.querySelector('svg.matches-empty__illustration'))
            .toHaveAttribute('aria-hidden', 'true');
        expect(getMatchesMock).toHaveBeenCalledTimes(1);
    });

    it('keeps loading feedback visible until the initial request resolves', async () => {
        let resolveMatches;
        getMatchesMock.mockReturnValueOnce(new Promise((resolve) => {
            resolveMatches = resolve;
        }));

        render(<Matches />);
        expect(screen.getByText('Loading matches...')).toBeInTheDocument();

        await act(async () => {
            resolveMatches(matchesResult());
        });

        expect(await screen.findByRole('heading', { name: 'No Matches Found' }))
            .toBeInTheDocument();
    });

    it('renders match statistics and both item records without student actions', async () => {
        getMatchesMock.mockResolvedValueOnce(matchesResult([match]));

        render(<Matches />);

        expect(await screen.findByRole('heading', { name: 'Canvas backpack' }))
            .toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Blue backpack' }))
            .toBeInTheDocument();
        expect(screen.getByText('92')).toBeInTheDocument();
        expect(screen.getByText('Showing 1 matches')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toHaveClass('pending');
        expect(screen.queryByRole('button', { name: 'Confirm Match' }))
            .not.toBeInTheDocument();
    });

    it('keeps staff match confirmation available and refreshes the results', async () => {
        useAuthMock.mockReturnValue({ user: { role: 'staff' } });
        getMatchesMock
            .mockResolvedValueOnce(matchesResult([match]))
            .mockResolvedValueOnce(matchesResult([{ ...match, status: 'CONFIRMED' }]));
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        render(<Matches />);
        fireEvent.click(await screen.findByRole('button', { name: 'Confirm Match' }));

        await waitFor(() => {
            expect(updateMatchStatusMock).toHaveBeenCalledWith('match-1', 'CONFIRMED');
        });
        expect(await screen.findByText('Match confirmed successfully.'))
            .toBeInTheDocument();
        expect(getMatchesMock).toHaveBeenCalledTimes(2);
    });

    it('shows the existing fetch error message', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        getMatchesMock.mockRejectedValueOnce(new Error('Matches could not be loaded'));

        render(<Matches />);

        expect(await screen.findByText('Matches could not be loaded'))
            .toBeInTheDocument();
        consoleError.mockRestore();
    });
});
