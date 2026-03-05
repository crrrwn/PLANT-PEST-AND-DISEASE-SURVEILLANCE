import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler, RadialLinearScale
} from 'chart.js';
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  ChevronDown, AlertTriangle, FileText, Leaf,
  RefreshCw, AlertCircle, BarChart2, Star,
  ThumbsUp, Clock, Users, CheckCircle, XCircle
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler, RadialLinearScale
);

/* ── Constants ───────────────────────────────────── */
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LOCATIONS = ['All Provinces','Occidental Mindoro','Oriental Mindoro','Marinduque','Romblon','Palawan'];
const CROP_OPTS = ['All Crops','Rice','Corn','Sibuyas','Mango'];
const YEARS     = ['2023','2024','2025','2026'];

const CROP_COLORS = {
  Rice:    { bg: 'rgba(13,92,106,0.75)',  border: '#0D5C6A' },
  Corn:    { bg: 'rgba(202,138,4,0.75)',  border: '#ca8a04' },
  Sibuyas: { bg: 'rgba(124,58,237,0.75)', border: '#7c3aed' },
  Mango:   { bg: 'rgba(234,88,12,0.75)',  border: '#ea580c' },
};
const SEV_COLORS = {
  Safe: '#22c55e', 'Low Risk': '#facc15', Moderate: '#f97316', 'High Risk': '#ef4444',
};

const BASE_CHART = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 } } },
    y: { grid: { color: '#e8f9fa' }, ticks: { font: { size: 9 } }, beginAtZero: true },
  },
};

/* ── Pest report analytics ───────────────────────── */
function buildPestAnalytics(reports, year, crop, province) {
  const byYear = reports.filter(r => {
    const d = r.date || (r.createdAt?.toDate ? r.createdAt.toDate().toISOString().slice(0,10) : '');
    return d.startsWith(year);
  });
  const byProv  = province === 'All Provinces' ? byYear  : byYear.filter(r => r.province === province);
  const byCrop  = crop     === 'All Crops'     ? byProv  : byProv.filter(r => r.crop === crop);

  const monthlyCounts = {};
  Object.keys(CROP_COLORS).forEach(c => { monthlyCounts[c] = Array(12).fill(0); });
  byCrop.forEach(r => {
    const d = r.date || ''; if (!d) return;
    const m = parseInt(d.slice(5,7),10) - 1;
    if (m < 0 || m > 11) return;
    if (monthlyCounts[r.crop]) monthlyCounts[r.crop][m]++;
  });

  const sevCounts = { Safe: 0, 'Low Risk': 0, Moderate: 0, 'High Risk': 0 };
  byCrop.forEach(r => {
    const p = parseFloat(r.percentInfestation)||0;
    if (p===0) sevCounts.Safe++;
    else if (p<20) sevCounts['Low Risk']++;
    else if (p<40) sevCounts.Moderate++;
    else sevCounts['High Risk']++;
  });

  const pestMap = {};
  byCrop.forEach(r => {
    if (!r.pests || r.pests==='None') return;
    const k = `${r.pests}|${r.crop}`;
    if (!pestMap[k]) pestMap[k] = { name:r.pests, crop:r.crop, count:0, maxPct:0 };
    pestMap[k].count++;
    const p = parseFloat(r.percentInfestation)||0;
    if (p > pestMap[k].maxPct) pestMap[k].maxPct = p;
  });
  const topPests = Object.values(pestMap).sort((a,b)=>b.count-a.count).slice(0,5);

  return { monthlyCounts, sevCounts, topPests, total: byCrop.length };
}

/* ── Survey / ratings analytics ─────────────────── */
function buildRatingAnalytics(surveys, year, province) {
  const byYear = surveys.filter(s => {
    const d = s.dateOfRequest || (s.createdAt?.toDate ? s.createdAt.toDate().toISOString().slice(0,10) : '');
    return d.startsWith(year);
  });
  const filtered = province === 'All Provinces' ? byYear : byYear.filter(s => s.province === province);

  const keys = ['ratingQuantity','ratingServices','ratingAttitude','ratingPromptness'];
  const labels = ['Quantity','Services','Attitude','Promptness'];
  const sums   = keys.map(() => 0);
  const counts = keys.map(() => 0);

  filtered.forEach(s => {
    keys.forEach((k,i) => {
      const v = parseFloat(s[k])||0;
      if (v > 0) { sums[i]+=v; counts[i]++; }
    });
  });

  const avgs = keys.map((_, i) => counts[i] > 0 ? +(sums[i]/counts[i]).toFixed(2) : 0);
  const overall = avgs.filter(v=>v>0).length
    ? +(avgs.filter(v=>v>0).reduce((a,b)=>a+b,0)/avgs.filter(v=>v>0).length).toFixed(2)
    : 0;

  // Service provider breakdown
  const providerMap = { DA:0, LGU:0, Both:0 };
  filtered.forEach(s => { if (providerMap[s.serviceProvider]!==undefined) providerMap[s.serviceProvider]++; });

  // On-time delivery
  const onTime    = filtered.filter(s => s.receivedOnTime === 'Yes').length;
  const notOnTime = filtered.filter(s => s.receivedOnTime === 'No').length;

  // Monthly survey count
  const monthlySurveys = Array(12).fill(0);
  filtered.forEach(s => {
    const d = s.dateOfRequest || ''; if (!d) return;
    const m = parseInt(d.slice(5,7),10)-1;
    if (m>=0 && m<=11) monthlySurveys[m]++;
  });

  // Recent 3
  const recent = [...filtered]
    .sort((a,b) => {
      const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.dateOfRequest||0);
      const db_ = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.dateOfRequest||0);
      return db_ - da;
    })
    .slice(0,3);

  return { avgs, labels, overall, providerMap, onTime, notOnTime, monthlySurveys, recent, total: filtered.length };
}

/* ── Helpers ─────────────────────────────────────── */
function StarDisplay({ value, max = 5, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < Math.round(value) ? '#14B8C4' : 'none'}
          stroke={i < Math.round(value) ? '#14B8C4' : '#d1d5db'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value }) {
  const pct = (value / 5) * 100;
  const color = value >= 4 ? '#22c55e' : value >= 3 ? '#14B8C4' : value >= 2 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function EmptyCard({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center py-10 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#E8F9FA' }}>
        <Icon size={22} style={{ color: '#0D5C6A' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────── */
export default function DashboardPage() {
  const [pestReports, setPestReports] = useState([]);
  const [surveys,     setSurveys]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [location,    setLocation]    = useState('All Provinces');
  const [crop,        setCrop]        = useState('All Crops');
  const [year,        setYear]        = useState(String(new Date().getFullYear()));
  const [activeTab,   setActiveTab]   = useState('pest'); // 'pest' | 'ratings'

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [pestSnap, surveySnap] = await Promise.all([
        getDocs(query(collection(db, 'pestReports'),          orderBy('createdAt','desc'))),
        getDocs(query(collection(db, 'satisfactionSurveys'),  orderBy('createdAt','desc'))),
      ]);
      setPestReports(pestSnap.docs.map(d => ({ id:d.id, ...d.data() })));
      setSurveys(surveySnap.docs.map(d => ({ id:d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const pest    = buildPestAnalytics(pestReports, year, crop, location);
  const ratings = buildRatingAnalytics(surveys, year, location);

  const activeCrops = crop === 'All Crops' ? Object.keys(CROP_COLORS) : [crop];
  const totalSev    = Object.values(pest.sevCounts).reduce((a,b)=>a+b,0);

  // Chart data
  const lineData = {
    labels: MONTHS,
    datasets: activeCrops.map(c => ({
      label: c,
      data: pest.monthlyCounts[c] || Array(12).fill(0),
      borderColor: CROP_COLORS[c]?.border || '#0D5C6A',
      backgroundColor: (CROP_COLORS[c]?.border || '#0D5C6A') + '22',
      fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
    })),
  };
  const barData = {
    labels: MONTHS,
    datasets: activeCrops.map(c => ({
      label: c,
      data: pest.monthlyCounts[c] || Array(12).fill(0),
      backgroundColor: CROP_COLORS[c]?.bg || 'rgba(13,92,106,0.75)',
      borderRadius: 6,
    })),
  };
  const doughnutData = {
    labels: Object.keys(pest.sevCounts),
    datasets: [{
      data: Object.values(pest.sevCounts),
      backgroundColor: Object.keys(SEV_COLORS).map(k => SEV_COLORS[k]),
      borderWidth: 0, hoverOffset: 8,
    }],
  };
  const radarData = {
    labels: ratings.labels,
    datasets: [{
      label: 'Average Rating',
      data: ratings.avgs,
      backgroundColor: 'rgba(20,184,196,0.18)',
      borderColor: '#14B8C4',
      pointBackgroundColor: '#0D5C6A',
      pointBorderColor: '#fff',
      borderWidth: 2,
      pointRadius: 4,
    }],
  };
  const providerData = {
    labels: Object.keys(ratings.providerMap),
    datasets: [{
      data: Object.values(ratings.providerMap),
      backgroundColor: ['#0D5C6A','#129EAC','#14B8C4'],
      borderWidth: 0, hoverOffset: 8,
    }],
  };
  const surveyBarData = {
    labels: MONTHS,
    datasets: [{
      label: 'Surveys',
      data: ratings.monthlySurveys,
      backgroundColor: 'rgba(20,184,196,0.7)',
      borderRadius: 6,
    }],
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-3"
        style={{ background: 'linear-gradient(135deg, #072F36, #0D5C6A)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src="/PSDSMLOGO.png" alt="" className="w-7 h-7 object-contain" />
            <div>
              <h1 className="text-white font-bold text-base leading-none">Analytics & Trends</h1>
              <p className="text-xs" style={{ color: '#80E8EA' }}>
                {loading ? 'Loading…' : `${pestReports.length} reports · ${surveys.length} surveys`}
              </p>
            </div>
          </div>
          <button onClick={loadData}
            className="p-2 rounded-xl border border-white/20"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)' }}>
          {[
            { key: 'pest',    label: '🌿 Pest Reports' },
            { key: 'ratings', label: '⭐ Ratings' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={activeTab === key
                ? { background: 'white', color: '#0D5C6A' }
                : { color: 'rgba(255,255,255,0.65)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ background: '#f4f8f9' }}>
          <RefreshCw className="animate-spin" size={28} style={{ color: '#0D5C6A' }} />
          <p className="text-sm font-medium" style={{ color: '#0D5C6A' }}>Loading analytics…</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center" style={{ background: '#f4f8f9' }}>
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm font-semibold text-gray-700">Could not load data</p>
          <p className="text-xs text-gray-400">Check your Firestore rules and internet connection.</p>
          <button onClick={loadData}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold mt-1"
            style={{ background: '#0D5C6A' }}>
            Retry
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {!loading && !fetchError && (
        <div className="screen-content px-4 pb-6 pt-4 space-y-4">

          {/* ── Filters ── */}
          <div className="flex gap-2">
            {[
              { val: location, opts: LOCATIONS, set: setLocation },
              ...(activeTab === 'pest' ? [{ val: crop, opts: CROP_OPTS, set: setCrop }] : []),
              { val: year,     opts: YEARS,      set: setYear },
            ].map(({ val, opts, set }, i) => (
              <div key={i} className="relative flex-1">
                <select value={val} onChange={e => set(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-xs font-medium text-gray-700 appearance-none focus:outline-none">
                  {opts.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════
              TAB: PEST REPORTS
          ════════════════════════════════════ */}
          {activeTab === 'pest' && (
            pest.total === 0 ? (
              <div className="card">
                <EmptyCard icon={BarChart2} title="No pest reports yet"
                  sub="Submit a Pest Report form to see data here." />
              </div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="flex gap-3">
                  {[
                    { label:'Total Reports', value: pest.total,                   Icon:FileText,      bg:'#0D5C6A' },
                    { label:'High Risk',     value: pest.sevCounts['High Risk'],   Icon:AlertTriangle, bg:'#ef4444' },
                    { label:'Crops',         value: activeCrops.filter(c=>(pest.monthlyCounts[c]||[]).some(v=>v>0)).length, Icon:Leaf, bg:'#ca8a04' },
                  ].map(({ label, value, Icon, bg }) => (
                    <div key={label} className="card flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
                        <Icon size={17} className="text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Line trend */}
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Monthly Trend</h3>
                      <p className="text-xs text-gray-400">{year}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {activeCrops.map(c => (
                        <div key={c} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: CROP_COLORS[c]?.border || '#0D5C6A' }} />
                          <span className="text-[9px] text-gray-500">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 170 }}>
                    <Line data={lineData} options={BASE_CHART} />
                  </div>
                </div>

                {/* Bar */}
                <div className="card">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">Reports by Month</h3>
                  <p className="text-xs text-gray-400 mb-3">{year}</p>
                  <div style={{ height: 150 }}>
                    <Bar data={barData} options={BASE_CHART} />
                  </div>
                </div>

                {/* Doughnut + breakdown */}
                <div className="flex gap-3">
                  <div className="card flex-1">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Severity</h3>
                    {totalSev > 0 ? (
                      <div style={{ height: 120 }}>
                        <Doughnut data={doughnutData} options={{
                          responsive:true, maintainAspectRatio:false,
                          plugins:{ legend:{ display:false } }, cutout:'65%',
                        }} />
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center">
                        <p className="text-xs text-gray-400">No data</p>
                      </div>
                    )}
                  </div>
                  <div className="card flex-1">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Breakdown</h3>
                    {Object.entries(pest.sevCounts).map(([label, val]) => {
                      const pct = totalSev > 0 ? Math.round((val/totalSev)*100) : 0;
                      return (
                        <div key={label} className="mb-2">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>{label}</span><span className="font-semibold">{val}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width:`${pct}%`, background:SEV_COLORS[label] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top pests */}
                {pest.topPests.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Top Reported Pests/Diseases</h3>
                    {pest.topPests.map((p, i) => {
                      const sev = p.maxPct>=40 ? 'High' : p.maxPct>=20 ? 'Moderate' : 'Low';
                      const sevStyle = {
                        High:     { background:'#fee2e2', color:'#991b1b' },
                        Moderate: { background:'#ffedd5', color:'#9a3412' },
                        Low:      { background:'#fef9c3', color:'#854d0e' },
                      }[sev];
                      return (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background:'#E8F9FA' }}>
                            <span className="text-[10px] font-bold" style={{ color:'#0D5C6A' }}>{i+1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.crop}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-700">{p.count}</p>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={sevStyle}>{sev}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )
          )}

          {/* ════════════════════════════════════
              TAB: RATINGS (Satisfaction Survey)
          ════════════════════════════════════ */}
          {activeTab === 'ratings' && (
            ratings.total === 0 ? (
              <div className="card">
                <EmptyCard icon={Star} title="No survey responses yet"
                  sub="Submit a Client Satisfaction Survey form to see ratings here." />
              </div>
            ) : (
              <>
                {/* Overview stat cards */}
                <div className="flex gap-3">
                  {[
                    { label:'Surveys',       value: ratings.total,                                Icon:FileText, bg:'#0D5C6A' },
                    { label:'Avg Rating',    value: ratings.overall > 0 ? `${ratings.overall}★` : '—', Icon:Star, bg:'#14B8C4' },
                    { label:'On-Time',       value: ratings.onTime + ratings.notOnTime > 0
                                                      ? `${Math.round((ratings.onTime/(ratings.onTime+ratings.notOnTime))*100)}%`
                                                      : '—',                                      Icon:Clock, bg:'#22c55e' },
                  ].map(({ label, value, Icon, bg }) => (
                    <div key={label} className="card flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: bg }}>
                        <Icon size={17} className="text-white" />
                      </div>
                      <p className="text-xl font-bold text-gray-800 truncate">{value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{label}</p>
                    </div>
                  ))}
                </div>

                {/* ── Overall rating hero ── */}
                <div className="card">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-gray-800">Overall Satisfaction</h3>
                    <span className="text-xs text-gray-400">{ratings.total} respondent{ratings.total !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-4 py-3 border-b border-gray-50 mb-3">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold" style={{ color: '#0D5C6A' }}>
                        {ratings.overall > 0 ? ratings.overall : '—'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">out of 5.0</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <StarDisplay value={ratings.overall} size={20} />
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ratings.overall >= 4.5 ? 'Excellent 🎉' :
                         ratings.overall >= 3.5 ? 'Good 👍' :
                         ratings.overall >= 2.5 ? 'Average 😐' :
                         ratings.overall > 0    ? 'Needs Improvement ⚠️' : 'No ratings yet'}
                      </p>
                    </div>
                  </div>

                  {/* Rating bars per category */}
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                    Ratings by Category
                  </h4>
                  {ratings.labels.map((label, i) => (
                    <RatingBar key={label} label={label} value={ratings.avgs[i]} />
                  ))}
                </div>

                {/* ── Radar chart ── */}
                {ratings.avgs.some(v => v > 0) && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Performance Radar</h3>
                    <p className="text-xs text-gray-400 mb-3">Average score per category (1–5)</p>
                    <div style={{ height: 200 }}>
                      <Radar data={radarData} options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          r: {
                            min: 0, max: 5,
                            ticks: { stepSize: 1, font: { size: 9 }, color: '#9ca3af' },
                            grid: { color: '#e8f9fa' },
                            pointLabels: { font: { size: 10 }, color: '#0D5C6A' },
                          },
                        },
                      }} />
                    </div>
                  </div>
                )}

                {/* ── Monthly surveys bar ── */}
                <div className="card">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">Surveys per Month</h3>
                  <p className="text-xs text-gray-400 mb-3">{year}</p>
                  <div style={{ height: 140 }}>
                    <Bar data={surveyBarData} options={BASE_CHART} />
                  </div>
                </div>

                {/* ── Service provider + On-time ── */}
                <div className="flex gap-3">
                  {/* Provider donut */}
                  <div className="card flex-1">
                    <h3 className="text-xs font-bold text-gray-700 mb-2">Service Provider</h3>
                    {Object.values(ratings.providerMap).some(v=>v>0) ? (
                      <>
                        <div style={{ height: 110 }}>
                          <Doughnut data={providerData} options={{
                            responsive:true, maintainAspectRatio:false,
                            plugins:{ legend:{ display:false } }, cutout:'60%',
                          }} />
                        </div>
                        <div className="flex gap-2 justify-center mt-2 flex-wrap">
                          {Object.entries(ratings.providerMap).filter(([,v])=>v>0).map(([k,v], i) => (
                            <div key={k} className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ background: ['#0D5C6A','#129EAC','#14B8C4'][i] }}/>
                              <span className="text-[9px] text-gray-500">{k} ({v})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-28 flex items-center justify-center">
                        <p className="text-xs text-gray-400">No data</p>
                      </div>
                    )}
                  </div>

                  {/* On-time */}
                  <div className="card flex-1">
                    <h3 className="text-xs font-bold text-gray-700 mb-3">On-Time Delivery</h3>
                    {(ratings.onTime + ratings.notOnTime) > 0 ? (
                      <div className="space-y-3">
                        {[
                          { label:'On Time',  Icon:CheckCircle, val:ratings.onTime,    color:'#22c55e', bg:'#dcfce7' },
                          { label:'Delayed',  Icon:XCircle,     val:ratings.notOnTime, color:'#ef4444', bg:'#fee2e2' },
                        ].map(({ label, Icon, val, color, bg }) => (
                          <div key={label} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: bg }}>
                            <Icon size={16} style={{ color }} />
                            <div>
                              <p className="text-xs font-bold" style={{ color }}>{val}</p>
                              <p className="text-[10px]" style={{ color }}>{label}</p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-1">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>On-time rate</span>
                            <span className="font-bold text-green-600">
                              {Math.round((ratings.onTime/(ratings.onTime+ratings.notOnTime))*100)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500"
                              style={{ width:`${Math.round((ratings.onTime/(ratings.onTime+ratings.notOnTime))*100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center">
                        <p className="text-xs text-gray-400">No data</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Recent responses ── */}
                {ratings.recent.length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Recent Responses</h3>
                    {ratings.recent.map((s, i) => {
                      const avgS = [s.ratingQuantity,s.ratingServices,s.ratingAttitude,s.ratingPromptness]
                        .filter(v=>parseFloat(v)>0);
                      const avg = avgS.length
                        ? (avgS.reduce((a,b)=>a+parseFloat(b),0)/avgS.length).toFixed(1)
                        : null;
                      return (
                        <div key={s.id||i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
                            style={{ background: '#0D5C6A' }}>
                            {(s.name||'?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{s.name || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-400 truncate">{s.typeOfGoods || '—'} · {s.lgu || '—'}</p>
                            <p className="text-[10px] text-gray-400">{s.dateOfRequest || '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {avg ? (
                              <>
                                <p className="text-sm font-extrabold" style={{ color:'#0D5C6A' }}>{avg}</p>
                                <StarDisplay value={parseFloat(avg)} size={10} />
                              </>
                            ) : (
                              <p className="text-xs text-gray-300">—</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )
          )}

        </div>
      )}
    </div>
  );
}
