import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { storage } from './utils/localStorage';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { TrackerPage } from './pages/Tracker';
import { Analytics } from './pages/Analytics';
import { TasksPage } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Redirect logged-in users away from auth pages
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to={user.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;
  return <>{children}</>;
};

// Redirect logged-out users to login
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Redirect to onboarding if not completed yet.
// Falls back to localStorage so a React context propagation delay never bounces
// the user back to /onboarding right after they finish the wizard.
const OnboardedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  const completed = user.onboardingCompleted || storage.getUser()?.onboardingCompleted;
  if (!completed) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/signup" element={<Signup />} />

    {/* Onboarding — requires auth but not completed onboarding */}
    <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

    {/* Protected + onboarded */}
    <Route path="/dashboard" element={<OnboardedRoute><Dashboard /></OnboardedRoute>} />
    <Route path="/tracker" element={<OnboardedRoute><TrackerPage /></OnboardedRoute>} />
    <Route path="/analytics" element={<OnboardedRoute><Analytics /></OnboardedRoute>} />
    <Route path="/settings" element={<OnboardedRoute><Settings /></OnboardedRoute>} />

    {/* Default redirect */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
