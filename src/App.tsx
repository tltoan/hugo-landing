import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getSubmissions, downloadSubmissionsCSV } from './utils/storage';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProblemsPage from './pages/Problems';
import ProblemPage from './pages/Problem';
import LeaderboardPage from './pages/Leaderboard';

// Main App Router Component
const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + D to download submissions
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const submissions = getSubmissions();
        if (submissions.length > 0) {
          downloadSubmissionsCSV();
          alert(`Downloaded ${submissions.length} submission(s)`);
        } else {
          alert('No submissions to download');
        }
      }
      // Ctrl/Cmd + Shift + L to log submissions to console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const submissions = getSubmissions();
        console.log('All Submissions:', submissions);
        alert(`${submissions.length} submission(s) logged to console`);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#FFF8E5',
        color: '#415378',
        fontFamily: '"Afacad", sans-serif',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            fontFamily: '"DM Serif Display", serif'
          }}>
            Hugo
          </div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } 
      />
      <Route 
        path="/login" 
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          user ? <Dashboard /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/problems" 
        element={
          user ? <ProblemsPage /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/problem/:id" 
        element={
          user ? <ProblemPage /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/leaderboard" 
        element={
          user ? <LeaderboardPage /> : <Navigate to="/login" replace />
        } 
      />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <>
      <GlobalStyles />
      <AuthProvider>
        <Router>
          <AppRouter />
        </Router>
      </AuthProvider>
    </>
  );
};

export default App;
