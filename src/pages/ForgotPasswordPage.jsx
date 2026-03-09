import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!email?.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      setError(msgs[err.code] || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white w-full overflow-hidden">
      <div className="relative px-4 sm:px-6 overflow-hidden page-header shrink-0"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))', paddingBottom: '3.5rem' }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(150,209,131,0.4) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />

        <div className="flex items-center gap-2.5 mb-3 relative z-10">
          <div className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30 shadow-lg overflow-hidden">
            <img src="/DALOGO.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-white/60 text-[8px] font-bold tracking-[0.15em] uppercase">Department of Agriculture</p>
            <p className="text-white/80 text-[9px] tracking-widest uppercase">MIMAROPA · Region 4B</p>
          </div>
        </div>
        <h1 className="text-white text-2xl font-extrabold relative z-10 tracking-tight">Forgot Password</h1>
        <p className="text-xs mt-1 relative z-10 font-medium" style={{ color: '#b8e5a8' }}>
          We'll send a reset link to your email
        </p>
      </div>

      <div className="flex-1 min-h-0 -mt-6 bg-white rounded-t-[2rem] px-4 sm:px-6 pt-10 pb-6 flex flex-col overflow-y-auto overflow-x-hidden thin-scroll shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        style={{ WebkitOverflowScrolling: 'touch' }}>
        {error && (
          <div className="alert-error mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="alert-success mb-5">
            <CheckCircle size={16} className="shrink-0" />
            <p className="text-sm">Check your email for a link to reset your password. If you don't see it, check spam.</p>
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4 shrink-0">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="input-field pl-10" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
              </div>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Sending…
                  </span>
                ) : 'Send Reset Link'}
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-auto pt-6 text-center shrink-0">
          <Link to="/login" className="font-semibold text-sm" style={{ color: '#4e7e44' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
