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
    <div className="flex flex-col h-full bg-white">
      {/* Hero header */}
      <div className="relative px-6 pt-14 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #072F36 0%, #0D5C6A 55%, #129EAC 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'rgba(0,205,210,0.08)' }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />

        <div className="flex items-center gap-3 mb-5 relative z-10">
          <img src="/PSDSMLOGO.png" alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="text-white/50 text-[9px] font-bold tracking-widest uppercase">Department of Agriculture</p>
            <p className="text-white/70 text-[10px] tracking-widest uppercase">MIMAROPA · Region 4B</p>
          </div>
        </div>
        <h1 className="text-white text-3xl font-extrabold relative z-10">Welcome Back</h1>
        <p className="text-sm mt-1 relative z-10" style={{ color: '#80E8EA' }}>
          Sign in to your PSDSM account
        </p>
      </div>

      {/* Card */}
      <div className="flex-1 -mt-8 bg-white rounded-t-3xl px-6 pt-8 pb-6 flex flex-col overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
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

          <div className="pt-2">
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

        <div className="mt-auto pt-6 text-center space-y-2">
          <button type="button" onClick={() => setShowInstall(true)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-teal-200 text-teal-700 text-sm font-medium hover:bg-teal-50 transition-colors">
            <Download size={16} />
            Install App (Add to Home Screen)
          </button>
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold" style={{ color: '#0D5C6A' }}>Register</Link>
          </p>
          <p className="text-gray-400 text-xs">Authorized DA/LGU Personnel & Technicians Only</p>
        </div>
        {showInstall && <InstallAppSheet onClose={() => setShowInstall(false)} />}
      </div>
    </div>
  );
}
