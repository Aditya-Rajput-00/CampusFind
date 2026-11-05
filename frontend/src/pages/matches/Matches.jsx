
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    const fetchMatches = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getMatches();

            if (!result.success) {
                throw new Error(
                    result.message || 'Unable to fetch matches'
                );
            }

            setMatches(
                Array.isArray(result.data) ? result.data : []
            );
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
    };

    useEffect(() => {
        fetchMatches();
    }, [user?.role]);

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
                                <h3>No Matches Found</h3>

                                <p>
                                    {isStudent
                                        ? 'No matches have been found for your reported items yet.'
                                        : 'There are currently no matches to review.'}
                                </p>
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
                                                        {lostItem?.location?.building ||
                                                            'N/A'}
                                                    </p>
                                                </div>

                                                <div className="match-connector">
                                                    <span>↕</span>
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
                                                        {foundItem?.location?.building ||
                                                            'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {isStaff && match.status === 'PENDING' && (
                                                <div className="match-actions">
                                                    <button
                                                        className="match-confirm-button"
                                                        disabled={
                                                            actionLoading === match._id
                                                        }
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
                                                        disabled={
                                                            actionLoading === match._id
                                                        }
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
