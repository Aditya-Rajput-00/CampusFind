import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Items from './Items';

const { createItemMock, getItemsMock } = vi.hoisted(() => ({
    createItemMock: vi.fn(),
    getItemsMock: vi.fn(),
}));

vi.mock('../../services/itemService', () => ({
    createItem: createItemMock,
    getItems: getItemsMock,
}));

const item = {
    _id: 'item-1',
    title: 'Campus card',
    description: 'A student card found near the library.',
    type: 'found',
    category: 'Documents',
    status: 'ACTIVE',
    date: '2025-03-14T12:00:00.000Z',
    images: ['https://example.test/campus-card.jpg'],
};

const createItemsResult = (items = [item], totalPages = 2) => ({
    success: true,
    data: {
        items,
        pagination: { totalPages },
    },
});

const chooseDropdownOption = async (label, option) => {
    fireEvent.click(screen.getByRole('combobox', { name: label }));
    fireEvent.click(await screen.findByRole('option', { name: option }));
};

describe('Items page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getItemsMock.mockResolvedValue(createItemsResult());
    });

    it('fetches the initial page and renders item details and its image', async () => {
        render(<Items />);

        expect(await screen.findByRole('heading', { name: 'Lost & Found Items' }))
            .toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Campus card' }))
            .toBeInTheDocument();
        expect(screen.getByText('A student card found near the library.'))
            .toBeInTheDocument();
        expect(screen.getByText('Category: Documents')).toBeInTheDocument();
        expect(screen.getByText('Status: ACTIVE')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Campus card' }))
            .toHaveAttribute('src', 'https://example.test/campus-card.jpg');
        expect(getItemsMock).toHaveBeenCalledWith({
            search: '',
            type: '',
            category: '',
            status: '',
            page: 1,
            limit: 10,
        });
    });

    it('opens the original item image in an accessible preview', async () => {
        render(<Items />);

        const trigger = await screen.findByRole('button', { name: 'Preview Campus card' });
        fireEvent.click(trigger);

        const dialog = screen.getByRole('dialog', { name: 'Image preview: Campus card' });
        const previewImage = within(dialog).getByRole('img', { name: 'Campus card' });
        const closeButton = screen.getByRole('button', { name: 'Close image preview' });

        expect(previewImage).toHaveAttribute('src', 'https://example.test/campus-card.jpg');
        expect(previewImage).toHaveClass('items-image-preview-image');
        expect(document.body.style.overflow).toBe('hidden');
        expect(document.activeElement).toBe(closeButton);

        fireEvent.keyDown(document, { key: 'Tab' });
        expect(document.activeElement).toBe(closeButton);
    });

    it('closes the image preview with its close button and restores focus', async () => {
        render(<Items />);

        const trigger = await screen.findByRole('button', { name: 'Preview Campus card' });
        fireEvent.click(trigger);
        fireEvent.click(screen.getByRole('button', { name: 'Close image preview' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.body.style.overflow).toBe('');
        expect(document.activeElement).toBe(trigger);
    });

    it('closes the image preview when the backdrop is clicked', async () => {
        render(<Items />);

        fireEvent.click(await screen.findByRole('button', { name: 'Preview Campus card' }));
        fireEvent.click(document.querySelector('.items-image-preview-backdrop'));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes the image preview with Escape', async () => {
        render(<Items />);

        const trigger = await screen.findByRole('button', { name: 'Preview Campus card' });
        fireEvent.click(trigger);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.activeElement).toBe(trigger);
    });

    it('shows the image fallback when an item has no image', async () => {
        getItemsMock.mockResolvedValueOnce(createItemsResult([
            { ...item, images: [] },
        ]));

        render(<Items />);

        expect(await screen.findByRole('heading', { name: 'Campus card' }))
            .toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'No image available' }))
            .toBeInTheDocument();
        expect(document.querySelector('.item-card-media'))
            .toHaveClass('is-fallback');
        fireEvent.click(screen.getByRole('img', { name: 'No image available' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Preview Campus card' }))
            .not.toBeInTheDocument();
    });

    it('shows the image fallback when an item image fails to load', async () => {
        render(<Items />);

        const itemImage = await screen.findByRole('img', { name: 'Campus card' });
        fireEvent.error(itemImage);

        expect(screen.getByRole('img', { name: 'No image available' }))
            .toBeInTheDocument();
        expect(document.querySelector('.item-card-media'))
            .toHaveClass('is-fallback');
        expect(screen.queryByRole('img', { name: 'Campus card' }))
            .not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('img', { name: 'No image available' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Preview Campus card' }))
            .not.toBeInTheDocument();
    });

    it('passes current search and filter values to the item service', async () => {
        render(<Items />);

        const searchInput = screen.getByPlaceholderText('Search items...');
        fireEvent.change(searchInput, { target: { value: 'campus card' } });
        await waitFor(() => {
            expect(getItemsMock).toHaveBeenLastCalledWith({
                search: 'campus card',
                type: '',
                category: '',
                status: '',
                page: 1,
                limit: 10,
            });
        });

        await chooseDropdownOption('Filter by item type', 'Lost');
        await chooseDropdownOption('Filter by category', 'Books');
        await chooseDropdownOption('Filter by status', 'Active');

        await waitFor(() => {
            expect(getItemsMock).toHaveBeenLastCalledWith({
                search: 'campus card',
                type: 'lost',
                category: 'Books',
                status: 'ACTIVE',
                page: 1,
                limit: 10,
            });
        });
    });

    it('resets search, filters, and pagination when Clear Filters is selected', async () => {
        render(<Items />);

        fireEvent.change(screen.getByPlaceholderText('Search items...'), {
            target: { value: 'campus' },
        });
        await chooseDropdownOption('Filter by item type', 'Found');
        await chooseDropdownOption('Filter by category', 'Documents');
        await chooseDropdownOption('Filter by status', 'Active');

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
        await waitFor(() => {
            expect(getItemsMock).toHaveBeenLastCalledWith({
                search: '',
                type: '',
                category: '',
                status: '',
                page: 1,
                limit: 10,
            });
        });
    });

    it('loads the next and previous pages with the existing page query', async () => {
        render(<Items />);

        fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
        expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
        await waitFor(() => {
            expect(getItemsMock).toHaveBeenLastCalledWith({
                search: '',
                type: '',
                category: '',
                status: '',
                page: 2,
                limit: 10,
            });
        });

        fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
        expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
        await waitFor(() => {
            expect(getItemsMock).toHaveBeenLastCalledWith({
                search: '',
                type: '',
                category: '',
                status: '',
                page: 1,
                limit: 10,
            });
        });
    });

    it('shows the loading state until the initial request resolves', async () => {
        let resolveItems;
        getItemsMock.mockReturnValueOnce(new Promise((resolve) => {
            resolveItems = resolve;
        }));

        render(<Items />);
        expect(screen.getByText('Loading items...')).toBeInTheDocument();

        await act(async () => {
            resolveItems(createItemsResult());
        });

        expect(await screen.findByRole('heading', { name: 'Campus card' }))
            .toBeInTheDocument();
    });

    it('shows the error message when fetching items fails', async () => {
        getItemsMock.mockRejectedValueOnce(new Error('Items could not be loaded'));

        render(<Items />);

        expect(await screen.findByText('Items could not be loaded'))
            .toBeInTheDocument();
    });

    it('shows the empty state when the service returns no items', async () => {
        getItemsMock.mockResolvedValueOnce(createItemsResult([], 0));

        render(<Items />);

        expect(await screen.findByRole('heading', { name: 'No items found' }))
            .toBeInTheDocument();
        expect(screen.getByText('Try changing your search or filters.'))
            .toBeInTheDocument();
    });
});
