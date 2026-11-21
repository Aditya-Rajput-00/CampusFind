
import { useState } from 'react';
import { registerUser } from '../../services/authService';
import campusfindLogo from '../../assets/brand/campusfind-logo-512.png';
import './Login.css';

function Register({ onLoginClick }) {
    const passwordMismatchMessage = 'Passwords do not match. Please enter matching passwords.';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('student');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (event) => {
        event.preventDefault();

        if (password !== confirmPassword) {
            setError(passwordMismatchMessage);
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const result = await registerUser({
                name,
                email,
                password,
                role,
            });

            // Validate the API response before showing success.
            if (!result.success) {
                throw new Error(
                    result.message || 'Registration failed. Please try again.'
                );
            }

            setSuccess(
                result.message ||
                (role === 'staff'
                    ? 'Registration submitted. Please wait for admin approval.'
                    : 'Registration successful. You can now log in.')
            );

            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page login-page--register">
            <div className="login-card login-card--register">
                <h1 aria-label="CampusFind">
                    <img
                        className="auth-brand-logo"
                        src={campusfindLogo}
                        alt="CampusFind graduation cap logo"
                    />
                    CampusFind
                </h1>
                <h2>Create Your Account</h2>
                <p>Join CampusFind to help reunite people with their belongings.</p>

                {success ? (
                    <div>
                        <p
                            className="success-message"
                            role="status"
                            aria-live="polite"
                        >
                            {success}
                        </p>

                        <button
                            className="register-back-button"
                            type="button"
                            onClick={onLoginClick}
                        >
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegister}>
                        <label htmlFor="register-name">Full Name</label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />

                        <label htmlFor="register-email">Email Address</label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <label htmlFor="register-password">Password</label>
                        <div className="login-password-field">
                            <input
                                id="register-password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(event) => {
                                    const nextPassword = event.target.value;
                                    setPassword(nextPassword);
                                    if (
                                        error === passwordMismatchMessage &&
                                        nextPassword === confirmPassword
                                    ) {
                                        setError('');
                                    }
                                }}
                                required
                            />
                            <button
                                className="login-password-toggle"
                                type="button"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                aria-pressed={showPassword}
                                aria-controls="register-password"
                                onClick={() => setShowPassword((isVisible) => !isVisible)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                    {showPassword && <path d="m3 3 18 18" />}
                                </svg>
                            </button>
                        </div>

                        <label htmlFor="register-confirm-password">Confirm Password</label>
                        <div className="login-password-field">
                            <input
                                id="register-confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(event) => {
                                    const nextConfirmPassword = event.target.value;
                                    setConfirmPassword(nextConfirmPassword);
                                    if (
                                        error === passwordMismatchMessage &&
                                        password === nextConfirmPassword
                                    ) {
                                        setError('');
                                    }
                                }}
                                required
                            />
                            <button
                                className="login-password-toggle"
                                type="button"
                                aria-label={showConfirmPassword
                                    ? 'Hide confirm password'
                                    : 'Show confirm password'}
                                aria-pressed={showConfirmPassword}
                                aria-controls="register-confirm-password"
                                onClick={() => setShowConfirmPassword((isVisible) => !isVisible)}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                    {showConfirmPassword && <path d="m3 3 18 18" />}
                                </svg>
                            </button>
                        </div>

                        <label htmlFor="register-role">Register As</label>
                        <select
                            className="register-role-select"
                            id="register-role"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            required
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                        </select>

                        {role === 'staff' && (
                            <p className="register-staff-notice">
                                Staff accounts require admin approval before login.
                            </p>
                        )}

                        {error && (
                            <p className="error-message" role="alert">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>
                )}

                <p className="register-login-prompt">
                    Already have an account?{' '}
                    <button
                        className="register-login-link"
                        type="button"
                        onClick={onLoginClick}
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;
