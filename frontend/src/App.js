import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Sales from './pages/Sales';
import SalesHistory from './pages/SalesHistory';
import Products from './pages/Products';
import Analytics from './pages/Analytics';
import PendingApproval from './pages/PendingApproval';
import './App.css';

const ProtectedRoute = ({ children, requiredRoles = [], adminOnly = false }) => {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!userProfile) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (userProfile.status === 'pending') {
    return <Navigate to="/pending" />;
  }

  if (userProfile.status === 'rejected') {
    return <Navigate to="/login" />;
  }

  if (adminOnly && userProfile.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(userProfile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const AuthenticatedApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pending" element={<PendingApproval />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <Layout><AdminPanel /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/sales" element={
          <ProtectedRoute>
            <Layout><Sales /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/sales-history" element={
          <ProtectedRoute>
            <Layout><SalesHistory /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Layout><Products /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <Layout><Analytics /></Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-500">
          <AuthenticatedApp />
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;