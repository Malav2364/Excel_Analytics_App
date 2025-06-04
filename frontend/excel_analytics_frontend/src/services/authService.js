const API_URL = 'http://localhost:5000/api';

class AuthService {
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
            // Store tokens and user data
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    // Refresh access token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch(`${API_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('accessToken', data.accessToken);
                return data.accessToken;
            } else {
                // If refresh token is invalid, log out user
                this.logout();
                throw new Error('Invalid refresh token');
            }
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    // Get access token
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    // Get refresh token
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    // Get user info
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Logout user
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
}

export default new AuthService();
