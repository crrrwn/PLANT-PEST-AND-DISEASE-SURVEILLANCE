import React, { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + Math.random() * 14; });
    }, 200);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-between h-full px-8 py-14"
      style={{ background: 'linear-gradient(175deg, #072F36 0%, #0D5C6A 45%, #129EAC 100%)' }}
    >
      {/* Top branding */}
      <div className="flex items-center gap-2 self-start">
        <img src="/PSDSMLOGO.png" alt="DA Logo" className="w-9 h-9 object-contain" />
        <div>
          <p className="text-white/50 text-[9px] font-bold tracking-[0.2em] uppercase">Department of Agriculture</p>
          <p className="text-white/70 text-[9px] tracking-widest uppercase">MIMAROPA · Region 4B</p>
        </div>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-7">
        {/* Animated rings */}
        <div className="relative flex items-center justify-center w-48 h-48">
          <div className="absolute inset-0 rounded-full border-2 opacity-10"
            style={{ borderColor: '#00CDD2', animation: 'spin-slow 8s linear infinite' }} />
          <div className="absolute inset-4 rounded-full border opacity-20"
            style={{ borderColor: '#00CDD2', animation: 'spin-slow 5s linear infinite reverse' }} />
          <div className="absolute inset-8 rounded-full border opacity-30"
            style={{ borderColor: '#14B8C4', animation: 'spin-slow 3s linear infinite' }} />

          {/* Logo circle */}
          <div className="w-28 h-28 rounded-full border-2 border-white/20 shadow-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <img src="/PSDSM.png" alt="PSDSM" className="w-22 h-22 object-contain drop-shadow-xl" style={{ width: 88, height: 88 }} />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-white font-extrabold text-3xl tracking-tight">PSDSM</h1>
          <p className="font-medium tracking-[0.15em] uppercase text-xs" style={{ color: '#00CDD2' }}>
            Plant Pest & Disease
          </p>
          <p className="font-medium tracking-[0.15em] uppercase text-xs" style={{ color: '#00CDD2' }}>
            Surveillance Monitoring
          </p>
        </div>

        {/* Pulse indicator */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="relative w-2 h-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#00CDD2' }} />
            <div className="absolute top-0 left-0 w-2 h-2 rounded-full animate-ping"
              style={{ background: '#00CDD2', opacity: 0.5 }} />
          </div>
          <span className="text-white/70 text-[10px] font-semibold tracking-widest uppercase">
            DA · MIMAROPA Region 4B
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full space-y-2">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, #129EAC, #00CDD2)' }} />
        </div>
        <p className="text-center text-white/40 text-[10px] tracking-wider">Initializing application…</p>
      </div>
    </div>
  );
}
