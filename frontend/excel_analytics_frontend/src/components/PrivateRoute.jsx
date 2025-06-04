import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const PrivateRoute = ({ children }) => {
    if (!authService.isLoggedIn()) {
        // Redirect them to the login page if not logged in
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;
