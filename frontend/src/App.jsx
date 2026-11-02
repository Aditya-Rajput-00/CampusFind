import Login from './pages/auth/Login';
import { useAuth } from './context/AuthContext';

function App() {
    const { isAuthenticated, user, logout } = useAuth();

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h1>CampusFind</h1>

                <h2>Welcome, {user?.name}!</h2>

                <p>You are successfully logged in.</p>

                <button onClick={logout}>
                    Logout
                </button>
            </div>
        </div>
    );
}

export default App;