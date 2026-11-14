
import { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/useAuth.js';

function Login({ onRegisterClick }) {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLogin = async (event) => {
        event.preventDefault();

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const user = await login({ email, password });

            setSuccess(`Welcome, ${user.name}! Login successful.`);
            setPassword('');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                error.message ||
                'Something went wrong. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page login-page--login">
            <div className="login-card login-card--login">
                <h1>CampusFind</h1>
                <h2>Welcome Back!</h2>
                <p>Log in to your CampusFind account.</p>

                <form onSubmit={handleLogin}>
                    <label htmlFor="login-email">Email Address</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label htmlFor="login-password">Password</label>
                    <div className="login-password-field">
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                        <button
                            className="login-password-toggle"
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword((isVisible) => !isVisible)}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                <circle cx="12" cy="12" r="3" />
                                {showPassword && <path d="m3 3 18 18" />}
                            </svg>
                        </button>
                    </div>

                    {error && (
                        <p className="error-message" role="alert">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="success-message" role="status">
                            {success}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="login-register-prompt">
                    Don't have an account?{' '}
                    <button
                        className="login-register-link"
                        type="button"
                        onClick={onRegisterClick}
                    >
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
