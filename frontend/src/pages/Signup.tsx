import { Navigate } from 'react-router-dom';

// Auth is now email-only — /signup redirects to /login
export const Signup = () => <Navigate to="/login" replace />;
