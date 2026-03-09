import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  LogOut, Shield, Bell, Wifi, WifiOff, ChevronRight,
  Info, Database, Edit3, CheckCircle, Eye, EyeOff,
  Trash2, AlertCircle, Download
} from 'lucide-react';
import InstallAppSheet from '../components/InstallAppSheet';
import {
  updateProfile, updatePassword, EmailAuthProvider,
  reauthenticateWithCredential, deleteUser
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─────────────────────────────────────── */
const DARK = '#4e7e44';
const MID  = '#629e53';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet slide-up" style={{ maxHeight: '85vh' }} onClick={e=>e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  );
}

function StatusMsg({ type, msg }) {
  if (!msg) return null;
  const ok = type === 'success';
  return (
    <div className={`mb-4 ${ok ? 'alert-success' : 'alert-error'}`}>
      {ok ? <CheckCircle size={15} style={{ color:DARK }} /> : <AlertCircle size={15} className="text-red-500" />}
      <p className={`text-sm ${ok ? '' : 'text-red-600'}`} style={ok ? { color: '#4e7e44' } : {}}>{msg}</p>
    </div>
  );
}

/* ─── Edit Profile Sheet ─────────────────────────── */
function EditProfileSheet({ user, onClose }) {
  const [name,    setName]    = useState((user?.displayName || '').split(' — ')[0].trim() || '');
  const [loading, setLoading] = useState(false);
  const [status,   setStatus]  = useState({ type:'', msg:'' });

  const save = async () => {
    setStatus({ type:'', msg:'' });
    if (!name?.trim()) { setStatus({ type:'error', msg:'Please enter your name.' }); return; }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setStatus({ type:'success', msg:'Profile updated successfully!' });
      setTimeout(onClose, 1500);
    } catch (e) {
      setStatus({ type:'error', msg: e?.message || 'Update failed.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <StatusMsg {...status} />
      <div className="space-y-4">
        <div>
          <label className="form-label">Full Name</label>
          <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label className="form-label">Email Address</label>
          <input className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email||''} disabled />
          <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed after registration.</p>
        </div>
        <button onClick={save} disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</span> : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Change Password Sheet ──────────────────────── */
function ChangePasswordSheet({ onClose }) {
  const [cur,     setCur]     = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState({ type:'', msg:'' });

  const save = async () => {
    setStatus({ type:'', msg:'' });
    if (!cur?.trim())          { setStatus({ type:'error', msg:'Enter your current password.' }); return; }
    if (next.length < 6)       { setStatus({ type:'error', msg:'New password must be at least 6 characters.' }); return; }
    if (next !== confirm)      { setStatus({ type:'error', msg:'Passwords do not match.' }); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        setStatus({ type:'error', msg:'Cannot change password for this account type.' });
        setLoading(false);
        return;
      }
      const cred = EmailAuthProvider.credential(user.email, cur);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      setStatus({ type:'success', msg:'Password changed successfully!' });
      setTimeout(onClose, 1500);
    } catch (e) {
      const code = e?.code || e?.message || '';
      const msgs = {
        'auth/wrong-password': 'Current password is incorrect.',
        'auth/invalid-credential': 'Current password is incorrect.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/requires-recent-login': 'Please sign out, sign in again, then try changing your password.',
      };
      setStatus({ type:'error', msg: msgs[code] || e?.message || 'Failed to change password.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <StatusMsg {...status} />
      <div className="space-y-4">
        {[
          { label:'Current Password', val:cur, set:setCur },
          { label:'New Password',     val:next, set:setNext },
          { label:'Confirm New',      val:confirm, set:setConfirm },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="form-label">{label}</label>
            <div className="relative">
              <input type={show ? 'text':'password'} className="input-field pr-10" placeholder="••••••••"
                value={val} onChange={e=>set(e.target.value)} />
              <button type="button" onClick={()=>setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                {show ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
        ))}
        <button onClick={save} disabled={loading} className="btn-primary disabled:opacity-60">
          {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</span> : 'Change Password'}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Cache Info Sheet ───────────────────────────── */
function CacheSheet({ onClose }) {
  const [counts, setCounts] = useState({ pestReports:0, requestForms:0, satisfactionSurveys:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cols = ['pestReports','requestForms','satisfactionSurveys'];
    Promise.all(cols.map(c => getDocs(collection(db, c)).then(s => ({ c, n:s.size }))))
      .then(res => {
        const obj = {};
        res.forEach(({ c, n }) => { obj[c] = n; });
        setCounts(obj);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const items = [
    { label:'Pest Reports',          key:'pestReports',         color:'#4e7e44' },
    { label:'Request Forms',         key:'requestForms',        color:'#629e53' },
    { label:'Satisfaction Surveys',  key:'satisfactionSurveys', color:'#96d183' },
  ];
  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  return (
    <Modal title="Offline Data Cache" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor:DARK, borderTopColor:'transparent' }}/>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background:'#f9e6c2' }}>
            <Database size={20} style={{ color:DARK }} />
            <div>
              <p className="font-bold text-gray-800">{total} total records</p>
              <p className="text-xs text-gray-500">Synced via Firestore offline persistence</p>
            </div>
          </div>
          {items.map(({ label, key, color }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background:color }}/>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className="text-lg font-bold" style={{ color }}>{counts[key]}</span>
            </div>
          ))}
          <div className="p-3 border rounded-xl" style={{ borderColor:'#96d183', background:'#f9e6c2' }}>
            <p className="text-xs text-gray-600 font-medium">
              🔄 Data automatically syncs to Firebase Firestore when internet is available.
              All records are stored locally while offline.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── About Sheet ────────────────────────────────── */
function AboutSheet({ onClose }) {
  return (
    <Modal title="About PSDSM" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <img src="/DALOGO.jpg" alt="PSDSM" className="w-20 h-20 rounded-full object-cover" />
          <div className="text-center">
            <h3 className="font-extrabold text-xl text-gray-800">PSDSM</h3>
            <p className="text-xs text-gray-500 mt-0.5">Plant Pest & Disease Surveillance Monitoring</p>
            <span className="inline-block mt-2 text-[10px] font-bold px-3 py-1 rounded-full" style={{ background:'#f9e6c2', color:DARK }}>Version 1.0.0</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ background:'#f9e6c2' }}>
          <div className="flex items-center gap-3 mb-3">
            <img src="/DALOGO.jpg" alt="DA" className="w-10 h-10 rounded-full object-cover"/>
            <div>
              <p className="font-bold text-gray-800 text-sm">Department of Agriculture</p>
              <p className="text-xs text-gray-500">Regional Field Office — MIMAROPA</p>
              <p className="text-xs text-gray-500">Region 4B</p>
            </div>
          </div>
        </div>
        {[
          { label:'Purpose',      val:'Real-time surveillance and monitoring of plant pests and diseases in MIMAROPA region.' },
          { label:'Coverage',     val:'Occidental Mindoro, Oriental Mindoro, Marinduque, Romblon, Palawan' },
          { label:'Framework',    val:'React + Vite + Tailwind CSS' },
          { label:'Database',     val:'Firebase Firestore with Offline Persistence' },
          { label:'Mapping',      val:'OpenStreetMap via Leaflet.js' },
          { label:'Developed for',val:'DA Regional Field Office' },
        ].map(({ label, val }) => (
          <div key={label} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-[11px] text-gray-400 w-28 shrink-0">{label}</span>
            <span className="text-[11px] text-gray-700 font-medium flex-1">{val}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ─── Notifications Sheet ────────────────────────── */
function NotificationsSheet({ prefs, onSave, onClose }) {
  const [p, setP] = useState({ ...prefs });
  const toggle = k => setP(x => ({ ...x, [k]:!x[k] }));

  const items = [
    { key:'highRiskAlerts', label:'High Risk Alerts', desc:'Notify when infestation ≥ 40%' },
    { key:'newReports',     label:'New Report Added',  desc:'When a new pest report is submitted' },
    { key:'syncSuccess',    label:'Sync Completed',    desc:'Confirmation when data syncs to cloud' },
  ];

  return (
    <Modal title="Notifications" onClose={onClose}>
      <div className="space-y-3">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <button onClick={() => toggle(key)}
              className="w-12 h-6 rounded-full transition-all duration-200 relative"
              style={{ background: p[key] ? DARK : '#d1d5db' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: p[key] ? '26px' : '2px' }} />
            </button>
          </div>
        ))}
        <button onClick={() => { onSave(p); onClose(); }} className="btn-primary mt-2">Save Preferences</button>
      </div>
    </Modal>
  );
}

/* ─── Delete Account Sheet ───────────────────────── */
function DeleteAccountSheet({ onClose, onLogout }) {
  const [pw,      setPw]      = useState('');
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState({ type:'', msg:'' });

  const handleDelete = async () => {
    if (!pw) { setStatus({ type:'error', msg:'Enter your password to confirm.' }); return; }
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, pw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await deleteUser(auth.currentUser);
      onLogout();
    } catch (e) {
      const msgs = { 'auth/wrong-password':'Incorrect password.', 'auth/too-many-requests':'Too many attempts.' };
      setStatus({ type:'error', msg: msgs[e.code] || 'Failed to delete account.' });
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div className="space-y-4">
        <div className="alert-error p-4">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm">This action is permanent. All your account data will be removed and cannot be recovered.</p>
        </div>
        <StatusMsg {...status} />
        <div>
          <label className="form-label">Enter Password to Confirm</label>
          <div className="relative">
            <input type={show ? 'text':'password'} className="input-field pr-10"
              placeholder="Your current password" value={pw} onChange={e=>setPw(e.target.value)} />
            <button type="button" onClick={()=>setShow(!show)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        <button onClick={handleDelete} disabled={loading}
          className="w-full bg-red-500 text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-all disabled:opacity-60">
          {loading ? 'Deleting…' : '🗑 Permanently Delete Account'}
        </button>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </Modal>
  );
}

/* ─── MAIN PROFILE PAGE ──────────────────────────── */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sheet,    setSheet]    = useState(null); // 'edit'|'password'|'cache'|'about'|'install'|'notifications'|'delete'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifPref,setNotifPref]= useState({ highRiskAlerts:true, newReports:false, syncSuccess:true });
  const [logging,  setLogging]  = useState(false);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  }, []);

  const handleLogout = async () => {
    setLogging(true);
    await logout();
    navigate('/login', { replace:true });
  };

  const currentUser = auth.currentUser || user;
  const nameParts   = (currentUser?.displayName || '').split(' — ');
  const displayName = nameParts[0] || currentUser?.email?.split('@')[0] || 'User';
  const position    = nameParts[1] || 'DA Personnel';
  const initials    = displayName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() || 'U';

  const MENU = [
    {
      group:'Account',
      items: [
        { Icon:Edit3,   label:'Edit Profile',         sub: displayName, action:() => setSheet('edit') },
        { Icon:Shield,  label:'Change Password',      sub:'Update your password', action:() => setSheet('password') },
      ],
    },
    {
      group:'App Settings',
      items: [
        {
          Icon: Download,
          label:'Install App',
          sub: 'Add PSDSM to home screen',
          action:() => setSheet('install'),
        },
        {
          Icon: Bell,
          label:'Notifications',
          sub: `${Object.values(notifPref).filter(Boolean).length} alerts active`,
          action:() => setSheet('notifications'),
        },
        {
          Icon: isOnline ? Wifi : WifiOff,
          label:'Connection Status',
          sub: isOnline ? 'Online — Firestore synced' : 'Offline — local only',
          iconColor: isOnline ? '#22c55e' : '#ef4444',
        },
      ],
    },
    {
      group:'Data & Info',
      items: [
        { Icon:Database, label:'Offline Data Cache', sub:'View synced records count',  action:() => setSheet('cache') },
        { Icon:Info,     label:'About PSDSM',        sub:'Version 1.0.0 · DA MIMAROPA',action:() => setSheet('about') },
      ],
    },
    {
      group:'Danger Zone',
      items: [
        { Icon:Trash2, label:'Delete Account', sub:'Permanently remove your account', action:() => setSheet('delete'), danger:true },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="relative page-header overflow-hidden" style={{ paddingBottom: '2.5rem' }}>

        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center shadow-xl"
              style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(12px)' }}>
              <span className="text-white font-extrabold text-2xl">{initials}</span>
            </div>
            <button onClick={() => setSheet('edit')}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
              <Edit3 size={13} style={{ color:DARK }} />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-white font-bold text-xl leading-tight">{displayName}</h2>
            <p className="text-xs mt-0.5" style={{ color:'#b8e5a8' }}>{position}</p>
            <p className="text-[10px] mt-0.5" style={{ color:'rgba(255,255,255,0.45)' }}>{currentUser?.email}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isOnline ? '#96d183':'#ef4444' }} />
              <span className="text-[10px] font-medium" style={{ color:'rgba(255,255,255,0.6)' }}>
                {isOnline ? 'Online' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-content content-container pb-6 pt-8 space-y-4">
        {/* DA badge */}
        <div className="card flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-md shrink-0">
            <img src="/DALOGO.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700">Department of Agriculture</p>
            <p className="text-xs text-gray-500">Regional Field Office — MIMAROPA</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color:DARK }}>Plant Pest & Disease Surveillance</p>
          </div>
        </div>

        {/* Menu groups */}
        {MENU.map(({ group, items }) => (
          <div key={group}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 mb-1.5">{group}</p>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-[0_2px_8px_rgba(78,126,68,0.06)]">
              {items.map(({ Icon, label, sub, action, iconColor, danger }, i) => (
                <button key={label} onClick={action}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors
                    ${i < items.length-1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: danger ? '#fee2e2' : '#f9e6c2' }}>
                    <Icon size={17} style={{ color: danger ? '#ef4444' : (iconColor || DARK) }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-xs text-gray-400 truncate">{sub}</p>
                  </div>
                  {action && <ChevronRight size={16} className="text-gray-300" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button onClick={handleLogout} disabled={logging}
          className="w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-2xl active:scale-[0.98] transition-all border-2 border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60">
          <LogOut size={18} />
          {logging ? 'Signing out…' : 'Sign Out'}
        </button>

        <p className="text-center text-[10px] text-gray-400 pb-2">
          PSDSM v1.0.0 · Department of Agriculture MIMAROPA
        </p>
      </div>

      {/* Sheets */}
      {sheet === 'edit'          && <EditProfileSheet    user={currentUser} onClose={() => setSheet(null)} />}
      {sheet === 'password'      && <ChangePasswordSheet                    onClose={() => setSheet(null)} />}
      {sheet === 'cache'         && <CacheSheet                             onClose={() => setSheet(null)} />}
      {sheet === 'about'         && <AboutSheet                             onClose={() => setSheet(null)} />}
      {sheet === 'install'       && <InstallAppSheet                        onClose={() => setSheet(null)} />}
      {sheet === 'notifications' && <NotificationsSheet  prefs={notifPref} onSave={setNotifPref} onClose={() => setSheet(null)} />}
      {sheet === 'delete'        && <DeleteAccountSheet  onClose={() => setSheet(null)} onLogout={handleLogout} />}
    </div>
  );
}
