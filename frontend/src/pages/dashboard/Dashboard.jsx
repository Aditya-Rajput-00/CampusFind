import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { getDashboardStats } from '../../services/dashboardService';
import { getItems } from '../../services/itemService';
import { getClaims } from '../../services/claimService';
import { getMatches } from '../../services/matchService';
import { getUsers } from '../../services/userService';
import './Dashboard.css';

const PAGE_SIZE = 10;
const statisticCards = [
    { key: 'totalUsers', label: 'Total Users', icon: 'users', section: 'users' },
    { key: 'totalItems', label: 'Total Items', icon: 'items', section: 'items' },
    { key: 'lostItems', label: 'Lost Items', icon: 'lost', section: 'lost' },
    { key: 'foundItems', label: 'Found Items', icon: 'found', section: 'found' },
    { key: 'activeItems', label: 'Active Items', icon: 'active', section: 'active' },
    { key: 'returnedItems', label: 'Returned Items', icon: 'returned', section: 'returned' },
    { key: 'pendingClaims', label: 'Pending Claims', icon: 'claims', section: 'claims' },
    { key: 'pendingMatches', label: 'Pending Matches', icon: 'matches', section: 'matches' },
];

const statIconPaths = {
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M20 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    items: ['M3 7l9-4 9 4-9 4-9-4Z', 'M3 7v10l9 4 9-4V7', 'M12 11v10'],
    lost: ['M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z', 'm16 16 5 5'],
    found: ['m5 12 4 4L19 6'],
    active: ['m13 2-3 8h7l-6 12 2-9H6l7-11Z'],
    returned: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
    claims: ['M8 4h8l2 2h3v15H3V6h3l2-2Z', 'M8 12h8', 'M8 16h6'],
    matches: ['M8 7h8a4 4 0 0 1 0 8h-1', 'm13 11-3 4 3 4', 'M16 17H8a4 4 0 0 1 0-8h1'],
};

const sectionTitles = {
    users: 'User directory', items: 'All items', lost: 'Lost items', found: 'Found items',
    active: 'Active items', returned: 'Returned items', claims: 'Claims', matches: 'Matches',
};

const messageFor = (error) => {
    const responseData = error.response?.data;
    const validationDetails = Array.isArray(responseData?.errors)
        ? responseData.errors
            .map(({ path, msg }) => path && msg ? `${path}: ${msg}` : '')
            .filter(Boolean)
            .join('; ')
        : '';

    if (responseData?.message && validationDetails) {
        return `${responseData.message}: ${validationDetails}`;
    }
    return responseData?.message || error.message || 'Something went wrong.';
};
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';
const personName = (person) => person?.name || person?.email || '—';

function Dashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [section, setSection] = useState('');
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalRecords: 0, totalPages: 1 });
    const [recordsLoading, setRecordsLoading] = useState(false);
    const [recordsError, setRecordsError] = useState('');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [accountStatus, setAccountStatus] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

    const loadStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getDashboardStats();
            if (!result.success || !result.data) throw new Error(result.message || 'Unable to fetch dashboard statistics');
            setStats(result.data);
            setLastRefreshedAt(new Date());
        } catch (err) {
            setError(messageFor(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { Promise.resolve().then(loadStats); }, [loadStats]);

    useEffect(() => {
        if (!section) return undefined;
        if (section === 'users' && !isAdmin) return undefined;
        let active = true;
        const timer = window.setTimeout(async () => {
            setRecordsLoading(true);
            setRecordsError('');
            const filters = { page, limit: PAGE_SIZE, search: search.trim() };
            if (section === 'users') {
                if (role) filters.role = role;
                if (accountStatus) filters.accountStatus = accountStatus;
            }
            if (section === 'claims' || section === 'matches') Object.assign(filters, { status });
            if (['items', 'lost', 'found', 'active', 'returned'].includes(section)) {
                if (section === 'lost' || section === 'found') filters.type = section;
                if (section === 'active') filters.status = 'ACTIVE';
                if (section === 'returned') filters.status = 'RETURNED';
                if (!['active', 'returned'].includes(section) && status) filters.status = status;
            }
            try {
                let result;
                let data;
                let pageInfo;
                if (section === 'users') {
                    result = await getUsers(filters);
                    data = result.data;
                    pageInfo = result.pagination;
                } else if (['items', 'lost', 'found', 'active', 'returned'].includes(section)) {
                    result = await getItems(filters);
                    data = result.data?.items;
                    pageInfo = result.data?.pagination;
                } else if (section === 'claims') {
                    result = await getClaims(filters);
                    data = result.data;
                    pageInfo = result.pagination;
                } else {
                    result = await getMatches(filters);
                    data = result.data;
                    pageInfo = result.pagination;
                }
                if (!result?.success) throw new Error(result?.message || `Unable to load ${sectionTitles[section].toLowerCase()}.`);
                if (!Array.isArray(data) || !pageInfo) {
                    throw new Error(result.message || `Unable to load ${sectionTitles[section].toLowerCase()}.`);
                }
                if (!active) return;
                setRecords(data);
                setPagination({
                    ...pageInfo,
                    totalRecords: pageInfo.totalRecords ?? pageInfo.totalItems ?? 0,
                });
            } catch (err) {
                if (active) {
                    setRecords([]);
                    setPagination({ page, limit: PAGE_SIZE, totalRecords: 0, totalPages: 1 });
                    setRecordsError(messageFor(err));
                }
            } finally {
                if (active) setRecordsLoading(false);
            }
        }, search ? 250 : 0);
        return () => { active = false; window.clearTimeout(timer); };
    }, [section, page, search, role, accountStatus, status, isAdmin, recordsRefreshKey]);

    const selectSection = (nextSection) => {
        setSection(nextSection);
        setSearch('');
        setRole('');
        setAccountStatus('');
        setStatus(nextSection === 'claims' || nextSection === 'matches' ? 'PENDING' : '');
        setPage(1);
    };

    const handleRefresh = async () => {
        await loadStats();
        if (section) setRecordsRefreshKey((current) => current + 1);
    };

    const userName = typeof user?.name === 'string' ? user.name.trim().split(/\s+/)[0] : '';
    const currentDate = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date());
    const lastRefreshedLabel = lastRefreshedAt
        ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(lastRefreshedAt)
        : '';
    const lostCount = Number(stats?.lostItems) || 0;
    const foundCount = Number(stats?.foundItems) || 0;
    const largestItemCount = Math.max(lostCount, foundCount);
    const lostBarWidth = largestItemCount ? `${(lostCount / largestItemCount) * 100}%` : '0%';
    const foundBarWidth = largestItemCount ? `${(foundCount / largestItemCount) * 100}%` : '0%';
    const totalRecords = pagination.totalRecords ?? 0;
    const recordCountLabel = recordsError
        ? 'Record count unavailable'
        : `${totalRecords} ${totalRecords === 1 ? 'record' : 'records'}`;
    const recordStart = records.length ? ((page - 1) * (pagination.limit || PAGE_SIZE)) + 1 : 0;
    const recordEnd = Math.min((page - 1) * (pagination.limit || PAGE_SIZE) + records.length, pagination.totalRecords);

    const renderRows = () => {
        if (section === 'users') return records.map((record, index) => <tr key={record._id || `${record.email}-${index}`}><td>{record.name || '—'}</td><td>{record.email || '—'}</td><td>{record.role || '—'}</td><td><span className={`dashboard-status ${String(record.accountStatus || '').toLowerCase()}`}>{record.accountStatus || '—'}</span></td><td>{record.department || '—'}</td><td>{formatDate(record.createdAt)}</td></tr>);
        if (['items', 'lost', 'found', 'active', 'returned'].includes(section)) return records.map((record, index) => <tr key={record._id || index}><td>{record.title || '—'}</td><td>{record.category || '—'}</td><td>{record.type || '—'}</td><td>{[record.location?.building, record.location?.area].filter(Boolean).join(', ') || '—'}</td><td><span className={`dashboard-status ${String(record.status || '').toLowerCase()}`}>{record.status || '—'}</span></td><td>{formatDate(record.date || record.createdAt)}</td></tr>);
        if (section === 'claims') return records.map((record, index) => <tr key={record._id || index}><td>{record.itemId?.title || 'Item unavailable'}</td><td>{personName(record.claimantId)}</td><td>{record.claimantId?.email || '—'}</td><td>{record.proof?.description || '—'}</td><td><span className={`dashboard-status ${String(record.status || '').toLowerCase()}`}>{record.status || '—'}</span></td><td>{formatDate(record.createdAt)}</td></tr>);
        return records.map((record, index) => <tr key={record._id || index}><td>{record.lostItemId?.title || 'Item unavailable'}</td><td>{record.foundItemId?.title || 'Item unavailable'}</td><td>{record.matchScore ?? '—'}</td><td><span className={`dashboard-status ${String(record.status || '').toLowerCase()}`}>{record.status || '—'}</span></td><td>{formatDate(record.createdAt)}</td></tr>);
    };

    const headers = section === 'users' ? ['Name', 'Email', 'Role', 'Account status', 'Department', 'Registered']
        : ['items', 'lost', 'found', 'active', 'returned'].includes(section) ? ['Item', 'Category', 'Type', 'Location', 'Status', 'Date']
            : section === 'claims' ? ['Item', 'Claimant', 'Email', 'Claim details', 'Status', 'Submitted']
                : ['Lost item', 'Found item', 'Match score', 'Status', 'Created'];

    return <main className="dashboard-page">
        <header className="dashboard-header">
            <div className="dashboard-welcome">
                <p className="dashboard-eyebrow">CampusFind management</p>
                <h1>Staff &amp; Admin Dashboard</h1>
                <p className="dashboard-welcome-message">Welcome back{userName ? `, ${userName}` : ''}. Here's your campus overview.</p>
            </div>
            <div className="dashboard-header-actions">
                <p className="dashboard-current-date">{currentDate}</p>
                <button type="button" className="dashboard-refresh-button" onClick={handleRefresh} disabled={loading}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 7v5h-5M4.8 9A7.5 7.5 0 0 1 18 6l2 2M4 17v-5h5m10.2 3A7.5 7.5 0 0 1 6 18l-2-2" /></svg>
                    {loading ? 'Refreshing…' : 'Refresh dashboard'}
                </button>
            </div>
        </header>
        {lastRefreshedLabel && <p className="dashboard-last-refreshed" aria-live="polite">Last refreshed on this device at {lastRefreshedLabel}</p>}
        {error && <div className="dashboard-error" role="alert">{error}</div>}
        {loading && !stats ? <p className="dashboard-loading" role="status">Loading dashboard statistics…</p> : stats ? <>
        {loading && <p className="dashboard-refresh-status" role="status">Refreshing dashboard data…</p>}
        <div className="dashboard-overview-heading"><div><p className="dashboard-eyebrow">At a glance</p><h2>Campus activity</h2></div><p>Choose a statistic to open its records.</p></div>
        <div className="dashboard-stats-grid" role="group" aria-label="Dashboard statistics">
            {statisticCards.map((card) => <button type="button" className={`dashboard-stat-card${section === card.section ? ' is-selected' : ''}`} key={card.key} onClick={() => selectSection(card.section)} aria-pressed={section === card.section}>
                <span className="dashboard-stat-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">{statIconPaths[card.icon].map((path) => <path key={path} d={path} />)}</svg></span><span className="dashboard-stat-label">{card.label}</span><strong>{stats[card.key] ?? 0}</strong><span className="dashboard-stat-link">View records <span aria-hidden="true">→</span></span>
            </button>)}
        </div>
        <section className="dashboard-analytics" aria-labelledby="dashboard-analytics-title">
            <div className="dashboard-analytics-heading">
                <div><p className="dashboard-eyebrow">Item reports</p><h2 id="dashboard-analytics-title">Lost vs Found</h2></div>
                <p>Reported item totals</p>
            </div>
            <div className="dashboard-comparison-chart" role="img" aria-label={`Lost versus Found comparison. ${lostCount} lost items and ${foundCount} found items. Each bar is scaled to the larger count.`}>
                <div className="dashboard-comparison-row">
                    <div className="dashboard-comparison-label"><span>Lost items</span><strong>{lostCount}</strong></div>
                    <div className="dashboard-comparison-track"><span className="dashboard-comparison-bar lost" style={{ width: lostBarWidth }} /></div>
                </div>
                <div className="dashboard-comparison-row">
                    <div className="dashboard-comparison-label"><span>Found items</span><strong>{foundCount}</strong></div>
                    <div className="dashboard-comparison-track"><span className="dashboard-comparison-bar found" style={{ width: foundBarWidth }} /></div>
                </div>
            </div>
        </section>
        </> : !error ? <p className="dashboard-loading">No dashboard data available.</p> : null}
        {section && <section className="dashboard-records" aria-labelledby="dashboard-records-title" aria-busy={recordsLoading}>
            <div className="dashboard-records-heading"><div><p className="dashboard-eyebrow">Management records</p><h2 id="dashboard-records-title">{sectionTitles[section]}</h2><p className="dashboard-record-total">{recordCountLabel}</p></div><button type="button" className="dashboard-back-button" onClick={() => setSection('')}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14 5-7 7 7 7M7 12h14" /></svg>
                Back to overview
            </button></div>
            {!(section === 'users' && !isAdmin) && <div className="dashboard-record-filters">
                <label className="dashboard-search">Search<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={section === 'users' ? 'Name or email' : 'Search records'} /></label>
                {section === 'users' && <><label>Role<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="">All roles</option><option value="student">Student</option><option value="staff">Staff</option><option value="admin">Admin</option></select></label><label>Account status<select value={accountStatus} onChange={(event) => { setAccountStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select></label></>}
                {(section === 'claims' || section === 'matches' || ['items', 'lost', 'found'].includes(section)) && <label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{(section === 'claims' ? ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] : section === 'matches' ? ['PENDING', 'CONFIRMED', 'REJECTED'] : ['ACTIVE', 'MATCHED', 'CLAIMED', 'UNDER_VERIFICATION', 'VERIFIED', 'RETURNED', 'CLOSED']).map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>}
            </div>}
            {section === 'users' && !isAdmin ? <div className="dashboard-error" role="alert">The user directory is available to administrators only.</div> : <>
                {recordsError && <div className="dashboard-error" role="alert">{recordsError}</div>}
                {recordsLoading ? <p className="dashboard-loading" role="status">Loading records…</p> : recordsError ? null : records.length === 0 ? <div className="dashboard-empty"><span className="dashboard-empty-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="10.8" cy="10.8" r="6.2" /><path d="m15.5 15.5 4.2 4.2M8.5 10.8h4.6" /></svg></span><h3>No records found</h3><p>Try adjusting your search or filters.</p></div> : <div className="dashboard-table-wrap" role="region" tabIndex={0} aria-label={`${sectionTitles[section]} table. Scroll horizontally to see all columns.`}><table className="dashboard-table"><caption className="dashboard-visually-hidden">{sectionTitles[section]} records</caption><thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{renderRows()}</tbody></table></div>}
                {!recordsError && <nav className="dashboard-pagination" aria-label="Record pages"><span>Showing {recordStart}–{recordEnd} of {pagination.totalRecords || 0} records <span className="dashboard-page-indicator">Page {pagination.page || page} of {Math.max(1, pagination.totalPages || 1)}</span></span><div><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || recordsLoading}>Previous</button><button type="button" onClick={() => setPage((current) => current + 1)} disabled={recordsLoading || page >= (pagination.totalPages || 1)}>Next</button></div></nav>}
            </>}
        </section>}
    </main>;
}

export default Dashboard;
