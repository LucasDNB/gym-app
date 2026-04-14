import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exercises from './pages/Exercises';
import Routines from './pages/Routines';
import Comments from './pages/Comments';
import Users from './pages/Users';
import WorkoutTimer from './pages/WorkoutTimer';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-500"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/exercises" element={<PrivateRoute roles={['admin', 'trainer']}><Exercises /></PrivateRoute>} />
          <Route path="/routines" element={<PrivateRoute><Routines /></PrivateRoute>} />
          <Route path="/timer" element={<PrivateRoute><WorkoutTimer /></PrivateRoute>} />
          <Route path="/comments" element={<PrivateRoute><Comments /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={['admin', 'trainer']}><Users /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
