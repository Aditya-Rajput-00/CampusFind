
import { useState } from 'react';
import { registerUser } from '../../services/authService';
import campusfindLogo from '../../assets/brand/campusfind-logo-512.png';
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
