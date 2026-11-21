import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getUsers,
    getStaffAccounts,
    approveStaff,
    rejectStaff,
} from '../../services/userService';
import './StaffApprovals.css';

const STATUSES = [
    { value: '', label: 'All Staff' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

const invalidateRequest = (requestId) => { requestId.current += 1; };

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

function StaffApprovals() {
    const [staff, setStaff] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 0, totalRecords: 0 });
    const [settledListQuery, setSettledListQuery] = useState(null);
    const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [listLoading, setListLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statsError, setStatsError] = useState('');
    const [message, setMessage] = useState('');
    const [selected, setSelected] = useState(null);
    const [confirmation, setConfirmation] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const dialogRef = useRef(null);
    const listRequestId = useRef(0);
    const statsRequestId = useRef(0);
    const mountedRef = useRef(false);
    const detailsOpener = useRef(null);

    const openDetails = (account, event) => {
        detailsOpener.current = event.currentTarget;
        setSelected(account);
    };

    const closeDetails = () => {
        setSelected(null);
        window.requestAnimationFrame(() => {
            if (detailsOpener.current?.isConnected) detailsOpener.current.focus();
            detailsOpener.current = null;
        });
    };

    const handleSearchChange = (event) => {
        const nextSearch = event.target.value;
        if (nextSearch.trim() !== search.trim()) ++listRequestId.current;
        setSearch(nextSearch);
        setPage(1);
    };

    const handleStatusChange = (nextStatus) => {
        if (nextStatus !== status) ++listRequestId.current;
        setStatus(nextStatus);
        setPage(1);
    };

    const changePage = (updatePage) => {
        ++listRequestId.current;
        setPage(updatePage);
    };

    const loadStats = useCallback(async () => {
        const requestId = ++statsRequestId.current;
        setStatsLoading(true);
        setStatsError('');
        try {
            const filters = [undefined, 'pending', 'approved', 'rejected'];
            const responses = await Promise.all(filters.map((accountStatus) =>
                getUsers({ role: 'staff', ...(accountStatus ? { accountStatus } : {}), page: 1, limit: 1 })
            ));
            if (requestId !== statsRequestId.current) return false;
            if (responses.some((result) => !result.success || !result.pagination)) {
                throw new Error('Unable to load staff account statistics.');
            }
            setCounts({
                total: responses[0].pagination.totalRecords,
                pending: responses[1].pagination.totalRecords,
                approved: responses[2].pagination.totalRecords,
                rejected: responses[3].pagination.totalRecords,
            });
            return true;
        } catch (err) {
            if (requestId !== statsRequestId.current) return false;
            setStatsError(getErrorMessage(err, 'Unable to load staff account statistics.'));
            return false;
        } finally {
            if (requestId === statsRequestId.current) setStatsLoading(false);
        }
    }, []);

    const loadStaff = useCallback(async () => {
        const requestId = ++listRequestId.current;
        const queryKey = JSON.stringify([debouncedSearch, status, page]);
        setListLoading(true);
        setError('');
        try {
            const params = { page, limit: 10 };
            if (status) params.accountStatus = status;
            if (debouncedSearch) params.search = debouncedSearch;
            const result = await getStaffAccounts(params);
            if (requestId !== listRequestId.current) return false;
            if (!result.success || !Array.isArray(result.data) || !result.pagination) {
                throw new Error(result.message || 'Unable to fetch staff accounts.');
            }
            setStaff(result.data);
            setPagination(result.pagination);
            setPage((current) => Math.min(current, result.pagination.totalPages || 1));
            setSettledListQuery(queryKey);
            return true;
        } catch (err) {
            if (requestId !== listRequestId.current) return false;
            setError(getErrorMessage(err, 'Unable to fetch staff accounts.'));
            setStaff([]);
            setPagination({ page, totalPages: 0, totalRecords: 0 });
            setSettledListQuery(queryKey);
            return false;
        } finally {
            if (requestId === listRequestId.current) setListLoading(false);
        }
    }, [debouncedSearch, page, status]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            invalidateRequest(listRequestId);
            invalidateRequest(statsRequestId);
        };
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = window.setTimeout(loadStats, 0);
        return () => {
            window.clearTimeout(timer);
            invalidateRequest(statsRequestId);
        };
    }, [loadStats]);

    useEffect(() => {
        ++listRequestId.current;
        if (search.trim() !== debouncedSearch) {
            return () => invalidateRequest(listRequestId);
        }
        const timer = window.setTimeout(loadStaff, 0);
        return () => {
            window.clearTimeout(timer);
            invalidateRequest(listRequestId);
        };
    }, [debouncedSearch, loadStaff, search]);

    useEffect(() => {
        if (!selected && !confirmation) return undefined;
        const dialog = dialogRef.current;
        const focusable = () => [...dialog.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )];
        focusable()[0]?.focus();
        const handleDialogKeyDown = (event) => {
            if (event.key === 'Escape' && !actionLoading) {
                if (selected) closeDetails();
                else setSelected(null);
                setConfirmation(null);
                return;
            }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            if (elements.length === 0) return;
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleDialogKeyDown);
        return () => document.removeEventListener('keydown', handleDialogKeyDown);
    }, [selected, confirmation, actionLoading]);

    const handleAction = async () => {
        if (!confirmation || actionLoading) return;
        const { account, action } = confirmation;
        setActionLoading(true);
        setError('');
        setMessage('');
        try {
            const result = action === 'approve'
                ? await approveStaff(account._id)
                : await rejectStaff(account._id);
            if (!mountedRef.current) return;
            if (!result.success) throw new Error(result.message || `Unable to ${action} this account.`);
            setConfirmation(null);
            setMessage(result.message || `Staff account ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
            await Promise.all([loadStaff(), loadStats()]);
        } catch (err) {
            if (!mountedRef.current) return;
            if (err.response?.status === 409) {
                setConfirmation(null);
                const [listRefreshed, statsRefreshed] = await Promise.all([loadStaff(), loadStats()]);
                if (!mountedRef.current) return;
                setError(listRefreshed && statsRefreshed
                    ? 'This account status changed while you were reviewing it. The latest account information has been refreshed.'
                    : 'This account status changed while you were reviewing it, but the latest information could not be fully refreshed. Please try Refresh again.');
            } else {
                if (!mountedRef.current) return;
                setError(getErrorMessage(err, `Unable to ${action} this staff account.`));
            }
        } finally {
            if (mountedRef.current) setActionLoading(false);
        }
    };

    const totalPages = pagination.totalPages || 0;
    const searchUpdating = search.trim() !== debouncedSearch;
    const queryUpdating = settledListQuery !== JSON.stringify([debouncedSearch, status, page]);
    const listUpdating = listLoading || searchUpdating || queryUpdating;

    return (
        <main className="staff-approvals-page">
            <header className="staff-approvals-header">
                <div>
                    <h1>Staff Approvals</h1>
                    <p>Review staff accounts and manage approval requests.</p>
                </div>
                <button type="button" className="staff-refresh-button" onClick={() => { loadStaff(); loadStats(); }} disabled={listLoading || statsLoading || actionLoading}>
                    {listLoading || statsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
            </header>

            {error && !confirmation && <div className="staff-alert staff-alert-error" role="alert">{error}</div>}
            {statsError && <div className="staff-alert staff-alert-error" role="alert">{statsError}</div>}
            {message && <div className="staff-alert staff-alert-success" role="status">{message}</div>}

            <section className="staff-stat-grid" aria-label="Staff account statistics">
                {[
                    ['Total Staff', counts.total],
                    ['Pending Approvals', counts.pending],
                    ['Approved Accounts', counts.approved],
                    ['Rejected Accounts', counts.rejected],
                ].map(([label, count]) => (
                    <article className="staff-stat-card" key={label}>
                        <span>{label}</span>
                        <strong aria-label={statsLoading ? `${label} loading` : statsError ? `${label} unavailable` : `${label}: ${count}`}>
                            {statsLoading ? '…' : statsError ? '—' : count}
                        </strong>
                    </article>
                ))}
            </section>

            <section className="staff-directory" aria-labelledby="staff-directory-title">
                <div className="staff-directory-heading">
                    <div>
                        <h2 id="staff-directory-title">Staff accounts</h2>
                        <p>{listUpdating ? (searchUpdating ? 'Updating search results…' : 'Updating staff accounts…') : `${pagination.totalRecords} account${pagination.totalRecords === 1 ? '' : 's'} in this view`}</p>
                    </div>
                    <label className="staff-search-label">
                        <span>Search staff</span>
                        <input
                            type="search"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Name or email"
                        />
                    </label>
                </div>

                <div className="staff-status-filters" role="group" aria-label="Filter staff by status">
                    {STATUSES.map((item) => (
                        <button
                            type="button"
                            key={item.value || 'all'}
                            className={status === item.value ? 'is-selected' : ''}
                            aria-pressed={status === item.value}
                            onClick={() => handleStatusChange(item.value)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {listUpdating ? (
                    <p className="staff-loading" role="status">{searchUpdating ? 'Updating search results…' : listLoading ? 'Loading staff accounts…' : 'Updating staff accounts…'}</p>
                ) : error && staff.length === 0 ? (
                    <div className="staff-empty-state"><h3>Staff list unavailable</h3><p>Refresh the page or try again shortly.</p></div>
                ) : staff.length === 0 ? (
                    <div className="staff-empty-state">
                        <h3>{debouncedSearch ? 'No matching staff accounts' : 'No staff accounts found'}</h3>
                        <p>{debouncedSearch ? 'Try another name or email address.' : 'Accounts matching this status will appear here.'}</p>
                    </div>
                ) : (
                    <div className="staff-table-wrap">
                        <table className="staff-table">
                            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Department</th><th scope="col">Phone</th><th scope="col">Registered</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
                            <tbody>
                                {staff.map((account) => (
                                    <tr key={account._id}>
                                        <th scope="row">{account.name}</th>
                                        <td>{account.email}</td>
                                        <td>{account.department || '—'}</td>
                                        <td>{account.phone || '—'}</td>
                                        <td>{formatDate(account.createdAt) || '—'}</td>
                                        <td><span className={`staff-status-badge status-${account.accountStatus}`}>{account.accountStatus}</span></td>
                                        <td className="staff-row-actions">
                                            <button type="button" className="staff-secondary-button" onClick={(event) => openDetails(account, event)}>View Details</button>
                                            {account.accountStatus === 'pending' && <>
                                                <button type="button" className="staff-approve-button" disabled={actionLoading} onClick={() => setConfirmation({ account, action: 'approve' })}>Approve</button>
                                                <button type="button" className="staff-reject-button" disabled={actionLoading} onClick={() => setConfirmation({ account, action: 'reject' })}>Reject</button>
                                            </>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="staff-mobile-list">
                            {staff.map((account) => (
                                <article className="staff-mobile-card" key={account._id}>
                                    <div className="staff-mobile-heading"><h3>{account.name}</h3><span className={`staff-status-badge status-${account.accountStatus}`}>{account.accountStatus}</span></div>
                                    <p>{account.email}</p>
                                    {account.department && <p><strong>Department:</strong> {account.department}</p>}
                                    {account.phone && <p><strong>Phone:</strong> {account.phone}</p>}
                                    {formatDate(account.createdAt) && <p><strong>Registered:</strong> {formatDate(account.createdAt)}</p>}
                                    <div className="staff-mobile-actions">
                                        <button type="button" className="staff-secondary-button" onClick={(event) => openDetails(account, event)}>View Details</button>
                                        {account.accountStatus === 'pending' && <>
                                            <button type="button" className="staff-approve-button" disabled={actionLoading} onClick={() => setConfirmation({ account, action: 'approve' })}>Approve</button>
                                            <button type="button" className="staff-reject-button" disabled={actionLoading} onClick={() => setConfirmation({ account, action: 'reject' })}>Reject</button>
                                        </>}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                )}

                {totalPages > 0 && !searchUpdating && (
                    <nav className="staff-pagination" aria-label="Staff accounts pages">
                        <button type="button" className="staff-secondary-button" onClick={() => changePage((current) => Math.max(1, current - 1))} disabled={listUpdating || page <= 1}>Previous</button>
                        <span>{queryUpdating ? 'Updating pages…' : `Page ${pagination.page} of ${totalPages}`}</span>
                        <button type="button" className="staff-secondary-button" onClick={() => changePage((current) => Math.min(totalPages, current + 1))} disabled={listUpdating || page >= totalPages}>Next</button>
                    </nav>
                )}
            </section>

            {selected && (
                <div className="staff-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
                    <section className="staff-modal" role="dialog" aria-modal="true" aria-labelledby="staff-details-title" tabIndex={-1} ref={dialogRef}>
                        <div className="staff-modal-heading"><div><span className="staff-modal-eyebrow">Staff account</span><h2 id="staff-details-title">Account details</h2></div><button type="button" className="staff-modal-close" aria-label="Close details" onClick={closeDetails}>×</button></div>
                        <dl className="staff-details-list">
                            <div><dt>Full name</dt><dd>{selected.name}</dd></div>
                            <div><dt>Email</dt><dd>{selected.email}</dd></div>
                            <div><dt>Role</dt><dd>{selected.role}</dd></div>
                            <div><dt>Department</dt><dd>{selected.department || 'Not provided'}</dd></div>
                            <div><dt>Phone</dt><dd>{selected.phone || 'Not provided'}</dd></div>
                            <div><dt>Account status</dt><dd><span className={`staff-status-badge status-${selected.accountStatus}`}>{selected.accountStatus}</span></dd></div>
                            <div><dt>Registration date</dt><dd>{formatDate(selected.createdAt) || 'Not available'}</dd></div>
                        </dl>
                    </section>
                </div>
            )}

            {confirmation && (
                <div className="staff-modal-backdrop">
                    <section className="staff-modal staff-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="staff-confirm-title" aria-describedby="staff-confirm-description" tabIndex={-1} ref={dialogRef}>
                        <div className="staff-modal-heading"><div><span className="staff-modal-eyebrow">Confirm action</span><h2 id="staff-confirm-title">{confirmation.action === 'approve' ? 'Approve staff account?' : 'Reject staff account?'}</h2></div></div>
                        <p id="staff-confirm-description">{confirmation.action === 'approve' ? 'This will allow' : 'This will reject'} <strong>{confirmation.account.name}</strong> ({confirmation.account.email}).</p>
                        {error && <div className="staff-alert staff-alert-error" role="alert">{error}</div>}
                        <div className="staff-confirm-actions">
                            <button type="button" className="staff-secondary-button" onClick={() => setConfirmation(null)} disabled={actionLoading}>Cancel</button>
                            <button type="button" className={confirmation.action === 'approve' ? 'staff-approve-button' : 'staff-reject-button'} onClick={handleAction} disabled={actionLoading}>
                                {actionLoading ? 'Processing…' : confirmation.action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

export default StaffApprovals;
