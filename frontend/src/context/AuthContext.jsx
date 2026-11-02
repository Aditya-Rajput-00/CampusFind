
import { createContext, useContext, useState } from 'react';
import { loginUser } from '../services/authService';

// Create authentication context
const AuthContext = createContext(null);

// Authentication provider
export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const savedUser = sessionStorage.getItem('campusfindUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            sessionStorage.removeItem('campusfindUser');
            return null;
        }
    });
    const [token, setToken] = useState(() => {
        return sessionStorage.getItem('campusfindToken');
    });

    // Login function
    const login = async (credentials) => {
        const result = await loginUser(credentials);

        if (!result.success || !result.data?.token) {
            throw new Error(result.message || 'Login failed');
        }

        const { token, user } = result.data;

        sessionStorage.setItem('campusfindToken', token);
        sessionStorage.setItem('campusfindUser', JSON.stringify(user));

        setToken(token);
        setUser(user);

        return user;
    };

    // Logout function
    const logout = () => {
        sessionStorage.removeItem('campusfindToken');
        sessionStorage.removeItem('campusfindUser');

        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to access authentication
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
