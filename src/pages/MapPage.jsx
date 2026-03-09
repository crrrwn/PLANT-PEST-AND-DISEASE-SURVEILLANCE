import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Filter, Layers, RefreshCw, MapPin, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const MIMAROPA_BOUNDS = [[7.5, 116.0], [14.0, 123.5]];
const MIMAROPA_CENTER = [11.0, 119.8];
const CROPS = ['All', 'Rice', 'Corn', 'Sibuyas', 'Mango'];

function getSeverityColor(pct) {
  const p = parseFloat(pct) || 0;
  if (p === 0) return '#22c55e';
  if (p < 20)  return '#facc15';
  if (p < 40)  return '#f97316';
  return '#ef4444';
}
function getSeverityLabel(pct) {
  const p = parseFloat(pct) || 0;
  if (p === 0) return 'Safe';
  if (p < 20)  return 'Low Risk';
  if (p < 40)  return 'Moderate';
  return 'High Risk';
}

function mkIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:36px;height:36px">
      <div style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;background:${color};opacity:.25;transform:translate(-50%,-50%);animation:ping 1.5s ease-out infinite"></div>
      <div style="position:absolute;top:50%;left:50%;width:18px;height:18px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.35);transform:translate(-50%,-50%)"></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

const LEGEND = [
  { label: 'Safe (0%)',          color: '#22c55e' },
  { label: 'Low Risk (1–19%)',   color: '#facc15' },
  { label: 'Moderate (20–39%)', color: '#f97316' },
  { label: 'High Risk (≥40%)',  color: '#ef4444' },
];

function BoundsLock() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(MIMAROPA_BOUNDS);
    map.setMinZoom(7);
  }, [map]);
  return null;
}

// Flies to a coordinate and opens the popup for that report
function FlyToMarker({ flyTo, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!flyTo) return;
    map.flyTo([flyTo.lat, flyTo.lng], 14, { duration: 1.2 });
    // open popup after flight
    const t = setTimeout(() => {
      const ref = markerRefs.current[flyTo.id];
      if (ref) ref.openPopup();
    }, 1400);
    return () => clearTimeout(t);
  }, [flyTo, map, markerRefs]);
  return null;
}

// Single risk marker: on click, zoom map to this marker
function RiskMarker({ report, isTarget, markerRefs }) {
  const map = useMap();
  const lat = parseFloat(report.latitude);
  const lng = parseFloat(report.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  const color = getSeverityColor(report.percentInfestation);
  const handleClick = useCallback(() => {
    map.flyTo([lat, lng], 14, { duration: 1 });
  }, [map, lat, lng]);

  return (
    <Marker
      position={[lat, lng]}
      icon={isTarget ? mkHighlightIcon(color) : mkIcon(color)}
      ref={el => { if (el) markerRefs.current[report.id] = el; }}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>
        <div style={{ minWidth: 180, fontSize: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            {report.farmerName || '—'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color }} />
            <strong style={{ color }}>{getSeverityLabel(report.percentInfestation)}</strong>
            <span style={{ color: '#6b7280', marginLeft: 4 }}>({report.percentInfestation}%)</span>
          </div>
          <p><b>Crop:</b> {report.crop} {report.variety ? `— ${report.variety}` : ''}</p>
          <p><b>Pest:</b> {report.pests || '—'}</p>
          <p><b>Location:</b> {[report.municipality, report.province].filter(Boolean).join(', ') || '—'}</p>
          {report.areaAffected && <p><b>Area Affected:</b> {report.areaAffected} ha</p>}
          <p style={{ color: '#9ca3af', fontSize: 10, marginTop: 4 }}>{report.date || ''}</p>
        </div>
      </Popup>
    </Marker>
  );
}

function mkHighlightIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:44px;height:44px">
      <div style="position:absolute;top:50%;left:50%;width:44px;height:44px;border-radius:50%;background:${color};opacity:.3;transform:translate(-50%,-50%);animation:ping 1s ease-out infinite"></div>
      <div style="position:absolute;top:50%;left:50%;width:44px;height:44px;border-radius:50%;background:${color};opacity:.15;transform:translate(-50%,-50%);animation:ping 1s ease-out .3s infinite"></div>
      <div style="position:absolute;top:50%;left:50%;width:22px;height:22px;border-radius:50%;background:${color};border:4px solid white;box-shadow:0 2px 14px rgba(0,0,0,.4);transform:translate(-50%,-50%)"></div>
    </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

function EmptyMapOverlay() {
  return (
    <div className="absolute inset-0 z-[400] flex items-end justify-center pb-20 pointer-events-none">
      <div className="pointer-events-auto mx-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/80 px-5 py-4 flex items-center gap-3 max-w-xs">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #fdf8f0 0%, #f9e6c2 100%)', border: '1px solid rgba(150,209,131,0.3)' }}>
          <MapPin size={22} style={{ color: '#4e7e44' }} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">No reports yet</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Submit a Pest Report form to see markers appear on this map.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const routeLocation = useLocation();
  const flyTo      = routeLocation.state?.flyTo || null;   // { lat, lng, id }
  const markerRefs = useRef({});

  const [reports,      setReports]      = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [cropFilter,   setCropFilter]   = useState('All');
  const [showLegend,   setShowLegend]   = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const snap = await getDocs(query(collection(db, 'pestReports'), orderBy('createdAt', 'desc')));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      setFetchError(true);
      setReports([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  useEffect(() => {
    setFiltered(
      cropFilter === 'All' ? reports : reports.filter(r => r.crop === cropFilter)
    );
  }, [cropFilter, reports]);

  const stats = {
    total: filtered.length,
    high:  filtered.filter(r => parseFloat(r.percentInfestation) >= 40).length,
    mod:   filtered.filter(r => { const p = parseFloat(r.percentInfestation); return p >= 20 && p < 40; }).length,
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="page-header z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src="/DALOGO.jpg" alt="" className="w-7 h-7 rounded-full object-cover" />
            <div>
              <h1 className="header-title">Surveillance Map</h1>
              <p className="header-subtitle">MIMAROPA · Region 4B</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadReports} className="header-btn">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className="header-btn">
              <Filter size={16} />
            </button>
            <button onClick={() => setShowLegend(!showLegend)} className="header-btn">
              <Layers size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mt-1">
          {[
            { l: 'Reports',   v: stats.total, bg: 'rgba(255,255,255,0.15)' },
            { l: 'High Risk', v: stats.high,  bg: 'rgba(239,68,68,0.65)'  },
            { l: 'Moderate',  v: stats.mod,   bg: 'rgba(249,115,22,0.65)' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: s.bg }}>
              <span className="text-white font-bold text-sm">{s.v}</span>
              <span className="text-white/70 text-[10px]">{s.l}</span>
            </div>
          ))}
        </div>

        {/* Crop filter chips */}
        {showFilters && (
          <div className="flex gap-1.5 mt-2 pb-1 overflow-x-auto">
            {CROPS.map(c => (
              <button key={c}
                onClick={() => { setCropFilter(c); setShowFilters(false); }}
                className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={cropFilter === c
                  ? { background: 'white', color: '#4e7e44' }
                  : { background: 'rgba(255,255,255,0.18)', color: 'white' }}>
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full" style={{ background: 'linear-gradient(180deg, #fdf8f0 0%, #f9e6c2 100%)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(78,126,68,0.1)' }}>
                <RefreshCw className="animate-spin" size={28} style={{ color: '#4e7e44' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: '#4e7e44' }}>Loading map data…</p>
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex items-center justify-center h-full px-8" style={{ background: 'linear-gradient(180deg, #fdf8f0 0%, #f9e6c2 100%)' }}>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Could not load reports</p>
              <p className="text-xs text-gray-500">Check your internet connection and Firestore rules, then tap retry.</p>
              <button onClick={loadReports}
                className="mt-1 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md"
                style={{ background: 'var(--header-gradient)' }}>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <MapContainer
              center={MIMAROPA_CENTER}
              zoom={8}
              maxBounds={MIMAROPA_BOUNDS}
              maxBoundsViscosity={0.9}
              minZoom={7}
              style={{ height: '100%', width: '100%' }}>
              <BoundsLock />
              {flyTo && <FlyToMarker flyTo={flyTo} markerRefs={markerRefs} />}
              <TileLayer
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map(r => (
                <RiskMarker
                  key={r.id}
                  report={r}
                  isTarget={flyTo?.id === r.id}
                  markerRefs={markerRefs}
                />
              ))}
            </MapContainer>

            {/* Empty state overlay on top of map */}
            {filtered.length === 0 && <EmptyMapOverlay />}

            {/* Legend */}
            {showLegend && (
              <div className="absolute top-3 right-3 z-[500] bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-3 border border-gray-100/80 w-44">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700">Severity Legend</p>
                  <button onClick={() => setShowLegend(false)} className="text-gray-400 text-xs">✕</button>
                </div>
                {LEGEND.map(s => (
                  <div key={s.label} className="flex items-center gap-2 py-1">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] text-gray-600">{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Active crop filter badge */}
            {cropFilter !== 'All' && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400]">
                <button onClick={() => setCropFilter('All')}
                  className="flex items-center gap-2 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform"
                  style={{ background: 'var(--header-gradient)', boxShadow: '0 4px 14px rgba(78,126,68,0.4)' }}>
                  <MapPin size={12} />
                  {cropFilter} only · Tap to clear
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
