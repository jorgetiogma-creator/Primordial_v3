import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Eraser,
  Film,
  Image as ImageIcon,
  Monitor,
  Pause,
  PenTool,
  Play,
  Sparkles,
  StopCircle,
  Upload,
  X,
} from 'lucide-react';

type StudioMode = 'image' | 'whiteboard' | 'video';

interface ScreenShareStudioModalProps {
  isOpen: boolean;
  isSharing: boolean;
  notice?: string | null;
  onClose: () => void;
  onTryNativeScreen: () => void;
  onStartStudioStream: (stream: MediaStream, label: string) => Promise<void> | void;
  onStopSharing: () => void;
}

const PEN_COLORS = ['#ffffff', '#f97316', '#38bdf8', '#22c55e', '#f43f5e'];

export const ScreenShareStudioModal: React.FC<ScreenShareStudioModalProps> = ({
  isOpen,
  isSharing,
  notice,
  onClose,
  onTryNativeScreen,
  onStartStudioStream,
  onStopSharing,
}) => {
  const [mode, setMode] = useState<StudioMode>('image');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [penColor, setPenColor] = useState('#f97316');
  const [studioLive, setStudioLive] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgElementRef = useRef<HTMLImageElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const strokesRef = useRef<
    Array<{ color: string; points: Array<{ x: number; y: number }> }>
  >([]);
  const currentStrokeRef = useRef<{
    color: string;
    points: Array<{ x: number; y: number }>;
  } | null>(null);
  const laserRef = useRef<{ x: number; y: number; until: number } | null>(null);
  const drawingActiveRef = useRef(false);
  const studioStreamRef = useRef<MediaStream | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#09090d';
    ctx.fillRect(0, 0, w, h);

    if (mode === 'image') {
      const img = imgElementRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#14151d';
        ctx.fillRect(36, 36, w - 72, h - 72);
        ctx.strokeStyle = 'rgba(249,115,22,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 36, w - 72, h - 72);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pantalla de presentación Primordial', w / 2, h / 2 - 14);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.fillText('Elige una captura o foto abajo para mostrarla en vivo', w / 2, h / 2 + 28);
      }
    } else if (mode === 'video') {
      const vid = videoElementRef.current;
      if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
        const scale = Math.min(w / vid.videoWidth, h / vid.videoHeight);
        const dw = vid.videoWidth * scale;
        const dh = vid.videoHeight * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(vid, dx, dy, dw, dh);
      } else {
        ctx.fillStyle = '#14151d';
        ctx.fillRect(36, 36, w - 72, h - 72);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Transmisión de video en vivo', w / 2, h / 2 - 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px sans-serif';
        ctx.fillText('Selecciona un video de tu dispositivo para compartirlo', w / 2, h / 2 + 28);
      }
    } else {
      // Whiteboard grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += 48) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 48) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
    }

    // Drawn strokes (works on both whiteboard and image overlay)
    const allStrokes = currentStrokeRef.current
      ? [...strokesRef.current, currentStrokeRef.current]
      : strokesRef.current;

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }

    // Laser pointer dot
    const laser = laserRef.current;
    if (laser && Date.now() < laser.until) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.28)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#fb923c';
      ctx.fill();
      ctx.restore();
    }
  }, [mode]);

  useEffect(() => {
    if (!isOpen && !studioLive) return;
    let rafId = 0;
    const loop = () => {
      renderFrame();
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen, studioLive, renderFrame]);

  useEffect(() => {
    if (!isSharing) {
      setStudioLive(false);
    }
  }, [isSharing]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e.clientX, e.clientY);
    laserRef.current = { x: pt.x, y: pt.y, until: Date.now() + 900 };
    if (mode === 'whiteboard' || mode === 'image') {
      drawingActiveRef.current = true;
      currentStrokeRef.current = { color: penColor, points: [pt] };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (drawingActiveRef.current && currentStrokeRef.current) {
      currentStrokeRef.current.points.push(pt);
      laserRef.current = { x: pt.x, y: pt.y, until: Date.now() + 900 };
    }
  };

  const handlePointerUp = () => {
    if (drawingActiveRef.current && currentStrokeRef.current) {
      strokesRef.current = [...strokesRef.current, currentStrokeRef.current];
      currentStrokeRef.current = null;
    }
    drawingActiveRef.current = false;
  };

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgElementRef.current = img;
      renderFrame();
    };
    img.src = url;
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setMode('image');
    e.target.value = '';
  };

  const handlePickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setMode('video');
    setVideoPlaying(true);
    e.target.value = '';
  };

  const handleStartBroadcast = async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.captureStream !== 'function') return;
    renderFrame();
    const stream = canvas.captureStream(24);
    studioStreamRef.current = stream;
    setStudioLive(true);
    const label =
      mode === 'image'
        ? 'Presentación en vivo'
        : mode === 'video'
        ? 'Video compartido en vivo'
        : 'Pizarra en vivo';
    await onStartStudioStream(stream, label);
  };

  const handleStopBroadcast = () => {
    studioStreamRef.current?.getTracks().forEach((t) => t.stop());
    studioStreamRef.current = null;
    setStudioLive(false);
    onStopSharing();
  };

  if (!isOpen && !studioLive) return null;

  return (
    <div
      className={`fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 transition-opacity ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none -z-50'
      }`}
    >
      <div className="w-full max-w-2xl rounded-3xl bg-[#15161c] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/20 text-[#8fa0ff] flex items-center justify-center shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-white truncate">
                Estudio para compartir pantalla
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                Transmite pantalla, capturas, pizarra o video en vivo a la llamada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar estudio"
            className="w-11 h-11 rounded-full hover:bg-white/10 text-zinc-300 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {notice && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-400/25 px-3.5 py-2.5 text-xs text-amber-200 flex items-center justify-between gap-3">
              <span>{notice}</span>
              <button
                type="button"
                onClick={onTryNativeScreen}
                className="shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold cursor-pointer whitespace-nowrap"
              >
                Reintentar pantalla
              </button>
            </div>
          )}

          {/* Selector de modo */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-[#0e0f14] border border-white/10">
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                mode === 'image' ? 'bg-[#5865F2] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Foto / Captura</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('whiteboard')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                mode === 'whiteboard' ? 'bg-[#5865F2] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4 shrink-0" />
              <span>Pizarra en vivo</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('video')}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                mode === 'video' ? 'bg-[#5865F2] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 shrink-0" />
              <span>Video local</span>
            </button>
          </div>

          {/* Canvas de transmisión en vivo */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video">
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-full touch-none cursor-crosshair block"
            />
            {studioLive && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#23a55a] text-white text-[11px] font-bold flex items-center gap-1.5 shadow">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Transmitiendo en llamada</span>
              </div>
            )}
          </div>

          {videoUrl && (
            <video
              ref={videoElementRef}
              src={videoUrl}
              autoPlay
              loop
              playsInline
              muted
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              className="hidden"
            />
          )}

          {/* Controles según modo */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {mode === 'image' && (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePickImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#262834] hover:bg-[#313344] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{imageUrl ? 'Cambiar captura' : 'Elegir captura / foto'}</span>
                  </button>
                </>
              )}

              {mode === 'video' && (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handlePickVideo}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#262834] hover:bg-[#313344] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{videoUrl ? 'Cambiar video' : 'Elegir video'}</span>
                  </button>
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const vid = videoElementRef.current;
                        if (!vid) return;
                        if (vid.paused) {
                          void vid.play().catch(() => undefined);
                        } else {
                          vid.pause();
                        }
                      }}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#262834] hover:bg-[#313344] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {videoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{videoPlaying ? 'Pausar' : 'Reproducir'}</span>
                    </button>
                  )}
                </>
              )}

              {(mode === 'whiteboard' || mode === 'image') && (
                <div className="flex items-center gap-1.5">
                  {PEN_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPenColor(color)}
                      aria-label={`Color ${color}`}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-transform ${
                        penColor === color
                          ? 'border-white scale-110'
                          : 'border-white/20 hover:scale-105'
                      }`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      strokesRef.current = [];
                      currentStrokeRef.current = null;
                      renderFrame();
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#262834] hover:bg-[#313344] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eraser className="w-4 h-4" />
                    <span>Limpiar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onTryNativeScreen}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#262834] hover:bg-[#313344] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Monitor className="w-4 h-4" />
                <span>Pantalla del sistema</span>
              </button>

              {studioLive || isSharing ? (
                <button
                  type="button"
                  onClick={handleStopBroadcast}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#f23f43] hover:bg-[#d83337] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Detener transmisión</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleStartBroadcast()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#23a55a] hover:bg-[#1e934e] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  <span>Compartir en vivo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
