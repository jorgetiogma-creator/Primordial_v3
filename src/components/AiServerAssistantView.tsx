import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Hash,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Shield,
  UserPlus,
  Volume2,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import {
  AiAssistantMessage,
  AiConversationState,
  AiServerBuildPlan,
  Server,
  UserProfile,
} from '../types/discord';
import { PrimordialAppIcon } from './DiscordArt';
import { canManageServer } from '../utils/ownerAccess';

export const AI_BUILDER_BOT_UID = 'primordial-ai-builder-bot';
export const AI_BUILD_CREDIT_COST = 10;
export const MAX_AI_WAIT_SECONDS = 15 * 60; // 15 minutes maximum
const MAX_ATTACHED_IMAGES = 4;

interface PendingImageAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface AiServerAssistantViewProps {
  user: UserProfile;
  servers: Server[];
  currentServerId?: string | null;
  credits: number;
  isOwner?: boolean;
  conversation: AiConversationState;
  onUpdateConversation: (
    updater: (prev: AiConversationState) => AiConversationState
  ) => void;
  onBack: () => void;
  onInviteBotToServer: (serverId: string) => Promise<boolean>;
  onApplyBuildPlan: (
    targetServerId: string | null,
    plan: AiServerBuildPlan,
    originalPrompt: string
  ) => Promise<{
    serverId: string;
    serverName: string;
    channelsCreated: number;
    channelsUpdated?: number;
    rolesCreated: number;
    rolesUpdated?: number;
    channelNames: string[];
    updatedChannelNames?: string[];
    roleNames: string[];
    updatedRoleNames?: string[];
  }>;
  onDeductCredits: (amount: number) => void;
  onGrantBonusCredits?: (amount: number) => void;
  onNavigateToServer: (serverId: string) => void;
}

function formatMmSs(totalSeconds: number): string {
  const clamped = Math.max(0, Math.min(MAX_AI_WAIT_SECONDS, Math.floor(totalSeconds)));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function compressImageFile(file: File): Promise<PendingImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const rawUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawUrl) {
        reject(new Error('Imagen vacía.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          dataUrl: rawUrl,
        });
      };
      img.onload = () => {
        const maxSide = 1280;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            mimeType: file.type || 'image/jpeg',
            dataUrl: rawUrl,
          });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.84);
        resolve({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: 'image/jpeg',
          dataUrl: compressedUrl,
        });
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const AiServerAssistantView: React.FC<AiServerAssistantViewProps> = ({
  user,
  servers,
  currentServerId,
  credits,
  isOwner = false,
  conversation,
  onUpdateConversation,
  onBack,
  onInviteBotToServer,
  onApplyBuildPlan,
  onDeductCredits,
  onGrantBonusCredits,
  onNavigateToServer,
}) => {
  const manageableServers = useMemo(
    () =>
      servers.filter(
        (srv) =>
          canManageServer(srv, user.id) ||
          srv.ownerId === 'me' ||
          srv.ownerId === 'guest' ||
          !srv.ownerId
      ),
    [servers, user.id]
  );

  const { chatMessages, buildMessages, selectedTargetId, mode } = conversation;
  const messages = mode === 'chat' ? chatMessages : buildMessages;

  const setMode = (nextMode: 'build' | 'chat') =>
    onUpdateConversation((prev) => ({ ...prev, mode: nextMode }));

  const setSelectedTargetId = (nextId: string) =>
    onUpdateConversation((prev) => ({ ...prev, selectedTargetId: nextId }));

  const setMessagesForMode = (
    targetMode: 'build' | 'chat',
    updater:
      | AiAssistantMessage[]
      | ((prevMsgs: AiAssistantMessage[]) => AiAssistantMessage[])
  ) =>
    onUpdateConversation((prev) => {
      if (targetMode === 'chat') {
        return {
          ...prev,
          chatMessages:
            typeof updater === 'function' ? updater(prev.chatMessages) : updater,
        };
      }
      return {
        ...prev,
        buildMessages:
          typeof updater === 'function' ? updater(prev.buildMessages) : updater,
      };
    });

  const [promptInput, setPromptInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<PendingImageAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [invitingBot, setInvitingBot] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [creditsPopoverOpen, setCreditsPopoverOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timedOutRef = useRef(false);
  const generationStartMsRef = useRef<number>(0);

  // Automatically pick the active server or first manageable server if none chosen yet or invalid
  useEffect(() => {
    if (selectedTargetId === '__new__') {
      // If user explicitly had __new__ only because they had 0 servers before, auto-select once a server exists
      if (messages.length === 0 && manageableServers.length > 0) {
        const preferred =
          currentServerId && manageableServers.some((s) => s.id === currentServerId)
            ? currentServerId
            : manageableServers[0].id;
        setSelectedTargetId(preferred);
      }
      return;
    }

    if (!selectedTargetId || !manageableServers.some((s) => s.id === selectedTargetId)) {
      const preferred =
        currentServerId && manageableServers.some((s) => s.id === currentServerId)
          ? currentServerId
          : manageableServers[0]?.id || '__new__';
      if (preferred !== selectedTargetId) {
        setSelectedTargetId(preferred);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageableServers, currentServerId, selectedTargetId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, mode]);

  // Live 15-minute (900s) maximum elapsed timer while the AI is working
  useEffect(() => {
    if (!isGenerating) {
      setElapsedSeconds(0);
      return;
    }

    generationStartMsRef.current = Date.now();
    setElapsedSeconds(0);
    timedOutRef.current = false;

    const tickInterval = window.setInterval(() => {
      const secs = Math.floor((Date.now() - generationStartMsRef.current) / 1000);
      if (secs >= MAX_AI_WAIT_SECONDS) {
        setElapsedSeconds(MAX_AI_WAIT_SECONDS);
        timedOutRef.current = true;
        abortControllerRef.current?.abort();
        window.clearInterval(tickInterval);
      } else {
        setElapsedSeconds(secs);
      }
    }, 1000);

    return () => {
      window.clearInterval(tickInterval);
    };
  }, [isGenerating]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const activeServer =
    selectedTargetId && selectedTargetId !== '__new__'
      ? manageableServers.find((s) => s.id === selectedTargetId) || null
      : null;

  const isBotInActiveServer = activeServer
    ? Boolean(activeServer.members?.some((m) => m.uid === AI_BUILDER_BOT_UID))
    : false;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopiedMsgId(id);
    window.setTimeout(() => setCopiedMsgId((prev) => (prev === id ? null : prev)), 2000);
  };

  const handleCancelGeneration = () => {
    timedOutRef.current = false;
    abortControllerRef.current?.abort();
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, MAX_ATTACHED_IMAGES - attachedImages.length);
    const chosen = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots);
    if (chosen.length === 0) return;

    const compressed = await Promise.all(
      chosen.map((f) => compressImageFile(f).catch(() => null))
    );
    const valid = compressed.filter((x): x is PendingImageAttachment => Boolean(x));
    if (valid.length > 0) {
      setAttachedImages((prev) => [...prev, ...valid].slice(0, MAX_ATTACHED_IMAGES));
    }
  };

  const handleToggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRec =
      (window as unknown as {
        SpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        };
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        };
      }).SpeechRecognition ||
      (window as unknown as {
        webkitSpeechRecognition?: new () => {
          lang: string;
          interimResults: boolean;
          onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
          onerror: () => void;
          onend: () => void;
          start: () => void;
          stop: () => void;
        };
      }).webkitSpeechRecognition;

    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setPromptInput((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleInviteBot = async () => {
    if (!activeServer || invitingBot) return;
    setInvitingBot(true);
    try {
      const ok = await onInviteBotToServer(activeServer.id);
      if (ok) {
        setMessagesForMode('build', (prev) => [
          ...prev,
          {
            id: `ai-join-${Date.now()}`,
            role: 'assistant',
            mode: 'build',
            content: `Listo: el bot oficial **Primordial Architect AI** ya entró a **${activeServer.name}**. Ahora puedes pedirme qué construir y aplicaré los canales, categorías y roles directamente dentro del servidor.`,
          },
        ]);
      }
    } finally {
      setInvitingBot(false);
    }
  };

  const handleSend = async (customPrompt?: string, overrideMode?: 'build' | 'chat') => {
    const activeMode = overrideMode || mode;
    const clean = (customPrompt ?? promptInput).trim();
    const imagesToSend = customPrompt ? [] : attachedImages;
    if ((!clean && imagesToSend.length === 0) || isGenerating) return;

    if (overrideMode && overrideMode !== mode) {
      setMode(overrideMode);
    }

    setModeMenuOpen(false);
    setServerMenuOpen(false);
    setCreditsPopoverOpen(false);

    if (activeMode === 'build') {
      if (activeServer && !isBotInActiveServer) {
        setMessagesForMode('build', (prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            mode: 'build',
            content: clean || 'Analizar imágenes y construir servidor',
            images: imagesToSend.map((img) => img.dataUrl),
          },
          {
            id: `bot-gate-${Date.now()}`,
            role: 'assistant',
            mode: 'build',
            content: `Antes de construir en **${activeServer.name}**, el bot oficial debe entrar al servidor. Pulsa **"Meter Bot oficial al server"** y luego vuelve a enviar tu orden (no se gastaron créditos).`,
          },
        ]);
        if (!customPrompt) {
          setPromptInput('');
          setAttachedImages([]);
        }
        return;
      }

      if (credits < AI_BUILD_CREDIT_COST) {
        setMessagesForMode('build', (prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            mode: 'build',
            content: clean || 'Construcción con imágenes',
            images: imagesToSend.map((img) => img.dataUrl),
          },
          {
            id: `no-credits-${Date.now()}`,
            role: 'assistant',
            mode: 'build',
            error: true,
            content: `Necesitas **${AI_BUILD_CREDIT_COST} créditos** para usar el modo **Construir** (tienes ${credits}). Puedes cambiar al modo **Chat (Gratis)** para generar prompts de texto sin gastar créditos.`,
          },
        ]);
        return;
      }
    }

    const modeHistorySource =
      activeMode === 'chat' ? conversation.chatMessages : conversation.buildMessages;

    const userMsg: AiAssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      mode: activeMode,
      content: clean || (imagesToSend.length > 0 ? 'Analiza estas imágenes.' : ''),
      images: imagesToSend.length > 0 ? imagesToSend.map((img) => img.dataUrl) : undefined,
    };
    setMessagesForMode(activeMode, (prev) => [...prev, userMsg]);
    if (!customPrompt) {
      setPromptInput('');
      setAttachedImages([]);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const hardTimeoutId = window.setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
    }, MAX_AI_WAIT_SECONDS * 1000);

    const requestStartMs = Date.now();
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/server-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode: activeMode,
          prompt: clean,
          images: imagesToSend.map((img) => ({
            mimeType: img.mimeType,
            data: img.dataUrl,
          })),
          history: modeHistorySource.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          serverContext: activeServer
            ? {
                name: activeServer.name,
                description: activeServer.description,
                existingChannels: activeServer.channels.map((c) => ({
                  name: c.name,
                  type: c.type,
                  category: c.category,
                })),
                existingRoles: (activeServer.roles || []).map((r) => ({ name: r.name })),
              }
            : { name: 'Nuevo Servidor con IA' },
        }),
      });

      const rawText = await response.text();
      type AiApiPayload = {
        error?: string;
        reply?: string;
        suggestedBuildPrompt?: string;
        plan?: AiServerBuildPlan;
      };
      const parseAiPayload = (text: string): AiApiPayload | null => {
        if (!text) return null;
        try {
          const parsed: unknown = JSON.parse(text);
          if (parsed && typeof parsed === 'object') {
            return parsed as AiApiPayload;
          }
          return null;
        } catch {
          return null;
        }
      };
      const data = parseAiPayload(rawText);

      if (!data) {
        throw new Error(
          `El servidor devolvió una respuesta no válida (HTTP ${response.status}). Intenta de nuevo en unos segundos; no se descontaron créditos.`
        );
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'No se pudo completar la respuesta de la IA.');
      }

      const finalElapsed = Math.max(1, Math.round((Date.now() - requestStartMs) / 1000));

      if (activeMode === 'chat') {
        setMessagesForMode('chat', (prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            mode: 'chat',
            content: data.reply || 'Aquí tienes la propuesta.',
            suggestedBuildPrompt: data.suggestedBuildPrompt,
            creditsSpent: 0,
            elapsedSeconds: finalElapsed,
          },
        ]);
      } else {
        const plan = data.plan as AiServerBuildPlan;
        const result = await onApplyBuildPlan(
          activeServer ? activeServer.id : null,
          plan,
          clean || 'Construcción desde imagen'
        );
        onDeductCredits(AI_BUILD_CREDIT_COST);
        if (!activeServer && result.serverId) {
          setSelectedTargetId(result.serverId);
        }

        const totalElapsed = Math.max(1, Math.round((Date.now() - requestStartMs) / 1000));
        setMessagesForMode('build', (prev) => [
          ...prev,
          {
            id: `ai-build-${Date.now()}`,
            role: 'assistant',
            mode: 'build',
            content: plan.summary || `Construcción aplicada en ${result.serverName}.`,
            creditsSpent: AI_BUILD_CREDIT_COST,
            elapsedSeconds: totalElapsed,
            buildResult: result,
          },
        ]);
      }
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const errMsg = isAbort
        ? timedOutRef.current
          ? 'La solicitud excedió el tiempo de espera. No se descontaron créditos.'
          : 'Operación cancelada por el usuario. No se descontaron créditos.'
        : err instanceof Error
        ? err.message
        : 'Ocurrió un error procesando tu solicitud.';

      setMessagesForMode(activeMode, (prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          mode: activeMode,
          error: true,
          content: errMsg,
        },
      ]);
    } finally {
      window.clearTimeout(hardTimeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full overflow-hidden bg-[#000000] text-white select-none">
      {/* Hidden multi-image picker for + button */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          void handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Pure Black Top & Upper Canvas + Bottom-Only Dark-Purple & Pink Colliding Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%]"
        style={{
          background:
            'radial-gradient(85% 95% at 24% 100%, rgba(109, 40, 217, 0.72) 0%, rgba(59, 7, 100, 0.55) 45%, transparent 82%), radial-gradient(85% 95% at 78% 100%, rgba(236, 72, 153, 0.62) 0%, rgba(168, 85, 247, 0.45) 42%, transparent 80%)',
        }}
      />

      {/* Top Bar INSIDE the AI option: Server Picker + Clear Chat + Credits (ONLY visible inside this option) */}
      <header className="relative z-30 h-14 px-3 sm:px-5 flex items-center justify-between gap-2 shrink-0 border-b border-white/10 bg-[#000000]/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="min-w-[40px] min-h-[40px] rounded-full bg-white/[0.07] hover:bg-purple-500/25 border border-purple-300/15 flex items-center justify-center text-white cursor-pointer shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Target Server Selector Pill */}
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => {
                setServerMenuOpen((v) => !v);
                setCreditsPopoverOpen(false);
                setModeMenuOpen(false);
              }}
              className="h-10 pl-1.5 pr-3 rounded-full bg-[#160d2e]/90 hover:bg-[#221445] border border-purple-300/20 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white cursor-pointer max-w-[205px] sm:max-w-[280px] transition-colors"
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow"
                style={{
                  background:
                    activeServer?.accentColor || 'linear-gradient(135deg, #4c1d95, #c084fc)',
                }}
              >
                {activeServer ? activeServer.shortCode.slice(0, 2) : 'IA'}
              </span>
              <span className="truncate">
                {activeServer ? activeServer.name : 'Nuevo servidor con IA'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-200/75 shrink-0" />
            </button>

            {serverMenuOpen && (
              <div className="absolute left-0 top-12 w-72 rounded-2xl bg-[#160e2c]/98 backdrop-blur-xl border border-purple-300/20 shadow-2xl p-1.5 z-50 space-y-1">
                <p className="px-2.5 py-1 text-[11px] font-semibold text-purple-200/75">
                  Servidor destino
                </p>
                {manageableServers.map((srv) => {
                  const hasBot = Boolean(srv.members?.some((m) => m.uid === AI_BUILDER_BOT_UID));
                  const isSel = selectedTargetId === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        setSelectedTargetId(srv.id);
                        setServerMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-purple-500/25 text-white border border-purple-300/25'
                          : 'hover:bg-white/[0.06] text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: srv.accentColor || '#7c3aed' }}
                        >
                          {srv.shortCode.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{srv.name}</p>
                          <p className="text-[10.5px] text-purple-200/70 truncate">
                            {hasBot ? 'Bot oficial conectado' : 'Falta meter al Bot oficial'}
                          </p>
                        </div>
                      </div>
                      {isSel && <Check className="w-4 h-4 text-[#d8b4fe] shrink-0" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTargetId('__new__');
                    setServerMenuOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left cursor-pointer border-t border-purple-300/15 mt-1 pt-2 ${
                    selectedTargetId === '__new__'
                      ? 'bg-purple-500/25 text-white'
                      : 'hover:bg-white/[0.06] text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/25 border border-purple-300/40 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-[#d8b4fe]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">Crear servidor nuevo con IA</p>
                      <p className="text-[10.5px] text-purple-200/70">
                        El Bot oficial entra automáticamente
                      </p>
                    </div>
                  </div>
                  {selectedTargetId === '__new__' && (
                    <Check className="w-4 h-4 text-[#d8b4fe] shrink-0" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 0 && !isGenerating && (
            <button
              type="button"
              onClick={() => setMessagesForMode(mode, [])}
              title="Nueva conversación"
              className="h-10 px-3 rounded-full bg-[#160d2e]/90 hover:bg-[#221445] border border-purple-300/20 flex items-center gap-1.5 text-xs font-semibold text-purple-100 cursor-pointer transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#c084fc]" />
              <span className="hidden sm:inline">Nueva charla</span>
            </button>
          )}

          {/* Credits Counter Pill — strictly ONLY inside this AI Assistant view */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setCreditsPopoverOpen((v) => !v);
                setServerMenuOpen(false);
                setModeMenuOpen(false);
              }}
              className="h-10 px-3.5 rounded-full bg-[#160d2e]/90 hover:bg-[#221445] border border-purple-300/25 flex items-center gap-1.5 text-xs font-bold text-white tabular-nums cursor-pointer shadow-lg transition-colors whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-[#e9d5ff] fill-[#c084fc] shrink-0" />
              <span>{credits.toLocaleString('es-ES')}</span>
              <span className="text-purple-200 font-semibold hidden sm:inline">créditos</span>
            </button>

            {creditsPopoverOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-2xl bg-[#160e2c]/98 backdrop-blur-xl border border-purple-300/20 shadow-2xl p-3.5 z-50 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Tus créditos de IA</span>
                  <span className="font-extrabold text-[#d8b4fe] tabular-nums">
                    {credits.toLocaleString('es-ES')}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11.5px] text-purple-100/85 border-t border-purple-300/15 pt-2">
                  <p className="flex items-center justify-between">
                    <span>Modo Construir</span>
                    <span className="font-bold text-white tabular-nums">
                      {AI_BUILD_CREDIT_COST} créditos
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Modo Chat (prompts/texto)</span>
                    <span className="font-bold text-[#d8b4fe]">Gratis (0)</span>
                  </p>
                </div>
                {isOwner && onGrantBonusCredits && (
                  <button
                    type="button"
                    onClick={() => onGrantBonusCredits(100)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#a855f7] hover:from-[#5b21b6] hover:to-[#9333ea] text-white font-bold text-[11.5px] cursor-pointer"
                  >
                    +100 créditos (Owner)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Clean Hero or Isolated Mode Conversation + Official Bot Join Gate */}
      <div
        ref={scrollRef}
        onClick={() => {
          setServerMenuOpen(false);
          setModeMenuOpen(false);
          setCreditsPopoverOpen(false);
        }}
        className="relative z-10 flex-1 overflow-y-auto px-4 pb-4 flex flex-col"
      >
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          {/* Always-visible Official Bot Status Bar when an existing server is selected */}
          {activeServer && (
            <div className="mt-3 mb-2 rounded-2xl bg-[#150c2b]/90 backdrop-blur-xl border border-purple-300/20 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <PrimordialAppIcon className="w-9 h-9 rounded-xl shrink-0 border border-purple-300/30 shadow" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-[13px] font-bold text-white truncate">
                    {isBotInActiveServer
                      ? `Bot oficial conectado en ${activeServer.name}`
                      : `Meter Bot oficial de Primordial en ${activeServer.name}`}
                  </p>
                  <p className="text-[11px] text-purple-200/80 leading-snug">
                    {isBotInActiveServer
                      ? `${activeServer.channels.length} canales activos · Listo para construir automáticamente`
                      : 'Necesitas meter al bot oficial de la app para poder construir canales y roles dentro.'}
                  </p>
                </div>
              </div>
              {isBotInActiveServer ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-300/30 text-[#e9d5ff] text-[11.5px] font-bold shrink-0 whitespace-nowrap self-start sm:self-auto">
                  <Check className="w-3.5 h-3.5 text-[#c084fc]" />
                  <span>Bot dentro</span>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={invitingBot}
                  onClick={() => void handleInviteBot()}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#a855f7] hover:from-[#5b21b6] hover:to-[#9333ea] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{invitingBot ? 'Entrando...' : 'Meter Bot oficial al server'}</span>
                </button>
              )}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="py-8 space-y-4 my-auto">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-300/35 shadow-xl mx-auto">
                  <PrimordialAppIcon className="w-10 h-10 rounded-xl" />
                </div>
                <h1
                  className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight px-2"
                  style={{ textWrap: 'balance' }}
                >
                  Construyamos tu servidor, {user.displayName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
                  {mode === 'chat'
                    ? 'Modo Chat gratis: pide prompts, reglas o analiza imágenes sin gastar ni un crédito.'
                    : activeServer
                    ? isBotInActiveServer
                      ? `Servidor destino listo: ${activeServer.name}. Pide crear canales, categorías, roles o poner emojis a tus canales existentes.`
                      : `Pulsa "Meter Bot oficial al server" arriba para habilitar la construcción en ${activeServer.name}.`
                    : 'Se creará un servidor nuevo completo con el Bot oficial de Primordial adentro.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-3 space-y-3.5 w-full">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed select-text ${
                        isUser
                          ? 'bg-gradient-to-br from-[#4c1d95]/90 to-[#6d28d9]/85 border border-purple-300/25 text-white shadow-lg'
                          : msg.error
                          ? 'bg-red-950/75 border border-red-400/30 text-red-100'
                          : 'bg-[#140c29]/92 backdrop-blur-md border border-purple-300/18 text-zinc-100 shadow-lg'
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-100/90">
                            <Bot className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                            <span>Primordial Architect AI</span>
                            <span aria-hidden="true" className="text-purple-300/40">
                              ·
                            </span>
                            <span
                              className={
                                msg.mode === 'chat' ? 'text-[#d8b4fe]' : 'text-amber-300'
                              }
                            >
                              {msg.mode === 'chat' ? 'Chat Gratis' : 'Construir'}
                            </span>
                            {typeof msg.elapsedSeconds === 'number' && (
                              <>
                                <span aria-hidden="true" className="text-purple-300/40">
                                  ·
                                </span>
                                <span className="font-mono text-purple-200/70 tabular-nums">
                                  {formatMmSs(msg.elapsedSeconds)}
                                </span>
                              </>
                            )}
                          </div>
                          {typeof msg.creditsSpent === 'number' && msg.creditsSpent > 0 && (
                            <span className="text-[10.5px] font-bold text-amber-300 tabular-nums shrink-0">
                              -{msg.creditsSpent} créditos
                            </span>
                          )}
                        </div>
                      )}

                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.images.map((src, idx) => (
                            <img
                              key={`${msg.id}-img-${idx}`}
                              src={src}
                              alt={`Adjunto ${idx + 1}`}
                              className="w-24 h-24 object-cover rounded-xl border border-white/20"
                            />
                          ))}
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words text-[13.5px]">
                        {msg.content}
                      </p>

                      {msg.id.startsWith('bot-gate-') && activeServer && !isBotInActiveServer && (
                        <div className="mt-3 pt-2.5 border-t border-purple-300/15">
                          <button
                            type="button"
                            disabled={invitingBot}
                            onClick={() => void handleInviteBot()}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#a855f7] hover:from-[#5b21b6] hover:to-[#9333ea] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>
                              {invitingBot ? 'Entrando...' : 'Meter Bot oficial al server'}
                            </span>
                          </button>
                        </div>
                      )}

                      {msg.buildResult && (
                        <div className="mt-3 pt-3 border-t border-purple-300/15 space-y-2.5">
                          <div className="flex flex-wrap gap-3 text-[11.5px] text-purple-100/85 tabular-nums">
                            {msg.buildResult.channelsCreated > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5 text-[#c084fc]" />
                                {msg.buildResult.channelsCreated} nuevos
                              </span>
                            )}
                            {(msg.buildResult.channelsUpdated ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Wand2 className="w-3.5 h-3.5 text-[#ec4899]" />
                                {msg.buildResult.channelsUpdated} editados
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-[#d8b4fe]" />
                              {msg.buildResult.rolesCreated} roles
                              {(msg.buildResult.rolesUpdated ?? 0) > 0
                                ? ` · ${msg.buildResult.rolesUpdated} editados`
                                : ''}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                              Bot oficial dentro
                            </span>
                          </div>
                          {msg.buildResult.channelNames.length > 0 && (
                            <p className="text-[11.5px] text-purple-200/75">
                              Canales creados: {msg.buildResult.channelNames.join(', ')}
                            </p>
                          )}
                          {msg.buildResult.updatedChannelNames &&
                            msg.buildResult.updatedChannelNames.length > 0 && (
                              <p className="text-[11.5px] text-pink-200/85">
                                Canales actualizados:{' '}
                                {msg.buildResult.updatedChannelNames.join(', ')}
                              </p>
                            )}
                          {msg.buildResult.roleNames && msg.buildResult.roleNames.length > 0 && (
                            <p className="text-[11.5px] text-purple-200/85">
                              Roles creados: {msg.buildResult.roleNames.join(', ')}
                            </p>
                          )}
                          {msg.buildResult.updatedRoleNames &&
                            msg.buildResult.updatedRoleNames.length > 0 && (
                              <p className="text-[11.5px] text-pink-200/85">
                                Roles actualizados: {msg.buildResult.updatedRoleNames.join(', ')}
                              </p>
                            )}
                          <button
                            type="button"
                            onClick={() => onNavigateToServer(msg.buildResult!.serverId)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6d28d9] to-[#a855f7] hover:from-[#5b21b6] hover:to-[#9333ea] text-white text-xs font-bold cursor-pointer transition-all shadow-md"
                          >
                            Abrir {msg.buildResult.serverName}
                          </button>
                        </div>
                      )}

                      {!isUser && !msg.error && msg.mode === 'chat' && (
                        <div className="mt-2.5 pt-2 border-t border-purple-300/15 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-[11px] font-semibold text-zinc-100 cursor-pointer whitespace-nowrap"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-[#c084fc]" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar texto</span>
                              </>
                            )}
                          </button>
                          {msg.suggestedBuildPrompt && (
                            <button
                              type="button"
                              onClick={() => {
                                setMode('build');
                                setPromptInput(msg.suggestedBuildPrompt || '');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/25 hover:bg-purple-500/40 border border-purple-300/35 text-[11px] font-semibold text-white cursor-pointer whitespace-nowrap"
                            >
                              <Wand2 className="w-3 h-3" />
                              <span>Usar en Construir</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Compact Inline Timer Next to Pending Message Bubble */}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2.5 rounded-2xl bg-[#140c29]/95 border border-purple-400/35 px-3.5 py-2.5 text-xs text-zinc-100 shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-[#c084fc] shrink-0" />
                    <span className="font-semibold text-white">
                      {mode === 'build' ? 'Construyendo...' : 'Respondiendo...'}
                    </span>
                    <span className="font-mono text-[11.5px] text-purple-200/85 tabular-nums">
                      {formatMmSs(elapsedSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelGeneration}
                      aria-label="Cancelar"
                      className="w-6 h-6 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-zinc-200 flex items-center justify-center cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Dark-Purple Prompt Composer */}
      <div className="relative z-30 px-3 sm:px-6 pb-5 pt-1 shrink-0">
        <div className="max-w-3xl mx-auto relative">

          {/* Mode Dropdown Menu (Construir & Chat ONLY — NO Plan option) */}
          {modeMenuOpen && (
            <div className="absolute right-8 bottom-full mb-2 w-72 rounded-2xl bg-[#160e2c]/98 backdrop-blur-xl border border-purple-300/20 shadow-2xl p-1.5 z-50 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setMode('build');
                  setModeMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                  mode === 'build' ? 'bg-purple-500/20' : 'hover:bg-white/[0.05]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Construir</span>
                    <span className="text-[11px] font-semibold text-amber-300 tabular-nums">
                      {AI_BUILD_CREDIT_COST} créditos
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/75 mt-0.5">
                    El bot construye canales y roles en tu server
                  </p>
                </div>
                {mode === 'build' && <Check className="w-4 h-4 text-[#d8b4fe] shrink-0 mt-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('chat');
                  setModeMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                  mode === 'chat' ? 'bg-purple-500/20' : 'hover:bg-white/[0.05]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Chat</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6d28d9] to-[#a855f7] text-white text-[10.5px] font-bold">
                      Gratis
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/75 mt-0.5">
                    Crea prompts de texto e ideas sin gastar créditos
                  </p>
                </div>
                {mode === 'chat' && <Check className="w-4 h-4 text-[#d8b4fe] shrink-0 mt-0.5" />}
              </button>
            </div>
          )}

          <div className="rounded-[26px] bg-[#140c29]/92 backdrop-blur-2xl border border-purple-300/25 shadow-[0_20px_50px_rgba(17,5,38,0.75)] px-4 pt-3.5 pb-2.5">
            {/* Attached Images Preview Strip */}
            {attachedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2.5 mb-2 border-b border-purple-300/15">
                {attachedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-purple-300/35 shrink-0 group"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar ${img.name}`}
                      onClick={() =>
                        setAttachedImages((prev) => prev.filter((item) => item.id !== img.id))
                      }
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                mode === 'build'
                  ? 'Describe el servidor que quieres construir o sube imágenes en +...'
                  : 'Pide un prompt, reglas o analiza imágenes gratis...'
              }
              className="w-full bg-transparent text-sm sm:text-[15px] text-white placeholder:text-purple-200/50 focus:outline-none resize-none max-h-36 leading-relaxed"
            />

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                disabled={attachedImages.length >= MAX_ATTACHED_IMAGES}
                onClick={(e) => {
                  e.stopPropagation();
                  imageInputRef.current?.click();
                }}
                aria-label="Agregar imágenes"
                title="Agregar imágenes"
                className="min-w-[40px] min-h-[40px] rounded-full hover:bg-purple-400/15 text-purple-100 flex items-center justify-center cursor-pointer disabled:opacity-45 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModeMenuOpen((v) => !v);
                  }}
                  className="h-10 px-3 rounded-full hover:bg-purple-400/15 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>{mode === 'build' ? 'Construir' : 'Chat'}</span>
                  {mode === 'chat' && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#6d28d9] to-[#a855f7] text-white text-[10px] font-bold leading-none">
                      Gratis
                    </span>
                  )}
                  {modeMenuOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-purple-200/75" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-purple-200/75" />
                  )}
                </button>

                {promptInput.trim() || attachedImages.length > 0 ? (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => void handleSend()}
                    aria-label="Enviar"
                    className="min-w-[40px] min-h-[40px] rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] text-white hover:from-[#6d28d9] hover:to-[#a855f7] flex items-center justify-center cursor-pointer disabled:opacity-50 transition-all shadow-lg"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    aria-label={isListening ? 'Detener dictado' : 'Dictar por voz'}
                    className={`min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white'
                        : 'hover:bg-purple-400/15 text-purple-100'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
