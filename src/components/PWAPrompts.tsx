import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'card') {
      return (
        <button
          type="button"
          onClick={install}
          className="w-full rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/35 px-4 py-3.5 flex items-center justify-between hover:bg-[#5865F2]/25 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-semibold text-[var(--dc-text-primary)]">
                Instalar Primordial
              </p>
              <p className="text-xs text-[var(--dc-text-muted)]">
                Añadir como aplicación independiente en tu dispositivo
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#5865F2] text-white text-xs font-bold">
            Instalar
          </span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar app</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'card' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="w-full rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-[var(--dc-text-primary)]">
                  Instalar en iOS
                </p>
                <p className="text-xs text-[var(--dc-text-muted)]">
                  Ver cómo añadir Primordial a la pantalla de inicio
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#5865F2]">Guía</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instalar en iOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-[var(--dc-text-primary)]">
                  Instalar en iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2.5 text-sm text-[var(--dc-text-secondary)]">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5865F2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Pulsa el botón <strong className="text-[var(--dc-text-primary)]">Compartir</strong>{' '}
                    <Share className="inline w-3.5 h-3.5 text-[#5865F2]" /> en Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#5865F2] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Desliza y selecciona{' '}
                    <strong className="text-[var(--dc-text-primary)]">Añadir a pantalla de inicio</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-10 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo sin conexión — Usando datos en caché</span>
    </div>
  );
};
