
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
    },
}));

import api from './api';
import {
    getItems,
    createItem,
    updateItemStatus,
    returnItem,
    closeItem,
} from './itemService';

describe('Item Service Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch items with filters', async () => {
        const mockData = {
            success: true,
            data: [{ _id: 'item-1', title: 'Lost Laptop' }],
        };

        api.get.mockResolvedValue({ data: mockData });

        const filters = {
            type: 'lost',
            status: 'ACTIVE',
            page: 1,
        };

        const result = await getItems(filters);

        expect(api.get).toHaveBeenCalledWith('/items', {
            params: filters,
        });

        expect(result).toEqual(mockData);
    });

    it('should create a new item', async () => {
        const itemData = {
            title: 'Lost Laptop',
            type: 'lost',
            category: 'Electronics',
        };

        const mockData = {
            success: true,
            data: { _id: 'item-1', ...itemData },
        };

        api.post.mockResolvedValue({ data: mockData });

        const result = await createItem(itemData);

        expect(api.post).toHaveBeenCalledWith('/items', itemData);
        expect(result).toEqual(mockData);
    });

    it('should update item status', async () => {
        const mockData = {
            success: true,
            message: 'Item status updated',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await updateItemStatus('item-1', 'ACTIVE');

        expect(api.patch).toHaveBeenCalledWith(
            '/items/item-1/status',
            { status: 'ACTIVE' }
        );

        expect(result).toEqual(mockData);
    });

    it('should mark an item as returned', async () => {
        const mockData = {
            success: true,
            message: 'Item marked as returned',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await returnItem('item-1');

        expect(api.patch).toHaveBeenCalledWith(
            '/items/item-1/return'
        );

        expect(result).toEqual(mockData);
    });

    it('should close an item', async () => {
        const mockData = {
            success: true,
            message: 'Item closed successfully',
        };

        api.patch.mockResolvedValue({ data: mockData });

        const result = await closeItem('item-1');

        expect(api.patch).toHaveBeenCalledWith(
            '/items/item-1/close'
        );

        expect(result).toEqual(mockData);
    });
});
