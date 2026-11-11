
import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from './api.js';

describe('API Service Integration Tests', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('should attach JWT token to authenticated requests', async () => {
        sessionStorage.setItem('campusfindToken', 'test-jwt-token');

        const adapter = vi.fn(async (config) => ({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        }));

        await api.get('/items', { adapter });

        expect(adapter).toHaveBeenCalled();

        const requestConfig = adapter.mock.calls[0][0];

        expect(requestConfig.headers.Authorization)
            .toBe('Bearer test-jwt-token');
    });

    it('should not attach JWT token when user is logged out', async () => {
        const adapter = vi.fn(async (config) => ({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        }));

        await api.get('/items', { adapter });

        expect(adapter).toHaveBeenCalled();

        const requestConfig = adapter.mock.calls[0][0];

        expect(requestConfig.headers.Authorization).toBeUndefined();
    });

    it('should use the configured API base URL', async () => {
        const adapter = vi.fn(async (config) => ({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        }));

        await api.get('/items', { adapter });

        const requestConfig = adapter.mock.calls[0][0];

        expect(requestConfig.baseURL).toBe(
            import.meta.env.VITE_API_URL || '/api'
        );
    });
});
