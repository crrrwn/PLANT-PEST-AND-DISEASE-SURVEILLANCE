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
      className="flex flex-col items-center justify-between h-full px-8 py-14 relative overflow-hidden"
      style={{ background: 'var(--header-gradient)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(150,209,131,0.5) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }} />
      </div>
      {/* Top branding */}
      <div className="flex items-center gap-2 self-start relative z-10">
        <div className="w-9 h-9 rounded-full ring-2 ring-white/25 shadow-lg overflow-hidden">
          <img src="/DALOGO.jpg" alt="DA Logo" className="w-full h-full object-cover" />
        </div>
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
            style={{ borderColor: '#96d183', animation: 'spin-slow 8s linear infinite' }} />
          <div className="absolute inset-4 rounded-full border opacity-20"
            style={{ borderColor: '#96d183', animation: 'spin-slow 5s linear infinite reverse' }} />
          <div className="absolute inset-8 rounded-full border opacity-30"
            style={{ borderColor: '#629e53', animation: 'spin-slow 3s linear infinite' }} />

          {/* Logo circle */}
          <div className="w-28 h-28 rounded-full border-2 border-white/20 shadow-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <img src="/DALOGO.jpg" alt="PSDSM" className="rounded-full object-cover drop-shadow-xl" style={{ width: 88, height: 88 }} />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-white font-extrabold text-3xl tracking-tight">PSDSM</h1>
          <p className="font-medium tracking-[0.15em] uppercase text-xs" style={{ color: '#96d183' }}>
            Plant Pest & Disease
          </p>
          <p className="font-medium tracking-[0.15em] uppercase text-xs" style={{ color: '#96d183' }}>
            Surveillance Monitoring
          </p>
        </div>

        {/* Pulse indicator */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="relative w-2 h-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#96d183' }} />
            <div className="absolute top-0 left-0 w-2 h-2 rounded-full animate-ping"
              style={{ background: '#96d183', opacity: 0.5 }} />
          </div>
          <span className="text-white/70 text-[10px] font-semibold tracking-widest uppercase">
            DA · MIMAROPA Region 4B
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full space-y-2 relative z-10">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%`, background: 'linear-gradient(90deg, #629e53, #96d183)' }} />
        </div>
        <p className="text-center text-white/40 text-[10px] tracking-wider">Initializing application…</p>
      </div>
    </div>
  );
}
