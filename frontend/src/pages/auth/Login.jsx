
import { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/useAuth.js';
function Login() {
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
                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />

                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
