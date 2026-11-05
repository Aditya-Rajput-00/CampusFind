
import { useState } from 'react';

import Login from './pages/auth/Login';
import Items from './pages/items/Items';
import Claims from './pages/claims/Claims';
import Matches from './pages/matches/Matches';
import Notifications from './pages/notifications/Notifications';
import Dashboard from './pages/dashboard/Dashboard';

import { useAuth } from './context/AuthContext';

function App() {
    const { isAuthenticated, user, logout } = useAuth();
    const [activePage, setActivePage] = useState('items');

    // Check whether the logged-in user is Staff or Admin.
    const isStaffOrAdmin = ['staff', 'admin'].includes(user?.role);

    if (!isAuthenticated) {
        return <Login />;
    }

    // Prevent students from accessing the Dashboard.
    const currentPage =
        !isStaffOrAdmin && activePage === 'dashboard'
            ? 'items'
            : activePage;

    const navigationButtonStyle = (page) => ({
        padding: '10px 18px',
        background: currentPage === page
            ? 'linear-gradient(135deg, #9333ea, #4f46e5)'
            : 'transparent',
        color: '#ffffff',
        border: currentPage === page
            ? 'none'
            : '1px solid #374563',
        borderRadius: '7px',
        cursor: 'pointer',
        fontWeight: 600,
    });

    return (
        <div>
            {/* Application Header */}
            <header
                style={{
                    padding: '20px 40px',
                    background: '#151d32',
                    borderBottom: '1px solid #273451',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '15px',
                    color: '#ffffff',
                }}
            >
                <h2 style={{ color: '#a78bfa' }}>
                    CampusFind
                </h2>

                {/* Navigation */}
                <nav
                    style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        style={navigationButtonStyle('items')}
                        onClick={() => setActivePage('items')}
                    >
                        Lost & Found
                    </button>

                    <button
                        style={navigationButtonStyle('claims')}
                        onClick={() => setActivePage('claims')}
                    >
                        Claims
                    </button>

                    <button
                        style={navigationButtonStyle('matches')}
                        onClick={() => setActivePage('matches')}
                    >
                        Matches
                    </button>

                    <button
                        style={navigationButtonStyle('notifications')}
                        onClick={() => setActivePage('notifications')}
                    >
                        Notifications
                    </button>

                    {/* Dashboard: Staff and Admin only */}
                    {isStaffOrAdmin && (
                        <button
                            style={navigationButtonStyle('dashboard')}
                            onClick={() => setActivePage('dashboard')}
                        >
                            Dashboard
                        </button>
                    )}
                </nav>

                {/* User Information */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    <span>
                        Welcome, {user?.name}!
                    </span>

                    <button
                        onClick={logout}
                        style={{
                            padding: '10px 18px',
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '7px',
                            cursor: 'pointer',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Application Pages */}
            {currentPage === 'items' && <Items />}
            {currentPage === 'claims' && <Claims />}
            {currentPage === 'matches' && <Matches />}
            {currentPage === 'notifications' && <Notifications />}

            {isStaffOrAdmin && currentPage === 'dashboard' && (
                <Dashboard />
            )}
        </div>
    );
}

export default App;
