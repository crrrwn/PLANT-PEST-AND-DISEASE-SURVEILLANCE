import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Map, BarChart2, ClipboardList, User } from 'lucide-react';

import MapPage       from './MapPage';
import DashboardPage from './DashboardPage';
import FormsPage     from './FormsPage';
import ProfilePage   from './ProfilePage';

const NAV = [
  { path: '/',          label: 'Map',       Icon: Map },
  { path: '/dashboard', label: 'Analytics', Icon: BarChart2 },
  { path: '/forms',     label: 'Forms',     Icon: ClipboardList },
  { path: '/profile',   label: 'Profile',   Icon: User },
];

export default function MainLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden" style={{ background: 'var(--brand-pale)' }}>
      <div className="flex-1 overflow-hidden min-h-0">
        <Routes>
          <Route path="/"          element={<MapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forms/*"   element={<FormsPage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
        </Routes>
      </div>

      {/* Bottom Nav - responsive */}
      <nav className="bg-white/95 backdrop-blur-md border-t border-gray-100/80 shadow-[0_-4px_24px_rgba(78,126,68,0.06)] nav-safe shrink-0">
        <div className="flex items-center max-w-2xl mx-auto">
          {NAV.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(path)} className={`nav-tab ${active ? 'active' : ''}`}>
                <div className="nav-icon-wrap p-1.5">
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? '#4e7e44' : '#9ca3af' }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${active ? '' : 'text-gray-400'}`}
                  style={active ? { color: '#4e7e44' } : {}}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
