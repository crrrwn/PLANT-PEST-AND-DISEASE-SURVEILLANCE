import React, { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';

const DARK = '#4e7e44';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet slide-up" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 rounded-full bg-gray-200"/></div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  );
}

export default function InstallAppSheet({ onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <Modal title="Install PSDSM App" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl" style={{ background:'#f9e6c2' }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-2 ring-white/80 flex-shrink-0">
            <img src="/DALOGO.jpg" alt="PSDSM" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-gray-800">Add to Home Screen</p>
            <p className="text-xs text-gray-500">Use PSDSM like a native app — this icon will appear on your home screen.</p>
          </div>
        </div>

        {installed ? (
          <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background:'#f9e6c2', border:'1px solid #96d183' }}>
            <CheckCircle size={20} style={{ color:DARK }} />
            <p className="text-sm font-medium" style={{ color:'#4e7e44' }}>App is installed! Open it from your home screen.</p>
          </div>
        ) : (
          <>
            {deferredPrompt && isAndroid && (
              <button onClick={handleInstall} className="btn-primary w-full flex items-center justify-center gap-2">
                <Download size={18} />
                Install App
              </button>
            )}

            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Step-by-step:</p>
              {isIOS ? (
                <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-800">Safari (iPhone/iPad):</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Tap the Share button <span className="inline-block px-1.5 py-0.5 bg-gray-200 rounded">⎙</span> at the bottom</li>
                    <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                    <li>Tap <strong>Add</strong> to confirm</li>
                  </ol>
                </div>
              ) : isAndroid ? (
                <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-800">Chrome (Android):</p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Tap the menu <span className="inline-block px-1.5 py-0.5 bg-gray-200 rounded">⋮</span> (3 dots)</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
                    <li>Confirm to add the app icon</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-800">On your phone:</p>
                  <p className="text-xs text-gray-600">Open this site in <strong>Safari</strong> (iOS) or <strong>Chrome</strong> (Android), then use the browser menu to add to home screen.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
