import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_COOKIE_SECRET;
const API_URL = 'http://localhost/coc/gsd/set-cookie.php'; // Adjust API path

/**
 * Encrypts and sets a session cookie via the PHP backend.
 * @param {string} name - Cookie name.
 * @param {any} value - Data to store in the cookie.
 */
export const setSessionCookie = async (name, value) => {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(value), SECRET_KEY).toString();
    const expiryDate = new Date(Date.now() + 60000); // 1-minute expiration

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include', // Allows sending cookies
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                value: encrypted,
                expires: expiryDate.toISOString(),
            }),
        });

        const data = await response.json();
        if (data.status !== 'success') {
            console.error('Failed to set cookie:', data.message);
        }
    } catch (error) {
        console.error('Error setting cookie:', error);
    }
};

/**
 * Retrieves and decrypts a session cookie.
 * @param {string} name - Cookie name.
 * @returns {any|null} - Decrypted cookie value or null if not found.
 */
export const getSessionCookie = (name) => {
    const encrypted = Cookies.get(name);
    if (!encrypted) return null;

    try {
        const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Error decrypting cookie:', error);
        return null;
    }
};

/**
 * Refreshes the session cookie by extending its expiration.
 * @param {string} name - Cookie name.
 */
export const refreshSessionCookie = async (name) => {
    const currentSession = getSessionCookie(name);
    if (currentSession) {
        await setSessionCookie(name, currentSession);
    }
};

/**
 * Checks if the session has expired based on last activity.
 * @returns {boolean} - True if session expired, false otherwise.
 */
export const checkSessionTimeout = () => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return true;

    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    const lastActivitySeconds = Math.floor(parseInt(lastActivity) / 1000);
    const inactiveTime = now - lastActivitySeconds;

    return inactiveTime >= 60; // Auto-logout after 60 seconds of inactivity
};

/**
 * Removes a session cookie and clears storage.
 * @param {string} name - Cookie name.
 */
export const removeSessionCookie = (name) => {
    Cookies.remove(name, { path: '/' });
};
