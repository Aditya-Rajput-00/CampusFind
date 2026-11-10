
import { useState } from 'react';
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
    const [loginError, setLoginError] = useState('');

    const handleLogin = async () => {
        setLoginError('');

        try {
            await login({
                email: 'student@test.com',
                password: 'password123',
            });
        } catch (error) {
            setLoginError(error.message);
        }
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

            {loginError && (
                <p role="alert">{loginError}</p>
            )}

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
    const savedUser = {
        _id: 'user-1',
        name: 'Test Student',
        email: 'student@test.com',
        role: 'student',
    };

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

    it('should restore authentication from an existing valid session', () => {
        sessionStorage.setItem('campusfindToken', 'existing-jwt-token');
        sessionStorage.setItem('campusfindUser', JSON.stringify(savedUser));

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('authentication'))
            .toHaveTextContent('Authenticated');

        expect(screen.getByTestId('username'))
            .toHaveTextContent('Test Student');

        expect(screen.getByTestId('token'))
            .toHaveTextContent('existing-jwt-token');
    });

    it('should clear a corrupted saved user and its token', () => {
        sessionStorage.setItem('campusfindToken', 'existing-jwt-token');
        sessionStorage.setItem('campusfindUser', '{invalid-json');

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('authentication'))
            .toHaveTextContent('Not Authenticated');

        expect(sessionStorage.getItem('campusfindToken')).toBeNull();
        expect(sessionStorage.getItem('campusfindUser')).toBeNull();
    });

    it('should authenticate a user after successful login', async () => {
        loginUser.mockResolvedValue({
            success: true,
            data: {
                token: 'test-jwt-token',
                user: savedUser,
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

    it('should reject an unsuccessful login response', async () => {
        loginUser.mockResolvedValue({
            success: false,
            message: 'Account is pending admin approval',
        });

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Account is pending admin approval');

        expect(screen.getByTestId('authentication'))
            .toHaveTextContent('Not Authenticated');

        expect(sessionStorage.getItem('campusfindToken')).toBeNull();
        expect(sessionStorage.getItem('campusfindUser')).toBeNull();
    });

    it('should reject a login response without a JWT token', async () => {
        loginUser.mockResolvedValue({
            success: true,
            data: {
                user: savedUser,
            },
        });

        render(
            <AuthProvider>
                <AuthTestComponent />
            </AuthProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Login failed');

        expect(screen.getByTestId('authentication'))
            .toHaveTextContent('Not Authenticated');

        expect(sessionStorage.getItem('campusfindToken')).toBeNull();
        expect(sessionStorage.getItem('campusfindUser')).toBeNull();
    });

    it('should clear authentication after logout', async () => {
        loginUser.mockResolvedValue({
            success: true,
            data: {
                token: 'test-jwt-token',
                user: savedUser,
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
