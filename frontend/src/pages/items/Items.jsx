import { useEffect, useRef, useState } from 'react';
import { getItems, createItem } from '../../services/itemService';
import Dropdown from '../../components/Dropdown';

import './Items.css';
import './ItemForm.css';

const ITEMS_PER_PAGE = 10;

function Items() {
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [type, setType] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const dateInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        type: 'lost',
        date: '',
        image: null,
    });

    // Fetch items whenever filters or search change.
    useEffect(() => {
        let isActive = true;

        const loadItems = async () => {
            try {
                const result = await getItems({
                    search: searchQuery,
                    type,
                    category,
                    status,
                    page,
                    limit: ITEMS_PER_PAGE,
                });

                if (!isActive) return;

                if (!result.success) {
                    throw new Error(
                        result.message || 'Unable to fetch items.'
                    );
                }

                setItems(result.data.items || []);
                setPagination(result.data.pagination);
                setError('');
            } catch (err) {
                if (!isActive) return;

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Something went wrong.'
                );
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadItems();

        return () => {
            isActive = false;
        };
    }, [searchQuery, type, category, status, page]);

    // Update form fields.
    const handleFormChange = (event) => {
        const { name, value, files } = event.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: name === 'image' ? files?.[0] || null : value,
        }));
    };

    // Open the native calendar picker.
    const handleOpenCalendar = () => {
        const dateInput = dateInputRef.current;

        if (!dateInput) return;

        if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
        } else {
            dateInput.focus();
            dateInput.click();
        }
    };

    // Select today's date using the local date.
    const handleSelectToday = () => {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        setFormData((previousData) => ({
            ...previousData,
            date: `${year}-${month}-${day}`,
        }));
    };

    // Reset the form.
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            type: 'lost',
            date: '',
            image: null,
        });

        setFormError('');
    };

    // Clear all search and filters.
    const handleResetFilters = () => {
        setSearchQuery('');
        setType('');
        setCategory('');
        setStatus('');
        setPage(1);
    };

    // Submit a new lost/found item.
    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');

        if (
            !formData.title.trim() ||
            !formData.description.trim() ||
            !formData.category ||
            !formData.date
        ) {
            setFormError('Please fill in all required fields.');
            return;
        }

        const data = new FormData();

        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('category', formData.category);
        data.append('type', formData.type);
        data.append('date', formData.date);

        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            setSubmitting(true);

            const result = await createItem(data);

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to report item.'
                );
            }

            resetForm();
            setShowForm(false);
            setPage(1);

            // Refresh the item list after successful submission.
            const refreshedItems = await getItems({
                search: searchQuery,
                type,
                category,
                status,
                page: 1,
                limit: ITEMS_PER_PAGE,
            });

            if (refreshedItems.success) {
                setItems(refreshedItems.data.items || []);
                setPagination(refreshedItems.data.pagination);
            }
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                err.message ||
                'Unable to report item. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Handle filter changes.
    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    return (
        <div className="items-page">

            {/* Page Header */}
            <div className="items-header">
                <div>
                    <h1>Lost & Found Items</h1>
                    <p>
                        Find lost belongings or report an item you found.
                    </p>
                </div>

                <button
                    type="button"
                    className="report-item-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    + Report Item
                </button>
            </div>

            {/* Search and Filters */}
            <div className="items-filters">

                <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setPage(1);
                    }}
                />

                {/* Item Type Filter */}
                <Dropdown
                    id="items-type-filter"
                    label="Filter by item type"
                    value={type}
                    options={[
                        { value: '', label: 'All Types' },
                        { value: 'lost', label: 'Lost' },
                        { value: 'found', label: 'Found' },
                    ]}
                    onChange={handleFilterChange(setType)}
                />

                {/* Category Filter */}
                <Dropdown
                    id="items-category-filter"
                    label="Filter by category"
                    value={category}
                    options={[
                        { value: '', label: 'All Categories' },
                        { value: 'Electronics', label: 'Electronics' },
                        { value: 'Books', label: 'Books' },
                        { value: 'Clothing', label: 'Clothing' },
                        { value: 'Accessories', label: 'Accessories' },
                        { value: 'Documents', label: 'Documents' },
                        { value: 'Other', label: 'Other' },
                    ]}
                    onChange={handleFilterChange(setCategory)}
                />

                {/* Status Filter */}
                <Dropdown
                    id="items-status-filter"
                    label="Filter by status"
                    value={status}
                    options={[
                        { value: '', label: 'All Statuses' },
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'MATCHED', label: 'Matched' },
                        { value: 'CLAIMED', label: 'Claimed' },
                        { value: 'UNDER_VERIFICATION', label: 'Under Verification' },
                        { value: 'VERIFIED', label: 'Verified' },
                        { value: 'RETURNED', label: 'Returned' },
                        { value: 'CLOSED', label: 'Closed' },
                    ]}
                    onChange={handleFilterChange(setStatus)}
                />

                {/* Clear All Filters Button */}
                <button
                    type="button"
                    className="report-item-btn"
                    onClick={handleResetFilters}
                >
                    Clear Filters
                </button>

            </div>

            {/* Error Message */}
            {error && (
                <div className="items-error">
                    {error}
                </div>
            )}

            {/* Items List */}
            {loading ? (
                <div className="items-loading">
                    Loading items...
                </div>
            ) : items.length === 0 ? (
                <div className="items-empty">
                    <h3>No items found</h3>
                    <p>Try changing your search or filters.</p>
                </div>
            ) : (
                <div className="items-grid">
                    {items.map((item) => (
                        <div className="item-card" key={item._id}>

                            {item.images?.length > 0 && (
                                <img
                                    src={item.images[0]}
                                    alt={item.title}
                                    className="item-image"
                                />
                            )}

                            <div className="item-card-content">

                                <span className={`item-type ${item.type}`}>
                                    {item.type}
                                </span>

                                <h3>{item.title}</h3>

                                <p>{item.description}</p>

                                <div className="item-details">
                                    <span>
                                        Category: {item.category}
                                    </span>

                                    <span>
                                        Status: {item.status}
                                    </span>
                                </div>

                                {item.date && (
                                    <p className="item-date">
                                        Date: {new Date(
                                            item.date
                                        ).toLocaleDateString()}
                                    </p>
                                )}

                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="items-pagination">

                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                    >
                        Previous
                    </button>

                    <span>
                        Page {page} of {pagination.totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Next
                    </button>

                </div>
            )}

            {/* Report Item Modal */}
            {showForm && (
                <div
                    className="item-modal-overlay"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowForm(false);
                        }
                    }}
                >

                    <div className="item-modal">

                        {/* Modal Header */}
                        <div className="item-modal-header">
                            <div>
                                <h2>Report an Item</h2>
                                <p>
                                    Share the details of the lost or found item.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close-btn"
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* Item Title */}
                            <div className="form-group">
                                <label htmlFor="title">
                                    Item Title *
                                </label>

                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    placeholder="e.g. Black wallet"
                                    value={formData.title}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="description">
                                    Description *
                                </label>

                                <textarea
                                    id="description"
                                    name="description"
                                    placeholder="Describe the item..."
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows="4"
                                    required
                                />
                            </div>

                            {/* Item Type and Category */}
                            <div className="form-row">

                                <div className="form-group">
                                    <label htmlFor="type">
                                        Item Type *
                                    </label>

                                    <Dropdown
                                        id="type"
                                        label="Item Type"
                                        value={formData.type}
                                        options={[
                                            { value: 'lost', label: 'Lost' },
                                            { value: 'found', label: 'Found' },
                                        ]}
                                        onChange={(value) => setFormData((previousData) => ({
                                            ...previousData,
                                            type: value,
                                        }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="category">
                                        Category *
                                    </label>

                                    <Dropdown
                                        id="category"
                                        label="Category"
                                        value={formData.category}
                                        options={[
                                            { value: '', label: 'Select category' },
                                            { value: 'Electronics', label: 'Electronics' },
                                            { value: 'Books', label: 'Books' },
                                            { value: 'Clothing', label: 'Clothing' },
                                            { value: 'Accessories', label: 'Accessories' },
                                            { value: 'Documents', label: 'Documents' },
                                            { value: 'Other', label: 'Other' },
                                        ]}
                                        onChange={(value) => setFormData((previousData) => ({
                                            ...previousData,
                                            category: value,
                                        }))}
                                        required
                                    />
                                </div>

                            </div>

                            {/* Date Picker */}
                            <div className="form-group">
                                <label htmlFor="date">
                                    Date *
                                </label>

                                <div className="date-picker-actions">

                                    <input
                                        ref={dateInputRef}
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleFormChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="date-picker-trigger"
                                        onClick={handleOpenCalendar}
                                        aria-label="Open calendar"
                                        title="Choose a date"
                                    >
                                        📅
                                    </button>

                                    <button
                                        type="button"
                                        className="today-date-btn"
                                        onClick={handleSelectToday}
                                    >
                                        Today
                                    </button>

                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="form-group">
                                <label htmlFor="image">
                                    Item Image (Optional)
                                </label>

                                <input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFormChange}
                                />
                            </div>

                            {/* Form Error */}
                            {formError && (
                                <div className="items-error">
                                    {formError}
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="item-form-actions">

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowForm(false);
                                        resetForm();
                                    }}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit-item-btn"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? 'Submitting...'
                                        : 'Submit Item'}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Items;
