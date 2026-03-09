import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Star, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { addSatisfactionSurvey, updateSatisfactionSurvey } from '../../firebase';
import { PROVINCES, MUNICIPALITIES, BARANGAY_MUNICIPALITY, ORIENTAL_MUNICIPALITIES, BARANGAY_MUNICIPALITY_OCCIDENTAL, OCCIDENTAL_MUNICIPALITIES, BARANGAY_MUNICIPALITY_MARINDUQUE, MARINDUQUE_MUNICIPALITIES, BARANGAY_MUNICIPALITY_ROMBLON, ROMBLON_MUNICIPALITIES, BARANGAY_MUNICIPALITY_PALAWAN, PALAWAN_MUNICIPALITIES } from '../../data/locationData';

const SERVICES = [
  'Biological Control Agents (BCA)','Pest Scouting / Monitoring','Technical Assistance',
  'Seeds / Planting Materials','Fertilizer / Soil Amendment','Farm Inputs',
  'Trainings / Seminars','Demonstration / Field Day','Other',
];
const GENDERS   = ['Male','Female','Prefer not to say'];

function StarRating({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600 flex-1 pr-2">{label}</span>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)} className="active:scale-90 transition-transform">
            <Star size={22} fill={n<=value ? '#14B8C4':'none'} stroke={n<=value ? '#14B8C4':'#d1d5db'} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </div>
  );
}

const BLANK = {
  clientType:'Individual',
  name:'', dob:'', gender:'Male', assocName:'', assocMembers:'',
  street:'', barangay:'', municipality:'Abra de Ilog', province:'Occidental Mindoro', farmLocation:'',
  dateOfRequest: new Date().toISOString().slice(0,10),
  typeOfGoods:'', purpose:'', deliveryTarget:'', deliveryActual:'',
  serviceProvider:'DA Regional',
  ratingQuantity:0, ratingServices:0, ratingAttitude:0, ratingPromptness:0,
  receivedOnTime:'', whyNotOnTime:'', additionalComments:'',
};

export default function SatisfactionForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editMode = state?.editMode === true;
  const existing = state?.record;

  const [form,   setForm]   = useState(() => {
    const base = editMode && existing ? { ...BLANK, ...existing } : BLANK;
    if (base.city != null && base.municipality == null) base.municipality = base.city;
    if (['DA','LGU','Both'].includes(base.serviceProvider)) base.serviceProvider = 'DA Regional';
    return base;
  });
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const set    = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setVal = f => v => setForm(p => ({ ...p, [f]: v }));
  const setProvince = e => {
    const prov = e.target.value;
    const mun = prov === 'Oriental Mindoro' ? ORIENTAL_MUNICIPALITIES[0]
      : prov === 'Occidental Mindoro' ? OCCIDENTAL_MUNICIPALITIES[0]
      : prov === 'Marinduque' ? MARINDUQUE_MUNICIPALITIES[0]
      : prov === 'Romblon' ? ROMBLON_MUNICIPALITIES[0]
      : prov === 'Palawan' ? PALAWAN_MUNICIPALITIES[0]
      : MUNICIPALITIES[prov][0];
    const clearBarangay = ['Oriental Mindoro','Occidental Mindoro','Marinduque','Romblon','Palawan'].includes(prov);
    setForm(p => ({ ...p, province: prov, municipality: mun, barangay: clearBarangay ? '' : p.barangay }));
  };

  const isOrientalMindoro = form.province === 'Oriental Mindoro';
  const isOccidentalMindoro = form.province === 'Occidental Mindoro';
  const isMarinduque = form.province === 'Marinduque';
  const isRomblon = form.province === 'Romblon';
  const isPalawan = form.province === 'Palawan';
  const hasBarangayMunicipalityList = isOrientalMindoro || isOccidentalMindoro || isMarinduque || isRomblon || isPalawan;
  const barangayMunicipalityList = isOrientalMindoro ? BARANGAY_MUNICIPALITY
    : isOccidentalMindoro ? BARANGAY_MUNICIPALITY_OCCIDENTAL
    : isMarinduque ? BARANGAY_MUNICIPALITY_MARINDUQUE
    : isRomblon ? BARANGAY_MUNICIPALITY_ROMBLON
    : isPalawan ? BARANGAY_MUNICIPALITY_PALAWAN
    : [];
  const municipalityOptions = isOrientalMindoro ? ORIENTAL_MUNICIPALITIES
    : isOccidentalMindoro ? OCCIDENTAL_MUNICIPALITIES
    : isMarinduque ? MARINDUQUE_MUNICIPALITIES
    : isRomblon ? ROMBLON_MUNICIPALITIES
    : isPalawan ? PALAWAN_MUNICIPALITIES
    : [];
  const filteredBarangays = hasBarangayMunicipalityList
    ? barangayMunicipalityList.filter(bm => !form.municipality || bm.municipality === form.municipality)
    : [];
  const setBarangayMunicipality = (barangay, municipality) => {
    setForm(p => ({ ...p, barangay, municipality }));
  };

  const avgRating = (() => {
    const vals = [form.ratingQuantity,form.ratingServices,form.ratingAttitude,form.ratingPromptness].filter(v=>v>0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : null;
  })();

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.dateOfRequest) { setErrMsg('Please fill in all required fields.'); setStatus('error'); return; }
    setStatus('loading');
    try {
      if (editMode && existing?.id) {
        const { id, createdAt, ...data } = { ...form };
        await updateSatisfactionSurvey(existing.id, data);
      } else {
        await addSatisfactionSurvey(form);
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
      <h2 className="text-xl font-bold text-gray-800">{editMode ? 'Record Updated!' : 'Survey Submitted!'}</h2>
      <p className="text-sm text-gray-500 text-center">
        {editMode ? 'The survey has been updated successfully.' : 'Thank you for your feedback.'}
      </p>
    </div>
  );

  const ACC  = '#14B8C4';
  const DARK = '#0D5C6A';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-10 pb-4"
        style={{ background:`linear-gradient(135deg,#0A4550,${ACC})` }}>
        <button onClick={() => navigate('/forms')} className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.12)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'#AAECED' }}>
            {editMode ? 'EDITING — Form 3' : 'Form 3'}
          </p>
          <h1 className="text-white font-bold text-base">Client Satisfaction Survey</h1>
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

        {/* Client Type */}
        <div className="card space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide border-b pb-2" style={{ color:DARK, borderColor:'#AAECED' }}>Client Type</h3>
          <div className="flex gap-3">
            {['Individual','Group'].map(t => (
              <button key={t} type="button" onClick={() => setForm(p=>({...p,clientType:t}))}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border-2 transition-all"
                style={form.clientType===t
                  ? { background:DARK, borderColor:DARK, color:'white' }
                  : { background:'white', borderColor:'#e5e7eb', color:'#4b5563' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Section title="Recipient Information" accent={DARK}>
          <F label="Full Name *"><input className="input-field" placeholder="Juan Dela Cruz" value={form.name} onChange={set('name')} /></F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Date of Birth"><input type="date" className="input-field" value={form.dob} onChange={set('dob')} /></F>
            <F label="Gender">
              <select className="input-field" value={form.gender} onChange={set('gender')}>
                {GENDERS.map(g=><option key={g}>{g}</option>)}
              </select>
            </F>
          </div>
          {form.clientType==='Group' && (
            <div className="grid grid-cols-2 gap-2">
              <F label="Association Name"><input className="input-field" placeholder="Association name" value={form.assocName} onChange={set('assocName')} /></F>
              <F label="No. of Members"><input type="number" className="input-field" placeholder="0" value={form.assocMembers} onChange={set('assocMembers')} /></F>
            </div>
          )}
        </Section>

        <Section title="Location Details" accent={DARK}>
          <F label="Street / Purok"><input className="input-field" placeholder="Street address" value={form.street} onChange={set('street')} /></F>
          <F label="Province">
            <select className="input-field" value={form.province} onChange={setProvince}>
              {PROVINCES.map(p => <option key={p}>{p}</option>)}
            </select>
          </F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Barangay">
              {hasBarangayMunicipalityList ? (
                <select
                  className="input-field"
                  value={form.barangay && form.municipality ? `${form.barangay}|${form.municipality}` : ''}
                  onChange={e => {
                    const v = e.target.value;
                    if (!v) return;
                    const [barangay, municipality] = v.split('|');
                    if (barangay && municipality) setBarangayMunicipality(barangay, municipality);
                  }}
                >
                  <option value="">Select barangay</option>
                  {filteredBarangays.map(bm => (
                    <option key={`${bm.barangay}-${bm.municipality}`} value={`${bm.barangay}|${bm.municipality}`}>{bm.barangay}</option>
                  ))}
                </select>
              ) : (
                <input className="input-field" placeholder="Barangay" value={form.barangay} onChange={set('barangay')} />
              )}
            </F>
            <F label="Municipality">
              {hasBarangayMunicipalityList ? (
                <select
                  className="input-field"
                  value={form.municipality}
                  onChange={e => {
                    const mun = e.target.value;
                    setForm(p => ({ ...p, municipality: mun, barangay: '' }));
                  }}
                >
                  {municipalityOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              ) : (
                <select className="input-field" value={form.municipality} onChange={set('municipality')}>
                  {(MUNICIPALITIES[form.province] || []).map(m => <option key={m}>{m}</option>)}
                </select>
              )}
            </F>
          </div>
          <F label="Farm Location"><input className="input-field" placeholder="GPS or description" value={form.farmLocation} onChange={set('farmLocation')} /></F>
        </Section>

        <Section title="Assistance Details" accent={DARK}>
          <F label="Date of Request *"><input type="date" className="input-field" value={form.dateOfRequest} onChange={set('dateOfRequest')} /></F>
          <F label="Type of Goods / Services">
            <input className="input-field" placeholder="e.g. BCA, Trainings, Technical Assistance" value={form.typeOfGoods} onChange={set('typeOfGoods')} autoComplete="off" />
          </F>
          <F label="Purpose"><input className="input-field" placeholder="Purpose" value={form.purpose} onChange={set('purpose')} /></F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Target Delivery"><input type="date" className="input-field" value={form.deliveryTarget} onChange={set('deliveryTarget')} /></F>
            <F label="Actual Delivery"><input type="date" className="input-field" value={form.deliveryActual} onChange={set('deliveryActual')} /></F>
          </div>
        </Section>

        {/* Ratings */}
        <div className="card space-y-1">
          <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor:'#AAECED' }}>
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color:DARK }}>Feedback Ratings</h3>
            {avgRating && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background:'#E8F9FA' }}>
                <Star size={11} fill={ACC} stroke={ACC} />
                <span className="text-xs font-bold" style={{ color:DARK }}>{avgRating}/5</span>
              </div>
            )}
          </div>
          <F label="Service Provider">
            <div className="flex gap-2">
              {['DA Regional'].map(p=>(
                <button key={p} type="button" onClick={()=>setForm(f=>({...f,serviceProvider:p}))}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.serviceProvider===p
                    ? { background:DARK, borderColor:DARK, color:'white' }
                    : { background:'white', borderColor:'#e5e7eb', color:'#4b5563' }}>
                  {p}
                </button>
              ))}
            </div>
          </F>
          <p className="text-[10px] text-gray-400 mt-2">Rate from 1 (Poor) to 5 (Excellent)</p>
          <StarRating label="Quantity of goods received"   value={form.ratingQuantity}   onChange={setVal('ratingQuantity')} />
          <StarRating label="Quality of services rendered" value={form.ratingServices}   onChange={setVal('ratingServices')} />
          <StarRating label="Attitude of personnel"        value={form.ratingAttitude}   onChange={setVal('ratingAttitude')} />
          <StarRating label="Promptness of delivery"       value={form.ratingPromptness} onChange={setVal('ratingPromptness')} />
        </div>

        <div className="card space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide border-b pb-2" style={{ color:DARK, borderColor:'#AAECED' }}>Timeliness</h3>
          <F label="Received goods/services on time?">
            <div className="flex gap-2">
              {['Yes','No'].map(v=>(
                <button key={v} type="button" onClick={()=>setForm(f=>({...f,receivedOnTime:v}))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={form.receivedOnTime===v
                    ? v==='Yes' ? { background:'#22c55e', borderColor:'#22c55e', color:'white' }
                                : { background:'#ef4444', borderColor:'#ef4444', color:'white' }
                    : { background:'white', borderColor:'#e5e7eb', color:'#4b5563' }}>
                  {v}
                </button>
              ))}
            </div>
          </F>
          {form.receivedOnTime==='No' && (
            <F label="Please explain why:">
              <textarea className="input-field resize-none" rows={2} placeholder="Reason for delay…" value={form.whyNotOnTime} onChange={set('whyNotOnTime')} />
            </F>
          )}
          <F label="Additional Comments / Suggestions">
            <textarea className="input-field resize-none" rows={3} placeholder="Your feedback…" value={form.additionalComments} onChange={set('additionalComments')} />
          </F>
        </div>

        <button type="submit" disabled={status==='loading'}
          className="w-full text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-all shadow-md disabled:opacity-60"
          style={{ background:`linear-gradient(135deg,${DARK},${ACC})` }}>
          {status==='loading'
            ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin"/>Saving…</span>
            : editMode ? '💾 Update Survey' : '⭐ Submit Survey'}
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
