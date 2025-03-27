import { refreshSessionCookie, checkSessionTimeout, removeSessionCookie } from './cookieUtils';

let activityTimer = null;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];
const CHECK_INTERVAL = 1000; // Check every 5 seconds

export const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
};

export const initializeSessionManager = (navigate) => {
    updateLastActivity();

    const checkSession = () => {
        if (checkSessionTimeout()) {
            clearInterval(activityTimer);
            removeSessionCookie('userSession'); // Clear the PHP session cookie
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/'; // Redirect to login
            return;
        }
    };

    const handleActivity = () => {
        updateLastActivity();
        refreshSessionCookie('userSession').catch(console.error);
    };

    ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true });
    });

    activityTimer = setInterval(checkSession, CHECK_INTERVAL);
    checkSession();

    return () => {
        clearInterval(activityTimer);
        ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, handleActivity);
        });
    };
};
