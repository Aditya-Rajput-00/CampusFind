import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

const { mockLogin, mockUseAuth } = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('../../context/useAuth.js', () => ({
    useAuth: mockUseAuth,
}));

describe('Login page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogin.mockResolvedValue({ name: 'Test User' });
        mockUseAuth.mockReturnValue({ login: mockLogin });
    });

    it('renders the login form with required email and password fields', () => {
        render(<Login />);

        expect(screen.getByRole('heading', { name: 'CampusFind' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Welcome Back!' })).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeRequired();
        expect(screen.getByLabelText('Password')).toBeRequired();
        expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('starts with the password hidden', () => {
        render(<Login />);

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
        expect(screen.getByRole('button', { name: 'Show password' }))
            .toHaveAttribute('type', 'button');
    });

    it('shows and hides the password without changing its value', () => {
        render(<Login />);
        const passwordInput = screen.getByLabelText('Password');

        fireEvent.change(passwordInput, { target: { value: 'campus-secret' } });
        fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(passwordInput).toHaveValue('campus-secret');
        expect(screen.getByRole('button', { name: 'Hide password' }))
            .toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));

        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(passwordInput).toHaveValue('campus-secret');
        expect(screen.getByRole('button', { name: 'Show password' }))
            .toHaveAttribute('aria-pressed', 'false');
    });

    it('does not submit the form when the password visibility button is clicked', () => {
        render(<Login />);

        fireEvent.change(screen.getByLabelText('Email Address'), {
            target: { value: 'student@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'campus-secret' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('submits the existing email and password and clears the password after success', async () => {
        render(<Login />);

        fireEvent.change(screen.getByLabelText('Email Address'), {
            target: { value: 'student@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'campus-secret' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'student@example.com',
                password: 'campus-secret',
            });
        });

        expect(await screen.findByRole('status'))
            .toHaveTextContent('Welcome, Test User! Login successful.');
        expect(screen.getByLabelText('Password')).toHaveValue('');
    });
});
