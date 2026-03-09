import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InstallAppSheet from '../components/InstallAppSheet';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found':   'No account found with this email.',
        'auth/wrong-password':   'Incorrect password.',
        'auth/invalid-email':    'Invalid email address.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests':'Too many attempts. Try again later.',
      };
      setError(msgs[err.code] || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white w-full overflow-hidden">
      {/* Hero header - mas compact */}
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
        <h1 className="text-white text-2xl font-extrabold relative z-10 tracking-tight">Welcome Back</h1>
        <p className="text-xs mt-1 relative z-10 font-medium" style={{ color: '#b8e5a8' }}>
          Sign in to your PSDSM account
        </p>
      </div>

      {/* Card - scrollable container para makita lahat ng laman */}
      <div className="flex-1 min-h-0 -mt-6 bg-white rounded-t-[2rem] px-4 sm:px-6 pt-10 pb-6 flex flex-col overflow-y-auto overflow-x-hidden thin-scroll shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        style={{ WebkitOverflowScrolling: 'touch' }}>
        {error && (
          <div className="alert-error mb-5">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 shrink-0">
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" className="input-field pl-10" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type={showPw ? 'text' : 'password'} className="input-field pl-10 pr-10"
                placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
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
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-auto pt-6 text-center space-y-2 shrink-0">
          <button type="button" onClick={() => setShowInstall(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-[var(--brand-mid)] text-sm font-semibold transition-all hover:bg-[var(--brand-pale)] active:scale-[0.98]"
            style={{ color: 'var(--brand-dark)', background: 'rgba(249,230,194,0.4)' }}>
            <Download size={16} />
            Install App (Add to Home Screen)
          </button>
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#4e7e44' }}>Register</Link>
          </p>
          <p className="text-gray-400 text-xs">Authorized DA/LGU Personnel & Technicians Only</p>
        </div>
        {showInstall && <InstallAppSheet onClose={() => setShowInstall(false)} />}
      </div>
    </div>
  );
}
