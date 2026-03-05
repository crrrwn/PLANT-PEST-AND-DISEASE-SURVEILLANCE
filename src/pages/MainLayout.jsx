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
    <div className="flex flex-col h-full" style={{ background: '#f4f8f9' }}>
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/"          element={<MapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forms/*"   element={<FormsPage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
        </Routes>
      </div>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center">
          {NAV.map(({ path, label, Icon }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(path)} className="nav-tab">
                <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-teal-50' : ''}`}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.8}
                    style={{ color: active ? '#0D5C6A' : '#9ca3af' }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${active ? '' : 'text-gray-400'}`}
                  style={active ? { color: '#0D5C6A' } : {}}>
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
