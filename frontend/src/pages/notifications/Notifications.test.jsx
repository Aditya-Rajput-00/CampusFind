import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Notifications from './Notifications';

const {
    getNotificationsMock,
    markAllNotificationsAsReadMock,
    markNotificationAsReadMock,
} = vi.hoisted(() => ({
    getNotificationsMock: vi.fn(),
    markAllNotificationsAsReadMock: vi.fn(),
    markNotificationAsReadMock: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
    getNotifications: getNotificationsMock,
    markAllNotificationsAsRead: markAllNotificationsAsReadMock,
    markNotificationAsRead: markNotificationAsReadMock,
}));

const notifications = [
    {
        _id: 'notification-1',
        type: 'CLAIM',
        title: 'Claim received',
        message: 'Your ownership request is ready for review.',
        createdAt: '2026-10-12T12:00:00.000Z',
        isRead: false,
    },
    {
        _id: 'notification-2',
        type: 'MATCH',
        title: 'A match was found',
        message: 'A reported item may match your item.',
        createdAt: '2026-10-11T12:00:00.000Z',
        isRead: true,
    },
];

const notificationsResult = (data = notifications) => ({ success: true, data });

describe('Notifications page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getNotificationsMock.mockResolvedValue(notificationsResult());
        markNotificationAsReadMock.mockResolvedValue({ success: true });
        markAllNotificationsAsReadMock.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches and renders notifications with read state and counts', async () => {
        render(<Notifications />);

        expect(await screen.findByRole('heading', { name: 'Claim received' }))
            .toBeInTheDocument();
        expect(screen.getByText('Your ownership request is ready for review.'))
            .toBeInTheDocument();
        expect(screen.getByText('Claim')).toHaveClass('claim');
        expect(screen.getAllByText('Unread')).toHaveLength(2);
        expect(screen.getAllByText('Read')).toHaveLength(2);
        expect(screen.getByText('2 notifications')).toBeInTheDocument();
        expect(getNotificationsMock).toHaveBeenCalledTimes(1);
    });

    it('marks one notification as read and updates its displayed state', async () => {
        render(<Notifications />);

        fireEvent.click(await screen.findByRole('button', { name: 'Mark as Read' }));

        await waitFor(() => {
            expect(markNotificationAsReadMock).toHaveBeenCalledWith('notification-1');
        });
        expect(await screen.findByText('Notification marked as read.'))
            .toBeInTheDocument();
        expect(screen.getByRole('status'))
            .toHaveTextContent('Notification marked as read.');
        expect(screen.getAllByText('Read')).toHaveLength(3);
        expect(screen.queryByRole('button', { name: 'Mark as Read' }))
            .not.toBeInTheDocument();
    });

    it('marks all unread notifications as read', async () => {
        render(<Notifications />);

        fireEvent.click(await screen.findByRole('button', { name: 'Mark All as Read' }));

        await waitFor(() => {
            expect(markAllNotificationsAsReadMock).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText('All notifications marked as read.'))
            .toBeInTheDocument();
        expect(screen.getAllByText('Read')).toHaveLength(3);
        expect(screen.getByRole('button', { name: 'Mark All as Read' }))
            .toBeDisabled();
    });

    it('keeps the loading state until the initial request resolves', async () => {
        let resolveNotifications;
        getNotificationsMock.mockReturnValueOnce(new Promise((resolve) => {
            resolveNotifications = resolve;
        }));

        render(<Notifications />);
        expect(screen.getByRole('status'))
            .toHaveTextContent('Loading notifications...');

        await act(async () => {
            resolveNotifications(notificationsResult());
        });

        expect(await screen.findByRole('heading', { name: 'Claim received' }))
            .toBeInTheDocument();
    });

    it('shows the error returned by a failed notification request', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        getNotificationsMock.mockRejectedValueOnce(new Error('Notifications unavailable'));

        render(<Notifications />);

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Notifications unavailable');
    });

    it('shows the compact empty state and notification illustration', async () => {
        getNotificationsMock.mockResolvedValueOnce(notificationsResult([]));
        const { container } = render(<Notifications />);

        expect(await screen.findByRole('heading', { name: 'No Notifications Yet' }))
            .toBeInTheDocument();
        expect(screen.getByText(/You will see updates about your claims/))
            .toBeInTheDocument();
        expect(container.querySelector('svg.notification-empty-icon'))
            .toHaveAttribute('aria-hidden', 'true');
    });
});
