
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const { mockUseAuth } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
}));

vi.mock('./context/useAuth.js', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('./pages/auth/Login', () => ({
    default: ({ onRegisterClick }) => (
        <button onClick={onRegisterClick}>Register</button>
    ),
}));

vi.mock('./pages/auth/Register', () => ({
    default: ({ onLoginClick }) => (
        <button onClick={onLoginClick}>Back to Login</button>
    ),
}));

vi.mock('./pages/items/Items', () => ({
    default: () => <div>Lost and Found Page</div>,
}));

vi.mock('./pages/claims/Claims', () => ({
    default: () => <div>Claims Page</div>,
}));

vi.mock('./pages/matches/Matches', () => ({
    default: () => <div>Matches Page</div>,
}));

vi.mock('./pages/notifications/Notifications', () => ({
    default: () => <div>Notifications Page</div>,
}));

vi.mock('./pages/dashboard/Dashboard', () => ({
    default: () => <div>Dashboard Page</div>,
}));

vi.mock('./pages/admin/StaffApprovals', () => ({
    default: () => <div>Staff Approvals Page</div>,
}));

describe('App Navigation and Role Permissions', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                name: 'Test User',
                role: 'student',
            },
            logout: mockLogout,
        });
    });

    it('allows students to access Lost and Found only', () => {
        render(<App />);

        expect(screen.getByText('Lost and Found Page')).toBeInTheDocument();

        expect(
            screen.queryByRole('button', { name: 'Dashboard' })
        ).not.toBeInTheDocument();

        expect(
            screen.queryByRole('button', { name: 'Staff Approvals' })
        ).not.toBeInTheDocument();
    });

    it('exposes the active page to assistive technology and updates it on navigation', () => {
        render(<App />);

        const itemsButton = screen.getByRole('button', { name: 'Lost & Found' });
        const claimsButton = screen.getByRole('button', { name: 'Claims' });

        expect(itemsButton).toHaveAttribute('aria-current', 'page');
        expect(claimsButton).not.toHaveAttribute('aria-current');

        fireEvent.click(claimsButton);

        expect(claimsButton).toHaveAttribute('aria-current', 'page');
        expect(itemsButton).not.toHaveAttribute('aria-current');
    });

    it('shows only the authenticated user first name in the profile', () => {
        render(<App />);

        expect(
            screen.getByRole('group', { name: 'Signed in as Test' })
        ).toHaveTextContent('Test');
        expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument();
    });

    it('keeps navigation and Logout controls keyboard focusable', () => {
        render(<App />);

        const navigationButton = screen.getByRole('button', { name: 'Claims' });
        const logoutButton = screen.getByRole('button', { name: 'Logout' });

        expect(navigationButton).toHaveProperty('tabIndex', 0);
        expect(logoutButton).toHaveProperty('tabIndex', 0);

        navigationButton.focus();
        expect(document.activeElement).toBe(navigationButton);

        logoutButton.focus();
        expect(document.activeElement).toBe(logoutButton);
    });

    it('allows staff to access Dashboard but not Staff Approvals', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                name: 'Test Staff',
                role: 'staff',
            },
            logout: mockLogout,
        });

        render(<App />);

        expect(
            screen.getByRole('button', { name: 'Dashboard' })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('button', { name: 'Staff Approvals' })
        ).not.toBeInTheDocument();
    });

    it('allows admins to access Dashboard and Staff Approvals', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                name: 'Test Admin',
                role: 'admin',
            },
            logout: mockLogout,
        });

        render(<App />);

        expect(
            screen.getByRole('button', { name: 'Dashboard' })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('button', { name: 'Staff Approvals' })
        ).toBeInTheDocument();
    });

    it('opens the Staff Approvals page when an admin clicks its button', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                name: 'Test Admin',
                role: 'admin',
            },
            logout: mockLogout,
        });

        render(<App />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Staff Approvals' })
        );

        expect(screen.getByText('Staff Approvals Page')).toBeInTheDocument();
    });

    it('allows unauthenticated users to switch to registration', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            user: null,
            logout: mockLogout,
        });

        render(<App />);

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        expect(
            screen.getByRole('button', { name: 'Back to Login' })
        ).toBeInTheDocument();
    });

    it('allows users to logout', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: {
                name: 'Test Admin',
                role: 'admin',
            },
            logout: mockLogout,
        });

        render(<App />);

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });
});
