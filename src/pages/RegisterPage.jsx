import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', position: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.confirm) { setError('Please fill in all required fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, `${form.name}${form.position ? ' — ' + form.position : ''}`);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'Email is already registered.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password is too weak.',
      };
      setError(msgs[err.code] || 'Registration failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white w-full overflow-hidden">
      {/* Hero header - mas compact, same as Login */}
      <div className="relative px-4 sm:px-6 overflow-hidden page-header shrink-0"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))', paddingBottom: '3.5rem' }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-40" style={{ background: 'radial-gradient(circle, rgba(150,209,131,0.4) 0%, transparent 70%)' }} />
        <div className="flex items-center gap-2.5 mb-3 relative z-10">
          <div className="w-9 h-9 rounded-full ring-2 ring-white/30 shadow-lg overflow-hidden">
            <img src="/DALOGO.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <p className="text-white/80 text-[9px] tracking-widest uppercase font-medium">DA · MIMAROPA Region 4B</p>
        </div>
        <h1 className="text-white text-2xl font-extrabold relative z-10 tracking-tight">Create Account</h1>
        <p className="text-xs mt-1 relative z-10 font-medium" style={{ color: '#b8e5a8' }}>Register as authorized personnel</p>
      </div>

      <div className="flex-1 min-h-0 -mt-6 bg-white rounded-t-[2rem] px-4 sm:px-6 pt-10 pb-6 overflow-y-auto overflow-x-hidden thin-scroll shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        style={{ background: 'white', WebkitOverflowScrolling: 'touch' }}>
        {error && (
          <div className="alert-error mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="alert-success mb-4">
            <CheckCircle size={16} className="shrink-0" />
            <p className="text-sm font-medium">Account created! Redirecting…</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name *',        field: 'name',     type: 'text',     ph: 'Juan Dela Cruz',                   Icon: User },
            { label: 'Email Address *',    field: 'email',    type: 'email',    ph: 'your@email.com',                   Icon: Mail },
          ].map(({ label, field, type, ph, Icon }) => (
            <div key={field}>
              <label className="form-label">{label}</label>
              <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={type} className="input-field pl-10" placeholder={ph}
                  value={form[field]} onChange={update(field)} />
              </div>
            </div>
          ))}

          <div>
            <label className="form-label">Position / Agency</label>
            <input className="input-field" placeholder="e.g. DA Technician / LGU-Palawan"
              value={form.position} onChange={update('position')} />
          </div>

          {[
            { label: 'Password *',         field: 'password', ph: 'Min 6 characters' },
            { label: 'Confirm Password *', field: 'confirm',  ph: 'Re-enter password' },
          ].map(({ label, field, ph }) => (
            <div key={field}>
              <label className="form-label">{label}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} className="input-field pl-10 pr-10"
                  placeholder={ph} value={form[field]} onChange={update(field)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button type="submit" disabled={loading || success} className="btn-primary disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#4e7e44' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
