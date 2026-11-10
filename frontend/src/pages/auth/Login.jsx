
import { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/useAuth.js';

function Login({ onRegisterClick }) {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="login-page">
            <div className="login-card">
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
                    <input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

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

                <p style={{ textAlign: 'center', marginTop: '22px' }}>
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={onRegisterClick}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a78bfa',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                        }}
                    >
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Login;
