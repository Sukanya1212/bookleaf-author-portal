import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ShieldCheck, UserCheck, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../api/client';

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState({ authors: [], admin: null });

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin/queue');
      } else {
        navigate('/author/books');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    async function loadDemoUsers() {
      try {
        const res = await api.get('/auth/demo-users');
        setDemoUsers(res.data);
      } catch (err) {
        console.error('Could not load demo accounts');
      }
    }
    loadDemoUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedIn = await login(email, password);
      if (loggedIn.role === 'ADMIN') {
        navigate('/admin/queue');
      } else {
        navigate('/author/books');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass, role) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);

    try {
      const loggedIn = await login(demoEmail, demoPass);
      if (loggedIn.role === 'ADMIN') {
        navigate('/admin/queue');
      } else {
        navigate('/author/books');
      }
    } catch (err) {
      setError('Quick sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          BookLeaf Support Portal
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Author Support & Communication Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@email.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Evaluation Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                1-Click Evaluator Sign-In
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Pre-seeded accounts</span>
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              {demoUsers.admin && (
                <button
                  type="button"
                  onClick={() => handleQuickLogin(demoUsers.admin.email, 'Admin@123', 'ADMIN')}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Sign in as <strong>Ops Admin</strong></span>
                  </div>
                  <span className="text-[10px] text-slate-300">Admin Portal →</span>
                </button>
              )}

              {/* Sample Authors */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'Author@123', 'AUTHOR')}
                  className="flex flex-col items-start p-2 rounded-lg text-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition"
                >
                  <span className="font-semibold text-slate-900">Rohit Kapoor</span>
                  <span className="text-[10px] text-slate-500">₹7,744 pending royalty</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('sneha.kulkarni@email.com', 'Author@123', 'AUTHOR')}
                  className="flex flex-col items-start p-2 rounded-lg text-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition"
                >
                  <span className="font-semibold text-slate-900">Sneha Kulkarni</span>
                  <span className="text-[10px] text-slate-500">Book in Production</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('priya.sharma@email.com', 'Author@123', 'AUTHOR')}
                  className="flex flex-col items-start p-2 rounded-lg text-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition"
                >
                  <span className="font-semibold text-slate-900">Priya Sharma</span>
                  <span className="text-[10px] text-slate-500">2 Published titles</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('ananya.reddy@email.com', 'Author@123', 'AUTHOR')}
                  className="flex flex-col items-start p-2 rounded-lg text-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition"
                >
                  <span className="font-semibold text-slate-900">Ananya Reddy</span>
                  <span className="text-[10px] text-slate-500">₹0 paid (new author)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
