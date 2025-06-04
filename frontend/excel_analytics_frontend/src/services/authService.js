const API_URL = 'http://localhost:5000/api';

class AuthService {
    // Register user
    async register(username, email, password) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return {
                success: true,
                data: data
            };
        } else {
            throw new Error(data.message || 'Registration failed');
        }
    }

    // Login user
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return {
                success: true,
                data: data
            };
        } else {
            throw new Error(data.message || 'Login failed');
        }
    }

    // Get current user profile
    async getCurrentUserProfile() {
        const token = this.getAccessToken();
        if (!token) {
            return null;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } else {
            this.logout();
            return null;
        }
    }

    // Get access token
    getAccessToken() {
        return localStorage.getItem('token');
    }

    // Get current user from local storage
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getAccessToken();
    }

    // Logout user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

export default new AuthService();
