
import Login from './pages/auth/Login';
import Items from './pages/items/Items';
import { useAuth } from './context/AuthContext';

function App() {
    const { isAuthenticated, user, logout } = useAuth();

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div>
            <header
                style={{
                    padding: '20px 40px',
                    background: '#151d32',
                    borderBottom: '1px solid #273451',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#ffffff',
                }}
            >
                <h2 style={{ color: '#a78bfa' }}>CampusFind</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span>Welcome, {user?.name}!</span>

                    <button
                        onClick={logout}
                        style={{
                            padding: '10px 18px',
                            background: '#7c3aed',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '7px',
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <Items />
        </div>
    );
}

export default App;
