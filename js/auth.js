/**
 * ═══════════════════════════════════════════════════
 *  auth.js — Authentication Module
 *  e-Office KPU Kota Serang
 *
 *  Handles: Login, Logout, Session Management
 *  Uses localStorage for session persistence
 * ═══════════════════════════════════════════════════
 */

const AuthManager = (() => {
    const SESSION_KEY = 'eoffice_session';

    /**
     * Login — POST to Apps Script
     * @returns {Promise<{success: boolean, message: string, user?: object}>}
     */
    async function login(email, password) {
        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'login',
                    email: email.trim().toLowerCase(),
                    password: password,
                }),
            });
            const result = await res.json();

            if (result.status === 'success') {
                // Save session to localStorage
                const session = {
                    token: result.token,
                    user: result.user, // { id, name, email, role }
                    loginAt: new Date().toISOString(),
                };
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return { success: true, message: result.message, user: result.user };
            } else {
                return { success: false, message: result.message || 'Login gagal.' };
            }
        } catch (err) {
            return { success: false, message: 'Tidak dapat menghubungi server. Periksa jaringan Anda.' };
        }
    }

    /**
     * Logout — clear session
     */
    async function logout() {
        const session = getSession();
        if (session && session.token) {
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        action: 'logout',
                        session_token: session.token,
                    }),
                });
            } catch (e) {
                // Ignore — still clear local session
            }
        }
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }

    /**
     * Get stored session
     */
    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * Get current user info
     */
    function getCurrentUser() {
        const session = getSession();
        return session ? session.user : null;
    }

    /**
     * Get session token
     */
    function getToken() {
        const session = getSession();
        return session ? session.token : null;
    }

    /**
     * Check if logged in
     */
    function isLoggedIn() {
        return !!getSession();
    }

    /**
     * Require authentication — redirect to login if not logged in
     */
    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Require admin role — redirect if not admin
     */
    function requireAdmin() {
        if (!requireAuth()) return false;
        const user = getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    /**
     * Require user role — redirect if not user
     */
    function requireUser() {
        if (!requireAuth()) return false;
        const user = getCurrentUser();
        if (!user || user.role !== 'user') {
            window.location.href = 'admin.html';
            return false;
        }
        return true;
    }

    /**
     * Validate session with server (optional — for extra security)
     */
    async function validateSession() {
        const token = getToken();
        if (!token) return false;

        try {
            const res = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'validate_session',
                    session_token: token,
                }),
            });
            const result = await res.json();

            if (result.status !== 'success') {
                // Session invalid — clear it
                localStorage.removeItem(SESSION_KEY);
                return false;
            }
            return true;
        } catch {
            // Network error — keep session for offline use
            return true;
        }
    }

    /**
     * API call with auth token
     */
    async function apiCall(data) {
        const token = getToken();
        if (token) {
            data.session_token = token;
        }

        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(data),
        });

        const result = await res.json();

        // If session expired, redirect to login
        if (result.status === 'error' && result.message && result.message.includes('Session')) {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'login.html';
            return null;
        }

        return result;
    }

    // Public API
    return {
        login,
        logout,
        getSession,
        getCurrentUser,
        getToken,
        isLoggedIn,
        requireAuth,
        requireAdmin,
        requireUser,
        validateSession,
        apiCall,
    };
})();
