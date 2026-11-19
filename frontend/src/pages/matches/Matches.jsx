
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import {
    getMatches,
    updateMatchStatus,
} from '../../services/matchService';
import './Matches.css';

function Matches() {
    const { user } = useAuth();

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    // Fetch matches from the backend.
    const loadMatchesData = useCallback(async () => {
        const result = await getMatches();

        if (!result.success) {
            throw new Error(
                result.message || 'Unable to fetch matches'
            );
        }

        return Array.isArray(result.data) ? result.data : [];
    }, []);

    // Refresh matches after an action.
    const fetchMatches = useCallback(async () => {
        try {
            const data = await loadMatchesData();

            setMatches(data);
            setError('');
        } catch (err) {
            console.error('Matches page error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            );
        } finally {
            setLoading(false);
        }
    }, [loadMatchesData]);

    // Load matches when the page opens or user role changes.
    useEffect(() => {
        let isActive = true;

        loadMatchesData()
            .then((data) => {
                if (!isActive) return;

                setMatches(data);
                setError('');
            })
            .catch((err) => {
                if (!isActive) return;

                console.error('Matches page error:', err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'Something went wrong.'
                );
            })
            .finally(() => {
                if (isActive) {
                    setLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [loadMatchesData, user?.role]);

    // Confirm or reject a match.
    const handleStatusUpdate = async (id, status) => {
        const action = status === 'CONFIRMED' ? 'confirm' : 'reject';

        const confirmed = window.confirm(
            `Are you sure you want to ${action} this match?`
        );

        if (!confirmed) return;

        setError('');
        setSuccess('');
        setActionLoading(id);

        try {
            const result = await updateMatchStatus(id, status);

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to update match'
                );
            }

            setSuccess(
                `Match ${status.toLowerCase()} successfully.`
            );

            await fetchMatches();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to update match.'
            );
        } finally {
            setActionLoading('');
        }
    };

    // Calculate statistics.
    const pendingMatches = matches.filter(
        (match) => match.status === 'PENDING'
    );

    const confirmedMatches = matches.filter(
        (match) => match.status === 'CONFIRMED'
    );

    const rejectedMatches = matches.filter(
        (match) => match.status === 'REJECTED'
    );

    const getStatusClass = (status) => {
        return status?.toLowerCase() || 'unknown';
    };

    const formatDate = (date) => {
        if (!date) return 'Date unavailable';

        const parsedDate = new Date(date);

        return Number.isNaN(parsedDate.getTime())
            ? 'Date unavailable'
            : parsedDate.toLocaleDateString();
    };

    return (
        <div className="matches-page">
            <div className="matches-header">
                <h1>
                    {isStudent ? 'My Matches' : 'Matches Management'}
                </h1>

                <p>
                    {isStudent
                        ? 'View potential matches involving your reported items.'
                        : 'Review potential matches and confirm or reject them.'}
                </p>
            </div>

            {error && (
                <div className="matches-alert matches-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="matches-alert matches-success">
                    {success}
                </div>
            )}

            {loading ? (
                <p className="matches-loading">
                    Loading matches...
                </p>
            ) : (
                <>
                    <div className="matches-stats">
                        <div className="match-stat-card">
                            <span>Total Matches</span>
                            <h2>{matches.length}</h2>
                        </div>

                        <div className="match-stat-card">
                            <span>Pending</span>
                            <h2>{pendingMatches.length}</h2>
                        </div>

                        <div className="match-stat-card">
                            <span>Confirmed</span>
                            <h2>{confirmedMatches.length}</h2>
                        </div>

                        <div className="match-stat-card">
                            <span>Rejected</span>
                            <h2>{rejectedMatches.length}</h2>
                        </div>
                    </div>

                    <section className="matches-list-section">
                        <h2>
                            {isStudent
                                ? 'Your Item Matches'
                                : 'All Potential Matches'}
                        </h2>

                        <p className="matches-count">
                            Showing {matches.length} matches
                        </p>

                        {matches.length === 0 ? (
                            <div className="matches-empty">
                                <svg
                                    className="matches-empty__illustration"
                                    viewBox="0 0 164 132"
                                    aria-hidden="true"
                                    focusable="false"
                                >
                                    <path
                                        d="M12 111c17-11 32-12 48-4 18-10 38-9 55-1 12-7 24-7 37-1v15H12z"
                                        fill="var(--brand-soft-taupe)"
                                        opacity="0.55"
                                    />
                                    <path
                                        d="m99 78 34 34"
                                        fill="none"
                                        stroke="var(--brand-muted-cocoa)"
                                        strokeLinecap="round"
                                        strokeWidth="14"
                                    />
                                    <path
                                        d="m99 78 34 34"
                                        fill="none"
                                        stroke="var(--brand-mocha)"
                                        strokeLinecap="round"
                                        strokeWidth="8"
                                    />
                                    <defs>
                                        <clipPath id="matches-campus-lens">
                                            <circle cx="69" cy="52" r="30" />
                                        </clipPath>
                                    </defs>
                                    <circle
                                        cx="69"
                                        cy="52"
                                        r="36"
                                        fill="var(--brand-warm-ivory)"
                                        stroke="var(--brand-mocha)"
                                        strokeWidth="4"
                                    />
                                    <g clipPath="url(#matches-campus-lens)">
                                        <path
                                            d="M34 76h70v12H34z"
                                            fill="var(--brand-muted-cocoa)"
                                        />
                                        <path
                                            d="m38 52 31-21 31 21z"
                                            fill="var(--brand-mocha)"
                                        />
                                        <path
                                            d="M47 51h44v27H47z"
                                            fill="var(--brand-soft-taupe)"
                                        />
                                        <path
                                            d="M64 26h10v17H64z"
                                            fill="var(--brand-muted-cocoa)"
                                        />
                                        <path
                                            d="m61 27 8-9 8 9z"
                                            fill="var(--brand-dark-brown)"
                                        />
                                        <circle
                                            cx="69"
                                            cy="29"
                                            r="3"
                                            fill="var(--brand-warm-ivory)"
                                            stroke="var(--brand-dark-brown)"
                                            strokeWidth="1"
                                        />
                                        <path
                                            d="M54 57h7v8h-7zm22 0h7v8h-7z"
                                            fill="var(--brand-warm-ivory)"
                                        />
                                        <path
                                            d="M65 62h9v16h-9z"
                                            fill="var(--brand-mocha)"
                                        />
                                    </g>
                                    <circle
                                        cx="69"
                                        cy="52"
                                        r="36"
                                        fill="none"
                                        stroke="var(--brand-mocha)"
                                        strokeWidth="4"
                                    />
                                    <circle cx="23" cy="53" r="2" fill="var(--brand-muted-cocoa)" />
                                    <circle cx="111" cy="30" r="2.5" fill="var(--brand-muted-cocoa)" />
                                    <circle cx="121" cy="55" r="1.75" fill="var(--brand-soft-taupe)" />
                                </svg>
                                <div className="matches-empty__content">
                                    <h3>No Matches Found</h3>

                                    <p>
                                        {isStudent
                                            ? 'No matches have been found for your reported items yet.'
                                            : 'There are currently no matches to review.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="matches-grid">
                                {matches.map((match) => {
                                    const lostItem = match.lostItemId;
                                    const foundItem = match.foundItemId;

                                    return (
                                        <article
                                            className="match-card"
                                            key={match._id}
                                        >
                                            <div className="match-card-header">
                                                <span
                                                    className={`match-status ${getStatusClass(
                                                        match.status
                                                    )}`}
                                                >
                                                    {match.status}
                                                </span>

                                                <span className="match-date">
                                                    {formatDate(match.createdAt)}
                                                </span>
                                            </div>

                                            <div className="match-score">
                                                <span>Match Score</span>
                                                <h2>{match.matchScore}</h2>
                                            </div>

                                            <div className="match-items">
                                                <div className="match-item">
                                                    <span className="match-item-label">
                                                        LOST ITEM
                                                    </span>

                                                    <h3>
                                                        {lostItem?.title ||
                                                            'Item information unavailable'}
                                                    </h3>

                                                    <p>
                                                        Category:{' '}
                                                        {lostItem?.category || 'N/A'}
                                                    </p>

                                                    <p>
                                                        Location:{' '}
                                                        {lostItem?.location?.building || 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="match-connector">
                                                    <span>↔</span>
                                                </div>

                                                <div className="match-item">
                                                    <span className="match-item-label">
                                                        FOUND ITEM
                                                    </span>

                                                    <h3>
                                                        {foundItem?.title ||
                                                            'Item information unavailable'}
                                                    </h3>

                                                    <p>
                                                        Category:{' '}
                                                        {foundItem?.category || 'N/A'}
                                                    </p>

                                                    <p>
                                                        Location:{' '}
                                                        {foundItem?.location?.building || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {isStaff && match.status === 'PENDING' && (
                                                <div className="match-actions">
                                                    <button
                                                        className="match-confirm-button"
                                                        disabled={actionLoading === match._id}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                match._id,
                                                                'CONFIRMED'
                                                            )
                                                        }
                                                    >
                                                        Confirm Match
                                                    </button>

                                                    <button
                                                        className="match-reject-button"
                                                        disabled={actionLoading === match._id}
                                                        onClick={() =>
                                                            handleStatusUpdate(
                                                                match._id,
                                                                'REJECTED'
                                                            )
                                                        }
                                                    >
                                                        Reject Match
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Matches;
