import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import NotAuthorize from '../components/NotAuthorize';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [showModal, setShowModal] = useState(false);
    const [shouldNavigate, setShouldNavigate] = useState(false);
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const userRole = localStorage.getItem('user_level');

    useEffect(() => {
        if (allowedRoles && !allowedRoles.includes(userRole)) {
            setShowModal(true);
        }
    }, [allowedRoles, userRole]);

    const handleModalClose = () => {
        setShowModal(false);
        // Delay navigation until after modal closes
        setTimeout(() => {
            setShouldNavigate(true);
        }, 300); // 300ms delay to match modal animation
    };

    if (!isLoggedIn) {
        return <Navigate to="/gsd" replace />;
    }

    const getRedirectPath = () => {
        if (userRole === 'Super Admin' || userRole === 'Admin') return '/adminDashboard';
        if (userRole === 'Personnel') return '/personnelDashboard';
        if (userRole === 'Dean' || userRole === 'Secretary') return '/deanDashboard';
        if (userRole === 'Faculty/Staff') return '/dashboard';
        return '/gsd';
    };

    if (!allowedRoles.includes(userRole)) {
        return (
            <>
                <NotAuthorize open={showModal} onClose={handleModalClose} />
                {shouldNavigate && <Navigate to={getRedirectPath()} replace />}
            </>
        );
    }

    return children;
};

export default ProtectedRoute;
