import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoadingScreen from './pages/LoadingScreen';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import MainLayout    from './pages/MainLayout';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (showSplash || loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login"    element={!user ? <LoginPage />    : <Navigate to="/"      replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/"      replace />} />
      <Route path="/*"        element={user  ? <MainLayout />   : <Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
