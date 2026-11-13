import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Dropdown from './Dropdown';

const options = [
    { value: 'lost', label: 'Lost' },
    { value: 'found', label: 'Found' },
    { value: 'electronics', label: 'Electronics' },
];

const renderDropdown = (props = {}) => render(
    <Dropdown
        id="item-type"
        label="Item type"
        value="lost"
        options={options}
        onChange={vi.fn()}
        {...props}
    />
);

describe('Dropdown component', () => {
    let onChange;

    beforeEach(() => {
        onChange = vi.fn();
    });

    it('renders the selected option in the trigger', () => {
        renderDropdown({ value: 'found', onChange });

        expect(screen.getByRole('combobox', { name: 'Item type' }))
            .toHaveTextContent('Found');
    });

    it('opens and closes the listbox when the trigger is clicked', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.click(trigger);
        expect(await screen.findByRole('listbox')).toBeInTheDocument();
        expect(trigger).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(trigger);
        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('calls onChange with the exact value when an option is clicked', async () => {
        renderDropdown({ onChange });
        fireEvent.click(screen.getByRole('combobox', { name: 'Item type' }));

        fireEvent.click(await screen.findByRole('option', { name: 'Found' }));

        expect(onChange).toHaveBeenCalledExactlyOnceWith('found');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('moves the active option with ArrowDown and ArrowUp without selecting', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-0');
        });

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-1');
        });

        fireEvent.keyDown(trigger, { key: 'ArrowUp' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-0');
        });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('scrolls an active option into view only when it is outside the listbox', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.click(trigger);

        const listbox = await screen.findByRole('listbox');
        const [visibleOption, offscreenOption] = screen.getAllByRole('option');
        const scrollVisibleOption = vi.fn();
        const scrollOffscreenOption = vi.fn();

        vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue({
            top: 100,
            bottom: 181,
        });
        Object.defineProperty(listbox, 'clientTop', {
            configurable: true,
            value: 1,
        });
        Object.defineProperty(listbox, 'clientHeight', {
            configurable: true,
            value: 80,
        });
        vi.spyOn(visibleOption, 'getBoundingClientRect').mockReturnValue({
            top: 110,
            bottom: 140,
        });
        vi.spyOn(offscreenOption, 'getBoundingClientRect').mockReturnValue({
            top: 190,
            bottom: 220,
        });
        visibleOption.scrollIntoView = scrollVisibleOption;
        offscreenOption.scrollIntoView = scrollOffscreenOption;

        await waitFor(() => {
            expect(scrollVisibleOption).not.toHaveBeenCalled();
        });

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        await waitFor(() => {
            expect(scrollOffscreenOption).toHaveBeenCalledExactlyOnceWith({
                block: 'nearest',
            });
        });
        expect(scrollVisibleOption).not.toHaveBeenCalled();
    });

    it('selects the active option with Enter', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: 'Enter' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'Enter' });

        await waitFor(() => {
            expect(onChange).toHaveBeenCalledExactlyOnceWith('found');
        });
    });

    it('selects the active option with Space', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: ' ' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: ' ' });

        await waitFor(() => {
            expect(onChange).toHaveBeenCalledExactlyOnceWith('found');
        });
    });

    it('moves to the first and last options with Home and End', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'End' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-2');
        });

        fireEvent.keyDown(trigger, { key: 'Home' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-0');
        });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('closes on Escape and keeps focus on the trigger', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.click(trigger);
        expect(await screen.findByRole('listbox')).toBeInTheDocument();
        fireEvent.keyDown(trigger, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(trigger).toHaveFocus();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('closes on Tab without preventing normal focus movement', async () => {
        render(
            <>
                <Dropdown
                    id="item-type"
                    label="Item type"
                    value="lost"
                    options={options}
                    onChange={onChange}
                />
                <button type="button">Next control</button>
            </>
        );
        const trigger = screen.getByRole('combobox', { name: 'Item type' });
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });

        fireEvent.click(trigger);
        expect(await screen.findByRole('listbox')).toBeInTheDocument();
        fireEvent(trigger, tabEvent);

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(tabEvent.defaultPrevented).toBe(false);
        expect(screen.getByRole('button', { name: 'Next control' })).toBeInTheDocument();
    });

    it('uses type-to-search to activate and select a matching option', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: 'e' });
        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-2');
        });

        fireEvent.keyDown(trigger, { key: 'Enter' });

        await waitFor(() => {
            expect(onChange).toHaveBeenCalledExactlyOnceWith('electronics');
        });
    });

    it('closes when a pointer interaction occurs outside the dropdown', async () => {
        renderDropdown({ onChange });
        fireEvent.click(screen.getByRole('combobox', { name: 'Item type' }));
        expect(await screen.findByRole('listbox')).toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        await waitFor(() => {
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('prevents opening and selection when disabled', () => {
        renderDropdown({ disabled: true, onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        expect(trigger).toBeDisabled();
        expect(trigger).toHaveAttribute('aria-disabled', 'true');
        fireEvent.click(trigger);
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(onChange).not.toHaveBeenCalled();
    });

    it('exposes the required state accessibly', () => {
        renderDropdown({ required: true, onChange });

        expect(screen.getByRole('combobox', { name: 'Item type' }))
            .toHaveAttribute('aria-required', 'true');
    });

    it('exposes combobox, listbox, expanded and selected option semantics', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(trigger).toHaveAttribute('aria-controls', 'item-type-listbox');

        fireEvent.click(trigger);
        const listbox = await screen.findByRole('listbox', { name: 'Item type options' });

        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(listbox).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Lost' }))
            .toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: 'Found' }))
            .toHaveAttribute('aria-selected', 'false');
    });

    it('does not call onChange just by navigating the options', async () => {
        renderDropdown({ onChange });
        const trigger = screen.getByRole('combobox', { name: 'Item type' });

        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyDown(trigger, { key: 'End' });
        fireEvent.keyDown(trigger, { key: 'Home' });

        await waitFor(() => {
            expect(trigger).toHaveAttribute('aria-activedescendant', 'item-type-option-0');
        });
        expect(onChange).not.toHaveBeenCalled();
    });
});
