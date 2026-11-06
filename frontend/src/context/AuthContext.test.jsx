
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';
import { loginUser } from '../services/authService';

vi.mock('../services/authService', () => ({
    loginUser: vi.fn(),
}));

function AuthTestComponent() {
    const { user, token, isAuthenticated, login, logout } = useAuth();

    const handleLogin = async () => {
        await login({
            email: 'student@test.com',
            password: 'password123',
        });
    };

    return (
        <div>
            <p data-testid="authentication">
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </p>

            <p data-testid="username">
                {user?.name || 'No User'}
            </p>

            <p data-testid="token">
                {token || 'No Token'}
            </p>

            <button onClick={handleLogin}>
                Login
            </button>

            <button onClick={logout}>
                Logout
            </button>
        </div>
    );
}

describe('AuthContext Integration Tests', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    it('should start with an unauthenticated user', () => {
        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('authentication'))
            .toHaveTextContent('Not Authenticated');

        expect(screen.getByTestId('username'))
            .toHaveTextContent('No User');

        expect(screen.getByTestId('token'))
            .toHaveTextContent('No Token');
    });

    it('should authenticate a user after successful login', async () => {
        loginUser.mockResolvedValue({
            success: true,
            data: {
                token: 'test-jwt-token',
                user: {
                    _id: 'user-1',
                    name: 'Test Student',
                    email: 'student@test.com',
                    role: 'student',
                },
            },
        });

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByTestId('authentication'))
                .toHaveTextContent('Authenticated');

            expect(screen.getByTestId('username'))
                .toHaveTextContent('Test Student');

            expect(screen.getByTestId('token'))
                .toHaveTextContent('test-jwt-token');
        });

        expect(sessionStorage.getItem('campusfindToken'))
            .toBe('test-jwt-token');

        expect(JSON.parse(sessionStorage.getItem('campusfindUser')))
            .toMatchObject({
                name: 'Test Student',
                role: 'student',
            });
    });

    it('should clear authentication after logout', async () => {
        loginUser.mockResolvedValue({
            success: true,
            data: {
                token: 'test-jwt-token',
                user: {
                    _id: 'user-1',
                    name: 'Test Student',
                    role: 'student',
                },
            },
        });

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(screen.getByTestId('authentication'))
                .toHaveTextContent('Authenticated');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

        await waitFor(() => {
            expect(screen.getByTestId('authentication'))
                .toHaveTextContent('Not Authenticated');

            expect(screen.getByTestId('username'))
                .toHaveTextContent('No User');

            expect(screen.getByTestId('token'))
                .toHaveTextContent('No Token');
        });

        expect(sessionStorage.getItem('campusfindToken')).toBeNull();
        expect(sessionStorage.getItem('campusfindUser')).toBeNull();
    });
});
