
import { useEffect, useState } from 'react';
import { getItems } from '../../services/itemService';
import './Items.css';

const categories = ['Bag', 'Books', 'Wallet'];

const statuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MATCHED', label: 'Matched' },
    { value: 'CLAIMED', label: 'Claimed' },
    { value: 'UNDER_VERIFICATION', label: 'Under Verification' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'CLOSED', label: 'Closed' },
];

const ITEMS_PER_PAGE = 6;

function Items() {
    const [items, setItems] = useState([]);

    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [type, setType] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: ITEMS_PER_PAGE,
        totalItems: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await getItems({
                    search: searchQuery,
                    type,
                    category,
                    status,
                    page,
                    limit: ITEMS_PER_PAGE,
                });

                if (!result.success) {
                    throw new Error(
                        result.message || 'Unable to fetch items'
                    );
                }

                setItems(result.data.items || []);
                setPagination(result.data.pagination);

            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    error.message ||
                    'Something went wrong.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [searchQuery, type, category, status, page]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearchQuery(searchInput.trim());
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setType('');
        setCategory('');
        setStatus('');
        setPage(1);
    };

    const handleTypeChange = (value) => {
        setType(value);
        setPage(1);
    };

    const handleCategoryChange = (value) => {
        setCategory(value);
        setPage(1);
    };

    const handleStatusChange = (value) => {
        setStatus(value);
        setPage(1);
    };

    return (
        <div className="items-page">
            <header className="items-header">
                <h1>Lost & Found Items</h1>
                <p>
                    Find your lost belongings or help someone
                    find theirs.
                </p>
            </header>

            <form className="items-search-form" onSubmit={handleSearch}>
                <input
                    type="text"
                    className="items-search-input"
                    placeholder="Search by item name or description..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />

                <button type="submit" className="search-button">
                    Search
                </button>

                {(searchInput || searchQuery) && (
                    <button
                        type="button"
                        className="clear-search-button"
                        onClick={handleClearFilters}
                    >
                        Clear
                    </button>
                )}
            </form>

            <div className="items-filter-bar">
                <div className="filter-group">
                    <label htmlFor="type-filter">Item Type</label>
                    <select
                        id="type-filter"
                        value={type}
                        onChange={(event) => handleTypeChange(event.target.value)}
                    >
                        <option value="">All Items</option>
                        <option value="lost">Lost</option>
                        <option value="found">Found</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="category-filter">Category</label>
                    <select
                        id="category-filter"
                        value={category}
                        onChange={(event) => handleCategoryChange(event.target.value)}
                    >
                        <option value="">All Categories</option>

                        {categories.map((itemCategory) => (
                            <option key={itemCategory} value={itemCategory}>
                                {itemCategory}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="status-filter">Status</label>
                    <select
                        id="status-filter"
                        value={status}
                        onChange={(event) => handleStatusChange(event.target.value)}
                    >
                        <option value="">All Statuses</option>

                        {statuses.map((itemStatus) => (
                            <option
                                key={itemStatus.value}
                                value={itemStatus.value}
                            >
                                {itemStatus.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    className="reset-filters-button"
                    onClick={handleClearFilters}
                >
                    Reset Filters
                </button>
            </div>

            <div className="items-count">
                Showing {items.length} of {pagination.totalItems} items
            </div>

            {loading ? (
                <p>Loading items...</p>
            ) : error ? (
                <p className="items-error">{error}</p>
            ) : items.length === 0 ? (
                <div className="items-empty">
                    <h2>No items found</h2>
                    <p>Try changing your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="items-grid">
                        {items.map((item) => (
                            <article className="item-card" key={item._id}>
                                {item.images?.length > 0 ? (
                                    <img
                                        className="item-image"
                                        src={item.images[0]}
                                        alt={item.title}
                                    />
                                ) : (
                                    <div className="item-image-placeholder">
                                        No Image Available
                                    </div>
                                )}

                                <div className="item-content">
                                    <div className="item-badges">
                                        <span className={`type-badge ${item.type}`}>
                                            {item.type.toUpperCase()}
                                        </span>

                                        <span className="status-badge">
                                            {item.status.replaceAll('_', ' ')}
                                        </span>
                                    </div>

                                    <h2>{item.title}</h2>

                                    <p className="item-category">
                                        {item.category}
                                    </p>

                                    <p className="item-description">
                                        {item.description}
                                    </p>

                                    {item.location?.building && (
                                        <p className="item-detail">
                                            Location: {item.location.building}
                                        </p>
                                    )}

                                    {item.location?.area && (
                                        <p className="item-detail">
                                            Area: {item.location.area}
                                        </p>
                                    )}

                                    <p className="item-detail">
                                        Date: {new Date(item.date).toLocaleDateString()}
                                    </p>

                                    <p className="item-reporter">
                                        Reported by: {item.reportedBy?.name || 'Unknown'}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="items-pagination">
                            <button
                                className="pagination-button"
                                onClick={() => setPage((current) => current - 1)}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </button>

                            <span className="pagination-info">
                                Page {page} of {pagination.totalPages}
                            </span>

                            <button
                                className="pagination-button"
                                onClick={() => setPage((current) => current + 1)}
                                disabled={page >= pagination.totalPages || loading}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Items;
