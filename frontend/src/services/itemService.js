
import api from './api';

// Fetch lost and found items.
export const getItems = async (filters = {}) => {
    const response = await api.get('/items', {
        params: filters,
    });

    return response.data;
};

// Create a new lost or found item with optional image.
export const createItem = async (itemData) => {
    const response = await api.post('/items', itemData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

// Update item status.
export const updateItemStatus = async (id, status) => {
    const response = await api.patch(`/items/${id}/status`, {
        status,
    });

    return response.data;
};

// Mark an item as returned.
export const returnItem = async (id) => {
    const response = await api.patch(`/items/${id}/return`);

    return response.data;
};

// Close an item.
export const closeItem = async (id) => {
    const response = await api.patch(`/items/${id}/close`);

    return response.data;
};
