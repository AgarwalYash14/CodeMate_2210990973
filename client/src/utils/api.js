const apiCall = async (endpoint, options = {}) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}${endpoint}`;

    const config = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            // If unauthorized (401), it means token is invalid/expired
            if (response.status === 401) {
                // Clear user cookie since auth token is invalid
                document.cookie =
                    'user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
            }
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        throw error;
    }
};

export const authAPI = {
    login: async (email, password) => {
        return apiCall('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    register: async (name, email, password, role = 'student') => {
        return apiCall('/users/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
    },

    logout: async () => {
        try {
            await apiCall('/users/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear user cookie
            document.cookie =
                'user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
            // Also clear authToken cookie (even though it's httpOnly, try to delete it)
            document.cookie =
                'authToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax';
        }
    },

    isAuthenticated: () => {
        // Check if user cookie exists (since authToken is httpOnly and can't be read by JS)
        const userCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('user='));
        return !!userCookie;
    },

    getCurrentUser: () => {
        const userCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith('user='));

        if (!userCookie) return null;

        try {
            const userValue = userCookie.split('=')[1];
            return JSON.parse(decodeURIComponent(userValue));
        } catch (error) {
            console.error('Error parsing user cookie:', error);
            return null;
        }
    },
};

export const sessionAPI = {
    createSession: async (language = 'python') => {
        return apiCall('/sessions/create', {
            method: 'POST',
            body: JSON.stringify({ language }),
        });
    },

    getSession: async (roomId) => {
        return apiCall(`/sessions/${roomId}`);
    },

    getUserSessions: async () => {
        return apiCall('/sessions/my-sessions');
    },

    joinSession: async (roomId) => {
        return apiCall(`/sessions/join/${roomId}`);
    },

    endSession: async (roomId) => {
        return apiCall(`/sessions/${roomId}`, {
            method: 'DELETE',
        });
    },

    deleteSession: async (roomId) => {
        return apiCall(`/sessions/delete/${roomId}`, {
            method: 'DELETE',
        });
    },

    saveCode: async (roomId, code) => {
        return apiCall(`/sessions/${roomId}/code`, {
            method: 'PUT',
            body: JSON.stringify({ code }),
        });
    },

    updateSessionLanguage: async (roomId, language) => {
        return apiCall(`/sessions/${roomId}/language`, {
            method: 'PUT',
            body: JSON.stringify({ language }),
        });
    },

    getParticipants: async (roomId) => {
        return apiCall(`/sessions/${roomId}/participants`);
    },

    leaveSession: async (roomId) => {
        return apiCall(`/sessions/${roomId}/leave`, {
            method: 'POST',
        });
    },

    raiseHand: async (roomId) => {
        return apiCall(`/sessions/${roomId}/raise-hand`, {
            method: 'POST',
        });
    },

    lowerHand: async (roomId) => {
        return apiCall(`/sessions/${roomId}/raise-hand`, {
            method: 'DELETE',
        });
    },
};
