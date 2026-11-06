
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from './notificationService';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('notificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches notifications for the logged-in user', async () => {
        const mockData = [
            { _id: 'notification1', message: 'New item found' },
            { _id: 'notification2', message: 'Claim updated' },
        ];

        api.get.mockResolvedValue({ data: mockData });

        const result = await getNotifications();

        expect(api.get).toHaveBeenCalledWith('/notifications');
        expect(result).toEqual(mockData);
    });

    it('marks one notification as read', async () => {
        const mockData = {
            message: 'Notification marked as read',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await markNotificationAsRead('notification123');

        expect(api.patch).toHaveBeenCalledWith(
            '/notifications/notification123/read'
        );
        expect(result).toEqual(mockData);
    });

    it('marks all notifications as read', async () => {
        const mockData = {
            message: 'All notifications marked as read',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await markAllNotificationsAsRead();

        expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
        expect(result).toEqual(mockData);
    });
});
