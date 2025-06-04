//To prevent users to access dashboard  without authentication
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const PrivateRoute = ({ children }) => {
    if (!authService.isLoggedIn()) {
        return <Navigate to="/login" />;
    }

    return children;
};

export default PrivateRoute;
