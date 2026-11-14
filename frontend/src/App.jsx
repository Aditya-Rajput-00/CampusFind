
import { useState } from 'react';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Items from './pages/items/Items';
import Claims from './pages/claims/Claims';
import Matches from './pages/matches/Matches';
import Notifications from './pages/notifications/Notifications';
import Dashboard from './pages/dashboard/Dashboard';
import StaffApprovals from './pages/admin/StaffApprovals';

import { useAuth } from './context/useAuth.js';
import './App.css';

function App() {
    const { isAuthenticated, user, logout } = useAuth();
    const [activePage, setActivePage] = useState('items');
    const [authView, setAuthView] = useState('login');

    if (!isAuthenticated) {
        return authView === 'register' ? (
            <Register onLoginClick={() => setAuthView('login')} />
        ) : (
            <Login onRegisterClick={() => setAuthView('register')} />
        );
    }

    const isStaffOrAdmin = ['staff', 'admin'].includes(user?.role);
    const isAdmin = user?.role === 'admin';

    // Restrict dashboard and staff approvals to their authorized roles.
    const currentPage =
        (!isStaffOrAdmin && activePage === 'dashboard') ||
            (!isAdmin && activePage === 'staff-approvals')
            ? 'items'
            : activePage;

    const firstName = typeof user?.name === 'string'
        ? user.name.trim().split(/\s+/)[0]
        : '';

    const navigationButtonClass = (page) =>
        `app-header__nav-button${currentPage === page ? ' is-active' : ''}`;

    return (
        <div>
            {/* Application Header */}
            <header className="app-header">
                <h2 className="app-header__brand">
                    CampusFind
                </h2>

                {/* Navigation */}
                <nav className="app-header__nav" aria-label="Main navigation">
                    <button
                        className={navigationButtonClass('items')}
                        aria-current={currentPage === 'items' ? 'page' : undefined}
                        onClick={() => setActivePage('items')}
                    >
                        Lost & Found
                    </button>

                    <button
                        className={navigationButtonClass('claims')}
                        aria-current={currentPage === 'claims' ? 'page' : undefined}
                        onClick={() => setActivePage('claims')}
                    >
                        Claims
                    </button>

                    <button
                        className={navigationButtonClass('matches')}
                        aria-current={currentPage === 'matches' ? 'page' : undefined}
                        onClick={() => setActivePage('matches')}
                    >
                        Matches
                    </button>

                    <button
                        className={navigationButtonClass('notifications')}
                        aria-current={currentPage === 'notifications' ? 'page' : undefined}
                        onClick={() => setActivePage('notifications')}
                    >
                        Notifications
                    </button>

                    {/* Dashboard: Staff and Admin only */}
                    {isStaffOrAdmin && (
                        <button
                            className={navigationButtonClass('dashboard')}
                            aria-current={currentPage === 'dashboard' ? 'page' : undefined}
                            onClick={() => setActivePage('dashboard')}
                        >
                            Dashboard
                        </button>
                    )}

                    {/* Staff Approvals: Admin only */}
                    {isAdmin && (
                        <button
                            className={navigationButtonClass('staff-approvals')}
                            aria-current={currentPage === 'staff-approvals' ? 'page' : undefined}
                            onClick={() => setActivePage('staff-approvals')}
                        >
                            Staff Approvals
                        </button>
                    )}
                </nav>

                {/* User Information */}
                <div className="app-header__user">
                    <div
                        className="app-header__profile"
                        role="group"
                        aria-label={firstName ? `Signed in as ${firstName}` : 'Signed in user'}
                    >
                        <span className="app-header__profile-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" focusable="false">
                                <circle cx="12" cy="8" r="3.25" />
                                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
                            </svg>
                        </span>
                        {firstName && (
                            <span className="app-header__profile-name">
                                {firstName}
                            </span>
                        )}
                    </div>

                    <button
                        className="app-header__logout"
                        aria-label="Logout"
                        onClick={logout}
                    >
                        <svg
                            className="app-header__logout-icon"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path d="M10 17l5-5-5-5M15 12H3" />
                            <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                        </svg>
                        <span>Sign out</span>
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

            {isAdmin && currentPage === 'staff-approvals' && (
                <StaffApprovals />
            )}
        </div>
    );
}

export default App;
