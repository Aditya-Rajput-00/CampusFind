
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

        fireEvent.change(screen.getByLabelText('Register As'), {
            target: { value: role },
        });
    };

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

    it('registers a staff member successfully', async () => {
        registerUser.mockResolvedValue({
            success: true,
            message: 'Staff registration submitted. Please wait for admin approval.',
        });

        render(<Register onLoginClick={onLoginClick} />);

        fillRegistrationForm('staff');

        expect(
            screen.getByText(/Staff accounts require admin approval/)
        ).toBeInTheDocument();

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
