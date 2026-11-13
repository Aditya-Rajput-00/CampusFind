import { useEffect, useRef, useState } from 'react';
import './Dropdown.css';

function Dropdown({
    id,
    label,
    value,
    options,
    onChange,
    required = false,
    disabled = false,
}) {
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const listboxRef = useRef(null);
    const activeOptionRef = useRef(null);
    const searchBufferRef = useRef('');
    const searchTimeoutRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const selectedIndex = options.findIndex((option) => option.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;
    const listboxId = `${id}-listbox`;

    useEffect(() => {
        const listbox = listboxRef.current;
        const activeOption = activeOptionRef.current;

        if (!isOpen || activeIndex < 0 || !listbox || !activeOption) return;

        const listboxBounds = listbox.getBoundingClientRect();
        const optionBounds = activeOption.getBoundingClientRect();
        const visibleTop = listboxBounds.top + listbox.clientTop;
        const visibleBottom = visibleTop + listbox.clientHeight;
        const isOutsideVisibleArea =
            optionBounds.top < visibleTop || optionBounds.bottom > visibleBottom;

        if (isOutsideVisibleArea && typeof activeOption.scrollIntoView === 'function') {
            activeOption.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex, isOpen]);

    const openAt = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
        if (disabled || options.length === 0) return;

        setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const selectOption = (index) => {
        const option = options[index];
        if (!option) return;

        onChange(option.value);
        close();
        triggerRef.current?.focus();
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setIsOpen(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [isOpen]);

    useEffect(() => () => {
        if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
        }
    }, []);

    const handleTypeSearch = (character) => {
        const normalizedCharacter = character.toLocaleLowerCase();
        const previousSearch = searchBufferRef.current;
        const nextSearch = previousSearch === normalizedCharacter
            ? normalizedCharacter
            : `${previousSearch}${normalizedCharacter}`;

        searchBufferRef.current = nextSearch;

        if (searchTimeoutRef.current) {
            window.clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = window.setTimeout(() => {
            searchBufferRef.current = '';
            searchTimeoutRef.current = null;
        }, 700);

        const startIndex = activeIndex >= 0
            ? (activeIndex + 1) % options.length
            : (selectedIndex >= 0 ? selectedIndex : 0);

        for (let offset = 0; offset < options.length; offset += 1) {
            const index = (startIndex + offset) % options.length;
            const optionLabel = String(options[index].label).toLocaleLowerCase();

            if (optionLabel.startsWith(nextSearch)) {
                setActiveIndex(index);
                setIsOpen(true);
                return;
            }
        }

        if (nextSearch.length > 1) {
            searchBufferRef.current = normalizedCharacter;
            handleTypeSearch(character);
        }
    };

    const handleKeyDown = (event) => {
        if (disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    openAt();
                } else {
                    setActiveIndex((current) => Math.min(current + 1, options.length - 1));
                }
                return;
            case 'ArrowUp':
                event.preventDefault();
                if (!isOpen) {
                    openAt(selectedIndex >= 0 ? selectedIndex : options.length - 1);
                } else {
                    setActiveIndex((current) => Math.max(current - 1, 0));
                }
                return;
            case 'Home':
                if (options.length === 0) return;
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex(0);
                return;
            case 'End':
                if (options.length === 0) return;
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex(options.length - 1);
                return;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!isOpen) {
                    openAt();
                } else {
                    selectOption(activeIndex);
                }
                return;
            case 'Escape':
                if (isOpen) {
                    event.preventDefault();
                    close();
                    triggerRef.current?.focus();
                }
                return;
            case 'Tab':
                if (isOpen) close();
                return;
            default:
                if (
                    event.key.length === 1 &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.altKey &&
                    options.length > 0
                ) {
                    handleTypeSearch(event.key);
                }
        }
    };

    return (
        <div className="dropdown" ref={rootRef}>
            <button
                ref={triggerRef}
                id={id}
                type="button"
                className="dropdown-trigger"
                role="combobox"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={isOpen && activeIndex >= 0
                    ? `${id}-option-${activeIndex}`
                    : undefined}
                aria-required={required}
                aria-disabled={disabled}
                disabled={disabled}
                onClick={() => (isOpen ? close() : openAt())}
                onKeyDown={handleKeyDown}
            >
                <span className="dropdown-value">
                    {selectedOption?.label || ''}
                </span>
                <span className="dropdown-indicator" aria-hidden="true" />
            </button>

            {isOpen && (
                <ul
                    ref={listboxRef}
                    id={listboxId}
                    className="dropdown-listbox"
                    role="listbox"
                    aria-label={`${label} options`}
                >
                    {options.map((option, index) => (
                        <li
                            key={option.value}
                            id={`${id}-option-${index}`}
                            className={`dropdown-option${index === activeIndex ? ' is-active' : ''}`}
                            ref={index === activeIndex ? activeOptionRef : null}
                            role="option"
                            aria-selected={option.value === value}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectOption(index)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Dropdown;
