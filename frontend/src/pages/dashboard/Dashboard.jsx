
import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../services/dashboardService';
import './Dashboard.css';

const statisticCards = [
    { key: 'totalUsers', label: 'Total Users', icon: 'USERS' },
    { key: 'totalItems', label: 'Total Items', icon: 'ITEMS' },
    { key: 'lostItems', label: 'Lost Items', icon: 'LOST' },
    { key: 'foundItems', label: 'Found Items', icon: 'FOUND' },
    { key: 'activeItems', label: 'Active Items', icon: 'ACTIVE' },
    { key: 'returnedItems', label: 'Returned Items', icon: 'DONE' },
    { key: 'pendingClaims', label: 'Pending Claims', icon: 'CLAIMS' },
    { key: 'pendingMatches', label: 'Pending Matches', icon: 'MATCH' },
];

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load statistics when the page opens.
    useEffect(() => {
        let isActive = true;

        getDashboardStats()
            .then((result) => {
                if (!isActive) return;

                if (!result.success || !result.data) {
                    throw new Error(
                        result.message || 'Unable to fetch dashboard statistics'
                    );
                }

                setStats(result.data);
                setError('');
            })
            .catch((err) => {
                if (!isActive) return;

                console.error('Dashboard error:', err);

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
    }, []);

    // Refresh dashboard statistics manually.
    const handleRefresh = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getDashboardStats();

            if (!result.success || !result.data) {
                throw new Error(
                    result.message || 'Unable to fetch dashboard statistics'
                );
            }

            setStats(result.data);
        } catch (err) {
            console.error('Dashboard error:', err);

            setError(
                err.response?.data?.message ||
                err.message ||
                'Something went wrong.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Staff & Admin Dashboard</h1>
                    <p>
                        Monitor CampusFind users, items, claims and matches.
                    </p>
                </div>

                <button
                    className="dashboard-refresh-button"
                    onClick={handleRefresh}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="dashboard-loading">
                    Loading dashboard statistics...
                </p>
            ) : stats ? (
                <div className="dashboard-stats-grid">
                    {statisticCards.map((card) => (
                        <div
                            className="dashboard-stat-card"
                            key={card.key}
                        >
                            <div className="dashboard-stat-top">
                                <span className="dashboard-stat-icon">
                                    {card.icon}
                                </span>

                                <span className="dashboard-stat-label">
                                    {card.label}
                                </span>
                            </div>

                            <h2>{stats[card.key] ?? 0}</h2>
                        </div>
                    ))}
                </div>
            ) : !error ? (
                <p className="dashboard-loading">
                    No dashboard data available.
                </p>
            ) : null}
        </div>
    );
}

export default Dashboard;
