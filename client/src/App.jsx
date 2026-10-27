import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { MyBooks } from './pages/author/MyBooks';
import { SubmitTicket } from './pages/author/SubmitTicket';
import { MyTickets } from './pages/author/MyTickets';
import { TicketQueue } from './pages/admin/TicketQueue';
import { TicketDetail } from './pages/admin/TicketDetail';

// Protected Route Guard
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-slate-500">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/queue' : '/author/books'} replace />;
  }

  return children;
}

// Root Route Redirector
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={user.role === 'ADMIN' ? '/admin/queue' : '/author/books'} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Author Routes */}
              <Route
                path="/author/books"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <MyBooks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/submit"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <SubmitTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/author/tickets"
                element={
                  <ProtectedRoute allowedRole="AUTHOR">
                    <MyTickets />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/queue"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <TicketQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tickets/:id"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <TicketDetail />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
