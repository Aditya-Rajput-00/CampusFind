
import { useState } from 'react';
import { AuthContext } from './authContext';
import { loginUser } from '../services/authService';

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
