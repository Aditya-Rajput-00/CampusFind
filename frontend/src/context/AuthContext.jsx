
import { useState } from 'react';
import { AuthContext } from './authContext';
import { loginUser } from '../services/authService';

const validRoles = ['student', 'staff', 'admin'];

// Check whether stored user information is valid.
const isValidUser = (user) => {
    return (
        user !== null &&
        typeof user === 'object' &&
        !Array.isArray(user) &&
        validRoles.includes(user.role)
    );
};

// Restore authentication only when both token and user are valid.
const getInitialSession = () => {
    const token = sessionStorage.getItem('campusfindToken');
    const savedUser = sessionStorage.getItem('campusfindUser');

    try {
        if (!token || !token.trim() || !savedUser) {
            throw new Error('Incomplete session');
        }

        const user = JSON.parse(savedUser);

        if (!isValidUser(user)) {
            throw new Error('Invalid user information');
        }

        return { user, token };
    } catch {
        sessionStorage.removeItem('campusfindToken');
        sessionStorage.removeItem('campusfindUser');

        return {
            user: null,
            token: null,
        };
    }
};

export function AuthProvider({ children }) {
    const [session, setSession] = useState(getInitialSession);

    const login = async (credentials) => {
        const result = await loginUser(credentials);

        const token = result?.data?.token;
        const user = result?.data?.user;

        if (
            !result?.success ||
            typeof token !== 'string' ||
            !token.trim() ||
            !isValidUser(user)
        ) {
            throw new Error(result?.message || 'Login failed');
        }

        sessionStorage.setItem('campusfindToken', token);
        sessionStorage.setItem('campusfindUser', JSON.stringify(user));

        setSession({ user, token });

        return user;
    };

    const logout = () => {
        sessionStorage.removeItem('campusfindToken');
        sessionStorage.removeItem('campusfindUser');

        setSession({
            user: null,
            token: null,
        });
    };

    const value = {
        user: session.user,
        token: session.token,
        isAuthenticated: Boolean(session.token && session.user),
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
