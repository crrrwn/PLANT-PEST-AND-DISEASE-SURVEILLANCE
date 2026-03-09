import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { addRequestForm, updateRequestForm } from '../../firebase';

const SERVICES = [
  'Trichogramma (Egg Parasitoid)','Beauveria bassiana','Metarhizium anisopliae',
  'Trichoderma','NPV (Nuclear Polyhedrosis Virus)','Yellow Sticky Trap',
  'Pheromone Trap','Field Scouting','Technical Assistance','Trainings/Seminar','Other',
];
const BLANK_ITEM = { quantity:'', service:'', purpose:'', pestFindings:'', remarks:'' };
const BLANK = {
  refNo:'',
  date: new Date().toISOString().slice(0,10),
  time: new Date().toTimeString().slice(0,5),
  clientName:'', address:'', contactNo:'',
  items:[{ ...BLANK_ITEM }],
  receivedBy:'', receivedPosition:'', receivedDate:'',
  approvedBy:'', approvedPosition:'', approvedDate:'',
};

export default function RequestForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editMode = state?.editMode === true;
  const existing = state?.record;

  const [form,   setForm]   = useState(() => {
    if (editMode && existing) {
      return {
        ...BLANK,
        ...existing,
        items: existing.items?.length ? existing.items : [{ ...BLANK_ITEM }],
      };
    }
    return BLANK;
  });
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setItem = (idx, f) => e => setForm(p => {
    const items = [...p.items]; items[idx] = { ...items[idx], [f]: e.target.value }; return { ...p, items };
  });
  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { ...BLANK_ITEM }] }));
  const removeItem = i  => setForm(p => ({ ...p, items: p.items.filter((_,j) => j !== i) }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.clientName || !form.date) { setErrMsg('Please fill in all required fields.'); setStatus('error'); return; }
    setStatus('loading');
    try {
      if (editMode && existing?.id) {
        const { id, createdAt, ...data } = { ...form };
        await updateRequestForm(existing.id, data);
      } else {
        await addRequestForm(form);
      }
      setStatus('success');
      setTimeout(() => navigate('/forms'), 1800);
    } catch {
      setErrMsg('Failed to save. Will sync when online.');
      setStatus('error');
    }
  };

  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-8 gap-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background:'#E8F9FA' }}>
        <CheckCircle size={44} style={{ color:'#0D5C6A' }} />
      </div>
      <h2 className="text-xl font-bold text-gray-800">{editMode ? 'Record Updated!' : 'Request Submitted!'}</h2>
      <p className="text-sm text-gray-500 text-center">
        {editMode ? 'The request form has been updated successfully.' : 'The request form has been saved successfully.'}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-10 pb-4"
        style={{ background:'linear-gradient(135deg,#0A4550,#129EAC)' }}>
        <button onClick={() => navigate('/forms')} className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.12)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'#AAECED' }}>
            {editMode ? 'EDITING — Form 2' : 'Form 2'}
          </p>
          <h1 className="text-white font-bold text-base">Request Form</h1>
        </div>
        {editMode && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background:'rgba(255,255,255,0.15)', color:'#AAECED' }}>EDIT MODE</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="screen-content px-4 pb-6 pt-4 space-y-4">
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{errMsg}</p>
          </div>
        )}

        <Section title="Tracking Details" accent="#129EAC">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3"><F label="Reference No."><input className="input-field" placeholder="REF-2025-001" value={form.refNo} onChange={set('refNo')} /></F></div>
            <div className="col-span-2"><F label="Date *"><input type="date" className="input-field" value={form.date} onChange={set('date')} /></F></div>
            <F label="Time"><input type="time" className="input-field" value={form.time} onChange={set('time')} /></F>
          </div>
        </Section>

        <Section title="Client Information" accent="#129EAC">
          <F label="Name of Client / Company *"><input className="input-field" placeholder="Juan Dela Cruz / ABC Farms" value={form.clientName} onChange={set('clientName')} /></F>
          <F label="Address"><input className="input-field" placeholder="Complete address" value={form.address} onChange={set('address')} /></F>
          <F label="Contact No."><input type="tel" className="input-field" placeholder="09XXXXXXXXX" value={form.contactNo} onChange={set('contactNo')} /></F>
        </Section>

        <div className="card space-y-3">
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor:'#AAECED' }}>
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color:'#129EAC' }}>BCAs / Services Requested</h3>
            <button type="button" onClick={addItem}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ color:'#0D5C6A', background:'#E8F9FA' }}>
              <Plus size={12} />Add Row
            </button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Item {idx+1}</span>
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-400"><Trash2 size={14}/></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <F label="Quantity"><input type="number" className="input-field" placeholder="0" value={item.quantity} onChange={setItem(idx,'quantity')} /></F>
                <F label="Type of BCA / Service">
                  <input className="input-field" placeholder="e.g. Bio-control agents, FFS" value={item.service} onChange={setItem(idx,'service')} autoComplete="off" />
                </F>
              </div>
              <F label="Purpose"><input className="input-field" placeholder="Purpose" value={item.purpose} onChange={setItem(idx,'purpose')} /></F>
              <F label="Pest / Disease Findings"><input className="input-field" placeholder="Observed pest/disease" value={item.pestFindings} onChange={setItem(idx,'pestFindings')} /></F>
              <F label="Remarks"><textarea className="input-field resize-none" rows={2} value={item.remarks} onChange={setItem(idx,'remarks')} /></F>
            </div>
          ))}
        </div>

        <Section title="Received By" accent="#129EAC">
          <div className="grid grid-cols-2 gap-2">
            <F label="Name"><input className="input-field" placeholder="Full name" value={form.receivedBy} onChange={set('receivedBy')} /></F>
            <F label="Position"><input className="input-field" placeholder="Position" value={form.receivedPosition} onChange={set('receivedPosition')} /></F>
          </div>
          <F label="Date / Time"><input type="datetime-local" className="input-field" value={form.receivedDate} onChange={set('receivedDate')} /></F>
        </Section>

        <Section title="Approved By" accent="#129EAC">
          <div className="grid grid-cols-2 gap-2">
            <F label="Name"><input className="input-field" placeholder="Full name" value={form.approvedBy} onChange={set('approvedBy')} /></F>
            <F label="Position"><input className="input-field" placeholder="Position" value={form.approvedPosition} onChange={set('approvedPosition')} /></F>
          </div>
          <F label="Date / Time"><input type="datetime-local" className="input-field" value={form.approvedDate} onChange={set('approvedDate')} /></F>
        </Section>

        <button type="submit" disabled={status === 'loading'}
          className="w-full text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-all shadow-md disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,#0A4550,#129EAC)' }}>
          {status === 'loading'
            ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin"/>Saving…</span>
            : editMode ? '💾 Update Request Form' : '📋 Submit Request Form'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, accent = '#0D5C6A', children }) {
  return (
    <div className="card space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide border-b pb-2"
        style={{ color: accent, borderColor:'#AAECED' }}>{title}</h3>
      {children}
    </div>
  );
}
function F({ label, children, cls = '' }) {
  return <div className={cls}><label className="form-label">{label}</label>{children}</div>;
}
