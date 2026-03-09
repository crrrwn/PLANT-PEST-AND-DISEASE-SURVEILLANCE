import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Crosshair, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { addPestReport, updatePestReport } from '../../firebase';
import { PROVINCES, MUNICIPALITIES, BARANGAY_MUNICIPALITY, ORIENTAL_MUNICIPALITIES, BARANGAY_MUNICIPALITY_OCCIDENTAL, OCCIDENTAL_MUNICIPALITIES, BARANGAY_MUNICIPALITY_MARINDUQUE, MARINDUQUE_MUNICIPALITIES, BARANGAY_MUNICIPALITY_ROMBLON, ROMBLON_MUNICIPALITIES, BARANGAY_MUNICIPALITY_PALAWAN, PALAWAN_MUNICIPALITIES } from '../../data/locationData';

const CROPS     = ['Rice','Corn','Sibuyas','Mango'];
const STAGES    = ['Seedling','Vegetative','Reproductive','Ripening','Harvesting'];

const PESTS_BY_CROP = {
  Rice:    ['Brown Planthopper','Stem Borer','Leaf Folder','Blast','Tungro','Sheath Blight'],
  Corn:    ['Fall Armyworm','Corn Earworm','Aphids','Downy Mildew','Gray Leaf Spot'],
  Sibuyas: ['Thrips','Purple Blotch','Downy Mildew','Fusarium Rot','Bulb Mites'],
  Mango:   ['Mango Leafhopper','Mango Tip Borer','Mealybugs','Anthracnose','Powdery Mildew'],
};

function sevInfo(pct) {
  const p = parseFloat(pct) || 0;
  if (p === 0) return { label:'Safe',          dot:'#22c55e', bg:'#dcfce7', text:'#166534', border:'#86efac' };
  if (p < 20)  return { label:'Low Risk',      dot:'#facc15', bg:'#fef9c3', text:'#854d0e', border:'#fde047' };
  if (p < 40)  return { label:'Moderate Risk', dot:'#f97316', bg:'#ffedd5', text:'#9a3412', border:'#fdba74' };
  return              { label:'High Risk',     dot:'#ef4444', bg:'#fee2e2', text:'#991b1b', border:'#fca5a5' };
}

const BLANK = {
  date: new Date().toISOString().slice(0,10),
  farmerName:'', address:'', validator:'',
  latitude:'', longitude:'',
  crop:'Rice', variety:'', growthStage:'Vegetative', datePlanted:'',
  municipality:'Abra de Ilog', province:'Occidental Mindoro', barangay:'',
  areaPlanted:'', areaAffected:'', percentInfestation:'',
  pests:'', remarks:'',
};

export default function PestReportForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const editMode  = state?.editMode === true;
  const existing  = state?.record;

  const [form,    setForm]    = useState(editMode && existing ? { ...BLANK, ...existing } : BLANK);
  const [status,  setStatus]  = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [gpsLoad, setGpsLoad] = useState(false);

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const setProvince = e => {
    const prov = e.target.value;
    const mun = prov === 'Oriental Mindoro' ? ORIENTAL_MUNICIPALITIES[0]
      : prov === 'Occidental Mindoro' ? OCCIDENTAL_MUNICIPALITIES[0]
      : prov === 'Marinduque' ? MARINDUQUE_MUNICIPALITIES[0]
      : prov === 'Romblon' ? ROMBLON_MUNICIPALITIES[0]
      : prov === 'Palawan' ? PALAWAN_MUNICIPALITIES[0]
      : MUNICIPALITIES[prov][0];
    const clearBarangay =
      prov === 'Oriental Mindoro' ||
      prov === 'Occidental Mindoro' ||
      prov === 'Marinduque' ||
      prov === 'Romblon' ||
      prov === 'Palawan';
    setForm(p => ({ ...p, province: prov, municipality: mun, barangay: clearBarangay ? '' : p.barangay }));
  };

  const isOrientalMindoro = form.province === 'Oriental Mindoro';
  const isOccidentalMindoro = form.province === 'Occidental Mindoro';
  const isMarinduque = form.province === 'Marinduque';
  const isRomblon = form.province === 'Romblon';
  const isPalawan = form.province === 'Palawan';
  const hasBarangayMunicipalityList =
    isOrientalMindoro || isOccidentalMindoro || isMarinduque || isRomblon || isPalawan;
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

  const getGPS = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported.');
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({ ...p, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setGpsLoad(false);
      },
      () => { alert('Could not get location.'); setGpsLoad(false); }
    );
  };

  const sev = sevInfo(form.percentInfestation);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.farmerName || !form.crop || !form.percentInfestation) {
      setErrMsg('Please fill in all required fields.');
      setStatus('error'); return;
    }
    setStatus('loading');
    try {
      if (editMode && existing?.id) {
        const { id, createdAt, ...data } = { ...form };
        await updatePestReport(existing.id, data);
      } else {
        await addPestReport(form);
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
      <h2 className="text-xl font-bold text-gray-800">
        {editMode ? 'Record Updated!' : 'Report Submitted!'}
      </h2>
      <p className="text-sm text-gray-500 text-center">
        {editMode ? 'The pest report has been updated successfully.' : 'The pest report has been saved and will appear on the surveillance map.'}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-10 pb-4"
        style={{ background:'linear-gradient(135deg,#072F36,#0D5C6A)' }}>
        <button onClick={() => navigate('/forms')} className="p-2 rounded-xl" style={{ background:'rgba(255,255,255,0.12)' }}>
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color:'#80E8EA' }}>
            {editMode ? 'EDITING — Form 1' : 'Form 1'}
          </p>
          <h1 className="text-white font-bold text-base">Pest Report</h1>
        </div>
        {editMode && (
          <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background:'rgba(255,255,255,0.15)', color:'#AAECED' }}>
            EDIT MODE
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="screen-content px-4 pb-6 pt-4 space-y-4">
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{errMsg}</p>
          </div>
        )}

        <Section title="General Information">
          <F label="Date *"><input type="date" className="input-field" value={form.date} onChange={set('date')} /></F>
          <F label="Name of Farmer *"><input className="input-field" placeholder="Juan Dela Cruz" value={form.farmerName} onChange={set('farmerName')} /></F>
          <F label="Address"><input className="input-field" placeholder="Complete address" value={form.address} onChange={set('address')} /></F>
          <F label="Name of Validator"><input className="input-field" placeholder="DA/LGU Technician" value={form.validator} onChange={set('validator')} /></F>
        </Section>

        <Section title="Location Data">
          <div className="flex gap-2">
            <F label="Latitude *" cls="flex-1"><input className="input-field" placeholder="12.3688" value={form.latitude} onChange={set('latitude')} /></F>
            <F label="Longitude *" cls="flex-1"><input className="input-field" placeholder="121.9119" value={form.longitude} onChange={set('longitude')} /></F>
          </div>
          <button type="button" onClick={getGPS} disabled={gpsLoad}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ borderColor:'#129EAC', color:'#0D5C6A' }}>
            {gpsLoad ? <><Loader size={15} className="animate-spin" />Getting location…</>
                     : <><Crosshair size={15} />Auto-detect GPS Location</>}
          </button>
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
        </Section>

        <Section title="Crop Details">
          <div className="grid grid-cols-2 gap-2">
            <F label="Crop *">
              <input className="input-field" placeholder="e.g. Rice, Corn" value={form.crop} onChange={set('crop')} autoComplete="off" />
            </F>
            <F label="Variety"><input className="input-field" placeholder="NSIC RC222" value={form.variety} onChange={set('variety')} /></F>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Growth Stage">
              <input className="input-field" placeholder="e.g. Vegetative, Reproductive" value={form.growthStage} onChange={set('growthStage')} autoComplete="off" />
            </F>
            <F label="Date Planted"><input type="date" className="input-field" value={form.datePlanted} onChange={set('datePlanted')} /></F>
          </div>
        </Section>

        <Section title="Damage Assessment">
          <div className="grid grid-cols-2 gap-2">
            <F label="Area Planted (ha)"><input type="number" className="input-field" placeholder="0.00" step="0.01" value={form.areaPlanted} onChange={set('areaPlanted')} /></F>
            <F label="Area Affected (ha)"><input type="number" className="input-field" placeholder="0.00" step="0.01" value={form.areaAffected} onChange={set('areaAffected')} /></F>
          </div>
          <F label="% Infestation *">
            <input type="number" className="input-field" placeholder="0 – 100" min="0" max="100"
              value={form.percentInfestation} onChange={set('percentInfestation')} />
          </F>
          {form.percentInfestation !== '' && (
            <div className="flex items-center gap-2 border rounded-xl px-4 py-2.5"
              style={{ background: sev.bg, borderColor: sev.border }}>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: sev.dot }} />
              <span className="text-sm font-bold" style={{ color: sev.text }}>{sev.label}</span>
              <span className="text-xs text-gray-500 ml-auto">{form.percentInfestation}% infestation</span>
            </div>
          )}
          <F label="Pests / Diseases">
            <input className="input-field" placeholder="e.g. Rice bug, Blast" value={form.pests} onChange={set('pests')} autoComplete="off" />
          </F>
          <F label="Remarks">
            <textarea className="input-field resize-none" rows={3} placeholder="Additional observations…"
              value={form.remarks} onChange={set('remarks')} />
          </F>
        </Section>

        <button type="submit" disabled={status === 'loading'} className="btn-primary disabled:opacity-60">
          {status === 'loading'
            ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin" />Saving…</span>
            : editMode ? '💾 Update Pest Report' : '📍 Submit Pest Report'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wide border-b pb-2"
        style={{ color:'#0D5C6A', borderColor:'#AAECED' }}>{title}</h3>
      {children}
    </div>
  );
}
function F({ label, children, cls = '' }) {
  return <div className={cls}><label className="form-label">{label}</label>{children}</div>;
}
