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
    <div className="flex flex-col h-full bg-white">
      <div className="relative px-6 pt-14 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #072F36 0%, #0D5C6A 55%, #129EAC 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'rgba(0,205,210,0.08)' }} />
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <img src="/PSDSMLOGO.png" alt="Logo" className="w-10 h-10 object-contain" />
          <p className="text-white/70 text-[10px] tracking-widest uppercase">DA · MIMAROPA Region 4B</p>
        </div>
        <h1 className="text-white text-3xl font-extrabold relative z-10">Create Account</h1>
        <p className="text-sm mt-1 relative z-10" style={{ color: '#80E8EA' }}>Register as authorized personnel</p>
      </div>

      <div className="flex-1 -mt-8 bg-white rounded-t-3xl px-6 pt-8 pb-6 overflow-y-auto screen-content"
        style={{ background: 'white' }}>
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 mb-4">
            <CheckCircle size={16} className="text-teal-600 shrink-0" />
            <p className="text-teal-700 text-sm font-medium">Account created! Redirecting…</p>
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
            <Link to="/login" className="font-semibold" style={{ color: '#0D5C6A' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
