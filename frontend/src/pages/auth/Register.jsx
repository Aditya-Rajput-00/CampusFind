
import { useState } from 'react';
import { registerUser } from '../../services/authService';
import './Login.css';

function Register({ onLoginClick }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async (event) => {
        event.preventDefault();

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
        <div className="login-page">
            <div className="login-card">
                <h1>CampusFind</h1>
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
                        <input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />

                        <label htmlFor="register-role">Register As</label>
                        <select
                            id="register-role"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            required
                            style={{
                                padding: '13px',
                                border: '1px solid #374563',
                                borderRadius: '8px',
                                background: '#0b1326',
                                color: '#ffffff',
                                fontSize: '15px',
                            }}
                        >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                        </select>

                        {role === 'staff' && (
                            <p style={{ fontSize: '13px', marginBottom: 0 }}>
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

                <p style={{ textAlign: 'center', marginTop: '22px' }}>
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={onLoginClick}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#a78bfa',
                            cursor: 'pointer',
                            fontWeight: 600,
                            padding: 0,
                        }}
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Register;
