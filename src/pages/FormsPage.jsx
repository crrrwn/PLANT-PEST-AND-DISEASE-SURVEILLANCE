import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  ClipboardList, FileText, Star, ChevronRight,
  Eye, Plus, Clock, MapPin, Edit3, Trash2, Map, ArrowLeft
} from 'lucide-react';
import { db, deletePestReport, deleteRequestForm, deleteSatisfactionSurvey } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import PestReportForm   from './forms/PestReportForm';
import RequestForm      from './forms/RequestForm';
import SatisfactionForm from './forms/SatisfactionForm';

/* ── Helpers ─────────────────────────────────────── */
function fmtDate(ts) {
  if (!ts) return '—';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return '—'; }
}

function SeverityBadge({ pct }) {
  const p = parseFloat(pct) || 0;
  const cfg =
    p === 0 ? { label: 'Safe',      bg: '#dcfce7', color: '#166534' } :
    p < 20  ? { label: 'Low Risk',  bg: '#fef9c3', color: '#854d0e' } :
    p < 40  ? { label: 'Moderate',  bg: '#ffedd5', color: '#9a3412' } :
              { label: 'High Risk', bg: '#fee2e2', color: '#991b1b' };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ── Sheet wrapper ───────────────────────────────── */
function Sheet({ onClose, children, maxH = '90vh' }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-sheet slide-up"
        style={{ maxHeight: maxH }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Delete confirmation ─────────────────────────── */
function DeleteSheet({ label, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  return (
    <Sheet onClose={onClose} maxH="auto">
      <div className="px-6 pb-8 pt-2">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fecaca' }}>
            <Trash2 size={28} className="text-red-500" />
          </div>
          <p className="font-bold text-gray-800 text-lg">Delete Record?</p>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
            "<span className="font-semibold text-gray-700">{label}</span>" will be permanently
            removed. This cannot be undone.
          </p>
        </div>
        <button onClick={handle} disabled={loading}
          className="w-full bg-red-500 text-white font-semibold py-3.5 rounded-2xl
                     active:scale-95 transition-all mb-3 disabled:opacity-60">
          {loading ? 'Deleting…' : '🗑 Yes, Delete Permanently'}
        </button>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
      </div>
    </Sheet>
  );
}

/* ── Record detail view ──────────────────────────── */
function RecordDetail({ record: r, type, onBack, onClose, onDeleted }) {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const recordLabel =
    type === 'pest'    ? (r.farmerName || 'Unknown Farmer') :
    type === 'request' ? (r.clientName || 'Unknown Client') :
                         (r.name       || 'Unknown Respondent');

  const deleteHandler = {
    pest:    () => deletePestReport(r.id),
    request: () => deleteRequestForm(r.id),
    survey:  () => deleteSatisfactionSurvey(r.id),
  }[type];

  const editPath = {
    pest:    '/forms/pest-report',
    request: '/forms/request-form',
    survey:  '/forms/satisfaction-survey',
  }[type];

  const hasCoords =
    type === 'pest' &&
    !isNaN(parseFloat(r.latitude)) &&
    !isNaN(parseFloat(r.longitude));

  const handleEdit = () => {
    onClose();
    navigate(editPath, { state: { record: r, editMode: true } });
  };

  const handleViewOnMap = () => {
    onClose();
    navigate('/', {
      state: { flyTo: { lat: parseFloat(r.latitude), lng: parseFloat(r.longitude), id: r.id } },
    });
  };

  const rows =
    type === 'pest' ? [
      ['Date',               r.date],
      ['Farmer Name',        r.farmerName],
      ['Address',            r.address],
      ['Validator',          r.validator],
      ['GPS Latitude',       r.latitude],
      ['GPS Longitude',      r.longitude],
      ['Province',           r.province],
      ['Municipality',       r.municipality],
      ['Barangay',           r.barangay],
      ['Crop',               r.crop],
      ['Variety',            r.variety],
      ['Growth Stage',       r.growthStage],
      ['Date Planted',       r.datePlanted],
      ['Area Planted (ha)',  r.areaPlanted],
      ['Area Affected (ha)', r.areaAffected],
      ['% Infestation',      r.percentInfestation ? `${r.percentInfestation}%` : null],
      ['Pest / Disease',     r.pests],
      ['Remarks',            r.remarks],
    ] : type === 'request' ? [
      ['Reference No.',    r.refNo],
      ['Date',             r.date],
      ['Time',             r.time],
      ['Client Name',      r.clientName],
      ['Address',          r.address],
      ['Contact No.',      r.contactNo],
      ['Received By',      r.receivedBy],
      ['Position',         r.receivedPosition],
      ['Received Date',    r.receivedDate],
      ['Approved By',      r.approvedBy],
      ['Approved Position',r.approvedPosition],
      ['Approved Date',    r.approvedDate],
    ] : [
      ['Client Type',      r.clientType],
      ['Name',             r.name],
      ['Date of Birth',    r.dob],
      ['Gender',           r.gender],
      ['LGU',              r.lgu],
      ['Assoc. Name',      r.assocName],
      ['No. of Members',   r.assocMembers],
      ['Province',         r.province],
      ['City/Municipality', r.municipality || r.city],
      ['Barangay',         r.barangay],
      ['Date of Request',  r.dateOfRequest],
      ['Type of Goods',    r.typeOfGoods],
      ['Purpose',          r.purpose],
      ['Target Delivery',  r.deliveryTarget],
      ['Actual Delivery',  r.deliveryActual],
      ['Service Provider', r.serviceProvider],
      ['Rating – Qty',     r.ratingQuantity   ? `${r.ratingQuantity}/5 ⭐`   : null],
      ['Rating – Services',r.ratingServices   ? `${r.ratingServices}/5 ⭐`   : null],
      ['Rating – Attitude',r.ratingAttitude   ? `${r.ratingAttitude}/5 ⭐`   : null],
      ['Rating – Promptness',r.ratingPromptness ? `${r.ratingPromptness}/5 ⭐` : null],
      ['Received On Time', r.receivedOnTime],
      ['Comments',         r.additionalComments],
    ];

  return (
    <>
      <Sheet onClose={onClose} maxH="90vh">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
          <button onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{recordLabel}</h3>
            <p className="text-[11px] text-gray-400">{fmtDate(r.createdAt || r.date)}</p>
          </div>
          {type === 'pest' && <SeverityBadge pct={r.percentInfestation} />}
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm shrink-0">
            ✕
          </button>
        </div>

        {/* ── ACTION BUTTONS ── always visible below header ── */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0"
          style={{ background: '#f9fafb' }}>
          <div className={`grid gap-2 ${hasCoords ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {hasCoords && (
              <button onClick={handleViewOnMap}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl active:scale-95 transition-all"
                style={{ background: '#f9e6c2' }}>
                <Map size={18} style={{ color: '#4e7e44' }} />
                <span className="text-[10px] font-bold" style={{ color: '#4e7e44' }}>View on Map</span>
              </button>
            )}
            <button onClick={handleEdit}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#f9e6c2' }}>
              <Edit3 size={18} style={{ color: '#4e7e44' }} />
              <span className="text-[10px] font-bold" style={{ color: '#4e7e44' }}>Edit</span>
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl active:scale-95 transition-all bg-red-50">
              <Trash2 size={18} className="text-red-500" />
              <span className="text-[10px] font-bold text-red-500">Delete</span>
            </button>
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="overflow-y-auto flex-1 px-5 pb-8 pt-3">
          {type === 'request' && r.items?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">BCAs / Services</p>
              {r.items.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 mb-2 text-xs space-y-0.5">
                  <p><span className="font-semibold text-gray-600">Service:</span> {item.service || '—'}</p>
                  <p><span className="font-semibold text-gray-600">Qty:</span> {item.quantity || '—'}</p>
                  <p><span className="font-semibold text-gray-600">Pest:</span> {item.pestFindings || '—'}</p>
                  <p><span className="font-semibold text-gray-600">Remarks:</span> {item.remarks || '—'}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">All Fields</p>
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
              <span className="text-[11px] text-gray-400 w-28 shrink-0">{k}</span>
              <span className="text-[11px] font-semibold text-gray-700 flex-1 break-words">{v}</span>
            </div>
          ))}
        </div>
      </Sheet>

      {showDelete && (
        <DeleteSheet
          label={recordLabel}
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            await deleteHandler();
            setShowDelete(false);
            onDeleted();
            onClose();
          }}
        />
      )}
    </>
  );
}

/* ── Records list ────────────────────────────────── */
function RecordsSheet({ type, onClose }) {
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const collMap = { pest: 'pestReports', request: 'requestForms', survey: 'satisfactionSurveys' };

  const loadRecords = () => {
    setLoading(true);
    getDocs(query(collection(db, collMap[type]), orderBy('createdAt', 'desc')))
      .then(s => setRecords(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRecords(); }, [type]);

  if (selected) {
    return (
      <RecordDetail
        record={selected}
        type={type}
        onBack={() => setSelected(null)}
        onClose={onClose}
        onDeleted={loadRecords}
      />
    );
  }

  const titles = { pest: 'Pest Reports', request: 'Request Forms', survey: 'Satisfaction Surveys' };

  return (
    <Sheet onClose={onClose} maxH="80vh">
      {/* Sheet header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="font-bold text-gray-800 text-base">{titles[type]}</h3>
          <p className="text-xs text-gray-400">{records.length} record{records.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
          ✕
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 px-4 pb-6 pt-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-7 h-7 border-2 rounded-full"
              style={{ borderColor: '#4e7e44', borderTopColor: 'transparent' }} />
          </div>
        )}
        {!loading && records.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #fdf8f0 0%, #f9e6c2 100%)', border: '1px solid rgba(150,209,131,0.3)' }}>
              <FileText size={24} style={{ color: '#4e7e44' }} />
            </div>
            <p className="text-sm font-semibold text-gray-600">No records yet</p>
            <p className="text-xs text-gray-500">Submit a form to see records here.</p>
          </div>
        )}
        {!loading && records.map(r => (
          <button key={r.id} onClick={() => setSelected(r)} className="record-row">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#f9e6c2' }}>
              {type === 'pest'    ? <MapPin        size={15} style={{ color: '#4e7e44' }} /> :
               type === 'request' ? <ClipboardList size={15} style={{ color: '#4e7e44' }} /> :
                                     <Star         size={15} style={{ color: '#4e7e44' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {type === 'pest'    ? (r.farmerName || 'Unknown Farmer') :
                 type === 'request' ? (r.clientName  || 'Unknown Client') :
                                      (r.name        || 'Unknown Respondent')}
              </p>
              <div className="flex items-center flex-wrap gap-2 mt-0.5">
                <Clock size={10} className="text-gray-400 shrink-0" />
                <span className="text-[10px] text-gray-400">{fmtDate(r.createdAt || r.date)}</span>
                {type === 'pest' && r.crop && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: '#f9e6c2', color: '#4e7e44' }}>{r.crop}</span>
                )}
                {type === 'pest' && <SeverityBadge pct={r.percentInfestation} />}
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ── Forms menu ──────────────────────────────────── */
const FORM_DEFS = [
  { path: 'pest-report',         type: 'pest',    title: 'Pest Report',                subtitle: 'Surveillance & field data',   Icon: FileText,     color: '#4e7e44', num: 1 },
  { path: 'request-form',        type: 'request', title: 'Request Form',               subtitle: 'Intervention & action taken', Icon: ClipboardList, color: '#629e53', num: 2 },
  { path: 'satisfaction-survey', type: 'survey',  title: 'Client Satisfaction Survey', subtitle: 'Feedback & service rating',   Icon: Star,         color: '#96d183', num: 3 },
];

function FormsMenu() {
  const navigate = useNavigate();
  const [counts,    setCounts]    = useState({ pest: 0, request: 0, survey: 0 });
  const [sheetType, setSheetType] = useState(null);

  const loadCounts = () => {
    const colls = { pest: 'pestReports', request: 'requestForms', survey: 'satisfactionSurveys' };
    Object.entries(colls).forEach(([key, col]) => {
      getDocs(collection(db, col))
        .then(s => setCounts(p => ({ ...p, [key]: s.size })))
        .catch(() => {});
    });
  };

  useEffect(() => { loadCounts(); }, []);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <img src="/DALOGO.jpg" alt="" className="w-7 h-7 rounded-full object-cover" />
          <h1 className="header-title">Data Entry Forms</h1>
        </div>
        <p className="header-subtitle">Fill out or manage submitted records</p>
      </div>

      <div className="screen-content content-container pb-4 pt-4 space-y-3">
        {FORM_DEFS.map(({ path, type, title, subtitle, Icon, color, num }) => (
          <div key={path} className="card overflow-hidden p-0">
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: color }}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Form {num}</p>
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                <p className="text-xs text-gray-400">{subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold" style={{ color }}>{counts[type]}</p>
                <p className="text-[10px] text-gray-400">records</p>
              </div>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setSheetType(type)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-r border-gray-100 active:bg-gray-50 transition-colors"
                style={{ color: '#4e7e44' }}>
                <Eye size={14} /> View Records
              </button>
              <button onClick={() => navigate(path)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-white active:scale-[0.98] transition-all"
                style={{ background: color }}>
                <Plus size={14} /> New Entry
              </button>
            </div>
          </div>
        ))}
      </div>

      {sheetType && (
        <RecordsSheet
          type={sheetType}
          onClose={() => { setSheetType(null); loadCounts(); }}
        />
      )}
    </div>
  );
}

export default function FormsPage() {
  return (
    <Routes>
      <Route index                       element={<FormsMenu />} />
      <Route path="pest-report"          element={<PestReportForm />} />
      <Route path="request-form"         element={<RequestForm />} />
      <Route path="satisfaction-survey"  element={<SatisfactionForm />} />
    </Routes>
  );
}
