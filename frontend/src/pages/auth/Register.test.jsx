
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Register from './Register';
import { registerUser } from '../../services/authService';

vi.mock('../../services/authService', () => ({
    registerUser: vi.fn(),
}));

describe('Register Component Tests', () => {
    const onLoginClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const fillRegistrationForm = (role = 'student') => {
        fireEvent.change(screen.getByLabelText('Full Name'), {
            target: { value: 'Test User' },
        });

        fireEvent.change(screen.getByLabelText('Email Address'), {
            target: { value: 'test@example.com' },
        });

        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });

        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'password123' },
        });

        fireEvent.change(screen.getByLabelText('Register As'), {
            target: { value: role },
        });
    };

    it('renders required fields with the default student role and warm design hooks', () => {
        render(<Register onLoginClick={onLoginClick} />);

        expect(screen.getByLabelText('Full Name')).toBeRequired();
        expect(screen.getByLabelText('Email Address')).toBeRequired();
        expect(screen.getByLabelText('Password')).toBeRequired();
        expect(screen.getByLabelText('Confirm Password')).toBeRequired();
        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText('Confirm Password'))
            .toHaveAttribute('type', 'password');

        const roleSelect = screen.getByLabelText('Register As');
        expect(roleSelect).toBeRequired();
        expect(roleSelect).toHaveValue('student');
        expect(roleSelect).toHaveClass('register-role-select');
        expect(roleSelect).not.toHaveAttribute('style');
        expect(screen.getByRole('button', { name: 'Login here' }))
            .toHaveClass('register-login-link');
    });

    it('shows and hides each password field independently', () => {
        render(<Register onLoginClick={onLoginClick} />);

        const passwordInput = screen.getByLabelText('Password');
        const confirmPasswordInput = screen.getByLabelText('Confirm Password');

        fireEvent.click(screen.getByRole('button', { name: 'Show password' }));

        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        fireEvent.click(screen.getByRole('button', { name: 'Show confirm password' }));

        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');

        fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));

        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');

        fireEvent.click(screen.getByRole('button', { name: 'Hide confirm password' }));

        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('registers a student successfully', async () => {
        registerUser.mockResolvedValue({
            success: true,
            message: 'Student account registered successfully',
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm('student');

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'student',
            });
        });

        expect(await screen.findByRole('status'))
            .toHaveTextContent('Student account registered successfully');
    });

    it('blocks registration when passwords do not match', async () => {
        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm();
        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'different-password' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Passwords do not match');
        expect(registerUser).not.toHaveBeenCalled();
    });

    it('clears the mismatch error when corrected and sends no confirmation password', async () => {
        registerUser.mockResolvedValue({
            success: true,
            message: 'Student account registered successfully',
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm();
        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'different-password' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Register' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');

        fireEvent.change(screen.getByLabelText('Confirm Password'), {
            target: { value: 'password123' },
        });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'student',
            });
        });
        expect(await screen.findByRole('status'))
            .toHaveTextContent('Student account registered successfully');
    });

    it('registers a staff member successfully', async () => {
        registerUser.mockResolvedValue({
            success: true,
            message: 'Staff registration submitted. Please wait for admin approval.',
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm('staff');

        const staffNotice = screen.getByText(
            /Staff accounts require admin approval/
        );
        expect(staffNotice).toBeInTheDocument();
        expect(staffNotice).toHaveClass('register-staff-notice');
        expect(staffNotice).not.toHaveAttribute('style');

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        await waitFor(() => {
            expect(registerUser).toHaveBeenCalledWith({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'staff',
            });
        });

        expect(await screen.findByRole('status'))
            .toHaveTextContent('Please wait for admin approval');
    });

    it('displays an error when registration fails', async () => {
        registerUser.mockRejectedValue({
            response: {
                data: {
                    message: 'Email already exists',
                },
            },
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm();

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Email already exists');
    });

    it('displays an error when the API returns success false', async () => {
        registerUser.mockResolvedValue({
            success: false,
            message: 'Registration could not be completed',
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm();

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Registration could not be completed');

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('disables the Register button while registration is processing', async () => {
        let resolveRegistration;

        registerUser.mockReturnValue(
            new Promise((resolve) => {
                resolveRegistration = resolve;
            })
        );

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm();

        fireEvent.click(screen.getByRole('button', { name: 'Register' }));

        const submitButton = screen.getByRole('button', {
            name: 'Creating Account...',
        });

        expect(submitButton).toBeDisabled();

        resolveRegistration({
            success: true,
            message: 'Registration successful',
        });

        await screen.findByRole('status');

        expect(
            screen.getByRole('button', { name: 'Login here' })
        ).toBeInTheDocument();
    });

    it('allows the user to return to login', () => {
        render(<Register onLoginClick={onLoginClick} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Login here' })
        );

        expect(onLoginClick).toHaveBeenCalledTimes(1);
    });
});
