import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { AvatarKey, StoredAccount } from '../types/discord';
import { PrimordialAppIcon, UserAvatar } from './DiscordArt';
import { RESERVED_OWNER_USERNAME } from '../utils/ownerAccess';

export interface CloudLoginResult {
  ok: boolean;
  errorReason?: string;
  errorMessage?: string;
}

interface AuthViewProps {
  accounts: StoredAccount[];
  onLoginAccount: (account: StoredAccount) => void;
  onCloudLogin?: (
    identifier: string,
    password: string,
    extraEmails?: string[]
  ) => Promise<CloudLoginResult | boolean>;
  onRegisterAccount: (payload: {
    contact: string;
    contactType: 'phone' | 'email';
    displayName: string;
    username: string;
    password: string;
    avatar: AvatarKey;
    twoFactorEnabled?: boolean;
    backupCodes?: string[];
  }) => void;
  onResetPassword?: (accountId: string, newPassword: string) => void;
}

type AuthStep =
  | 'welcome'
  | 'login'
  | 'two-factor'
  | 'recovery'
  | 'register-contact'
  | 'register-profile';

type LoginMethod = 'password' | 'qr' | 'biometric';
type TwoFactorTab = 'totp' | 'push' | 'backup';

const TRUSTED_DEVICE_PREFIX = 'primordial_trusted_device_';

const COUNTRY_CODES = [
  { code: 'VE', dial: '+58', label: 'Venezuela (+58)' },
  { code: 'ES', dial: '+34', label: 'España (+34)' },
  { code: 'MX', dial: '+52', label: 'México (+52)' },
  { code: 'CO', dial: '+57', label: 'Colombia (+57)' },
  { code: 'AR', dial: '+54', label: 'Argentina (+54)' },
  { code: 'CL', dial: '+56', label: 'Chile (+56)' },
  { code: 'US', dial: '+1', label: 'Estados Unidos (+1)' },
];

const AVATAR_CHOICES: { id: AvatarKey; label: string }[] = [
  { id: 'discord-blurple', label: 'Azul Discord' },
  { id: 'discord-green', label: 'Verde Discord' },
  { id: 'discord-yellow', label: 'Amarillo Discord' },
  { id: 'discord-red', label: 'Rojo Discord' },
  { id: 'discord-pink', label: 'Rosa Nitro' },
  { id: 'discord-cyan', label: 'Celeste Discord' },
];

const SECURITY_CHALLENGES = [
  { prompt: 'Selecciona el escudo para confirmar acceso humano', target: 'shield' as const },
  { prompt: 'Selecciona el candado cifrado para continuar', target: 'lock' as const },
  { prompt: 'Selecciona la llave de seguridad para verificar', target: 'key' as const },
];

function evaluatePasswordStrength(pwd: string): {
  score: number;
  label: string;
  color: string;
  tips: string[];
} {
  let score = 0;
  const tips: string[] = [];
  if (pwd.length >= 8) score += 1;
  else tips.push('Mínimo 8 caracteres');
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  else tips.push('Mayúsculas y minúsculas');
  if (/\d/.test(pwd)) score += 1;
  else tips.push('Al menos un número');
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  else tips.push('Un símbolo (!@#$...)');

  if (!pwd) return { score: 0, label: 'Sin contraseña', color: 'bg-zinc-700', tips };
  if (score <= 1) return { score: 1, label: 'Débil', color: 'bg-red-500', tips };
  if (score === 2) return { score: 2, label: 'Media', color: 'bg-amber-500', tips };
  if (score === 3) return { score: 3, label: 'Fuerte', color: 'bg-emerald-500', tips };
  return { score: 4, label: 'Muy segura', color: 'bg-[#5865F2]', tips };
}

function generateBackupCodes(): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 3 }, () => {
    const seg1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const seg2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `PRM-${seg1}-${seg2}`;
  });
}

function computeTotpCode(seed: string, windowStep: number): string {
  let hash = 2166136261;
  const input = `${seed}:${windowStep}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = Math.abs(hash) % 1000000;
  return num.toString().padStart(6, '0');
}

function buildQrMatrix(token: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let h = 5381;
  for (let i = 0; i < token.length; i += 1) {
    h = ((h << 5) + h) ^ token.charCodeAt(i);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inCenterLogo = r >= 8 && r <= 12 && c >= 8 && c <= 12;
      if (inTopLeft || inTopRight || inBottomLeft || inCenterLogo) continue;
      const bit = Math.abs(Math.imul(h ^ (r * 31 + c * 17), 2654435761)) % 11;
      grid[r][c] = bit < 5;
    }
  }

  return grid;
}

const LoginDragonMascot: React.FC<{ triggerKey: number }> = ({ triggerKey }) => {
  const [visible, setVisible] = useState(true);
  const [winking, setWinking] = useState(false);

  useEffect(() => {
    setVisible(true);
    setWinking(false);
    const winkStart = window.setTimeout(() => setWinking(true), 1100);
    const winkEnd = window.setTimeout(() => setWinking(false), 2450);
    const hideTimer = window.setTimeout(() => setVisible(false), 4500);
    return () => {
      window.clearTimeout(winkStart);
      window.clearTimeout(winkEnd);
      window.clearTimeout(hideTimer);
    };
  }, [triggerKey]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`login-dragon-${triggerKey}`}
          initial={{ y: 260, opacity: 0, scale: 0.92 }}
          animate={{
            y: [260, 0, -4, 0, 270],
            opacity: [0, 1, 1, 1, 0],
            scale: [0.92, 1, 1.02, 1, 0.9],
          }}
          exit={{ y: 280, opacity: 0 }}
          transition={{
            duration: 4.35,
            times: [0, 0.22, 0.52, 0.78, 1],
            ease: 'easeInOut',
          }}
          aria-hidden="true"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 lg:left-24 lg:translate-x-0 z-40 pointer-events-none select-none flex flex-col items-center"
        >
          {/* Floor Magic Mist */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.25, 1.05, 0.6], opacity: [0, 0.75, 0.55, 0] }}
            transition={{ duration: 4.1, times: [0, 0.22, 0.75, 1] }}
            className="absolute -bottom-2 w-60 h-12 rounded-full bg-purple-950/35 blur-xl"
          />

          <motion.div
            animate={winking ? { rotate: [0, -3, 1.5, 0] } : { rotate: 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            className="relative w-52 h-52 sm:w-64 sm:h-64 drop-shadow-[0_18px_28px_rgba(36,12,78,0.45)]"
          >
            {/* Golden Wink Sparkle */}
            <AnimatePresence>
              {winking && (
                <motion.svg
                  initial={{ scale: 0, opacity: 0, rotate: -20 }}
                  animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0.9], rotate: [0, 15, 0] }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  viewBox="0 0 36 36"
                  className="absolute right-6 top-14 w-9 h-9 z-20 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]"
                >
                  <path
                    d="M18 2 L21.5 14.5 L34 18 L21.5 21.5 L18 34 L14.5 21.5 L2 18 L14.5 14.5 Z"
                    fill="#fde047"
                  />
                </motion.svg>
              )}
            </AnimatePresence>

            <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="dragonBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7e22ce" />
                  <stop offset="55%" stopColor="#581c87" />
                  <stop offset="100%" stopColor="#311053" />
                </linearGradient>
                <linearGradient id="dragonBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f5d0fe" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="dragonHornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Wings */}
              <path
                d="M54 148 Q16 106 24 72 Q46 98 62 114 Q74 96 86 132 Z"
                fill="#4c1d95"
                stroke="#2e1065"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M186 148 Q224 106 216 72 Q194 98 178 114 Q166 96 154 132 Z"
                fill="#4c1d95"
                stroke="#2e1065"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Torso rising from floor */}
              <path
                d="M66 238 C64 176 76 144 120 144 C164 144 176 176 174 238 Z"
                fill="url(#dragonBodyGrad)"
                stroke="#240a47"
                strokeWidth="3.5"
              />
              <path
                d="M92 238 C92 184 100 156 120 156 C140 156 148 184 148 238 Z"
                fill="url(#dragonBellyGrad)"
              />
              <path d="M98 182 Q120 189 142 182" stroke="#9333ea" strokeWidth="2.5" fill="none" />
              <path d="M95 204 Q120 212 145 204" stroke="#9333ea" strokeWidth="2.5" fill="none" />

              {/* Curved Horns */}
              <path
                d="M84 68 Q60 28 74 14 Q90 36 98 60 Z"
                fill="url(#dragonHornGrad)"
                stroke="#78350f"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M156 68 Q180 28 166 14 Q150 36 142 60 Z"
                fill="url(#dragonHornGrad)"
                stroke="#78350f"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Ear Fin Spikes */}
              <path
                d="M62 96 Q36 86 42 70 Q58 76 72 86 Z"
                fill="#a855f7"
                stroke="#2e1065"
                strokeWidth="2.5"
              />
              <path
                d="M178 96 Q204 86 198 70 Q182 76 168 86 Z"
                fill="#a855f7"
                stroke="#2e1065"
                strokeWidth="2.5"
              />

              {/* Dragon Head */}
              <ellipse
                cx="120"
                cy="104"
                rx="56"
                ry="48"
                fill="url(#dragonBodyGrad)"
                stroke="#240a47"
                strokeWidth="3.5"
              />

              {/* Forehead Crest */}
              <path d="M112 58 L120 42 L128 58 Z" fill="#facc15" />

              {/* Snout */}
              <ellipse
                cx="120"
                cy="126"
                rx="40"
                ry="26"
                fill="#7e22ce"
                stroke="#240a47"
                strokeWidth="3"
              />

              {/* Cute Nostrils + Little Smoke Puff */}
              <circle cx="104" cy="118" r="3.4" fill="#1e0638" />
              <circle cx="136" cy="118" r="3.4" fill="#1e0638" />
              <motion.circle
                cx="148"
                cy="110"
                r="4"
                fill="#f5d0fe"
                animate={{ cy: [112, 92], opacity: [0, 0.75, 0], scale: [0.6, 1.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Playful Smile + Fang */}
              <path
                d="M96 133 Q120 147 144 133"
                fill="none"
                stroke="#fde047"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <polygon points="105,137 110,145 114,138" fill="#ffffff" />

              {/* Left Eye (Always bright & friendly open) */}
              <g>
                <ellipse cx="95" cy="93" rx="12" ry="13.5" fill="#fffbeb" stroke="#1e0638" strokeWidth="2.5" />
                <ellipse cx="96" cy="93" rx="6.5" ry="9" fill="#f59e0b" />
                <ellipse cx="96" cy="93" rx="2.8" ry="6.5" fill="#180828" />
                <circle cx="92.5" cy="88" r="2.6" fill="#ffffff" />
              </g>

              {/* Right Eye (Winks smoothly!) */}
              {winking ? (
                <g>
                  <path
                    d="M132 95 Q145 83 158 95"
                    fill="none"
                    stroke="#fde047"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M135 98 Q145 91 155 98"
                    fill="none"
                    stroke="#f5d0fe"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                <g>
                  <ellipse cx="145" cy="93" rx="12" ry="13.5" fill="#fffbeb" stroke="#1e0638" strokeWidth="2.5" />
                  <ellipse cx="144" cy="93" rx="6.5" ry="9" fill="#f59e0b" />
                  <ellipse cx="144" cy="93" rx="2.8" ry="6.5" fill="#180828" />
                  <circle cx="141" cy="88" r="2.6" fill="#ffffff" />
                </g>
              )}

              {/* Claws gripping bottom edge */}
              <g fill="#f3e8ff" stroke="#240a47" strokeWidth="2.5">
                <ellipse cx="74" cy="228" rx="14" ry="9" />
                <ellipse cx="166" cy="228" rx="14" ry="9" />
              </g>
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const AuthEditorialShowcase: React.FC = () => (
  <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#d8c8ff] via-[#b89cff] to-[#9b74f7] border-r border-white/30">
    {/* Atmospheric Light Purple Highlights */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-white/35 blur-[120px]" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[420px] h-[420px] rounded-full bg-[#7c3aed]/25 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(rgba(39,14,82,0.45) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
    </div>

    <div className="relative z-10 flex items-center gap-3.5">
      <PrimordialAppIcon className="w-11 h-11 rounded-2xl border border-white/40 shadow-lg" />
      <span className="font-display font-extrabold text-xl tracking-tight text-[#1e0f42]">
        Primordial
      </span>
    </div>

    <div className="relative z-10 max-w-xl space-y-6 my-auto py-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#3b1d7a]">
        Mensajería · Comunidades · Coleccionables
      </p>
      <h2
        className="font-display font-black text-4xl xl:text-5xl tracking-tight leading-[1.06] text-[#1a0d38]"
        style={{ textWrap: 'balance' }}
      >
        Tu espacio privado, sincronizado en cualquier dispositivo.
      </h2>
      <p className="text-base text-[#2b175c] font-medium leading-relaxed max-w-md">
        Conecta al instante con personas reales, comparte pantalla en alta calidad y conserva tu inventario y amigos en la nube sin depender de cuentas externas.
      </p>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#3b1d7a]/20">
        <div>
          <p className="font-display font-bold text-lg text-[#1a0d38]">Tiempo real</p>
          <p className="text-xs text-[#2f1a63] mt-0.5">Chats y solicitudes al instante</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[#1a0d38]">Multidispositivo</p>
          <p className="text-xs text-[#2f1a63] mt-0.5">Tu cuenta y objetos contigo</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[#1a0d38]">Tienda Exclusiva</p>
          <p className="text-xs text-[#2f1a63] mt-0.5">Placas, efectos y marcos</p>
        </div>
      </div>
    </div>

    <div className="relative z-10 text-xs font-semibold text-[#311b66]">
      Primordial Web &amp; Mobile · Acceso directo por usuario, correo o teléfono
    </div>
  </div>
);

export const AuthView: React.FC<AuthViewProps> = ({
  accounts,
  onLoginAccount,
  onCloudLogin,
  onRegisterAccount,
  onResetPassword,
}) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [dragonPlayKey, setDragonPlayKey] = useState(1);
  const [cloudLoginPending, setCloudLoginPending] = useState(false);

  // Login state
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);

  // Brute-force / anti-bot shield state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [challengeSolved, setChallengeSolved] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);

  // QR login state
  const [qrNonce, setQrNonce] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [qrCountdown, setQrCountdown] = useState(120);
  const [qrState, setQrState] = useState<'ready' | 'scanned' | 'approved'>('ready');

  // Biometric / WebAuthn state
  const [bioState, setBioState] = useState<'idle' | 'scanning' | 'verified' | 'error'>('idle');
  const [bioStatusText, setBioStatusText] = useState<string | null>(null);

  // 2FA verification state
  const [pendingAccount, setPendingAccount] = useState<StoredAccount | null>(null);
  const [twoFactorTab, setTwoFactorTab] = useState<TwoFactorTab>('totp');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [backupInput, setBackupInput] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [showTotpHelper, setShowTotpHelper] = useState(false);
  const [pushState, setPushState] = useState<'waiting' | 'approved' | 'denied'>('waiting');
  const [totpTick, setTotpTick] = useState(() => Math.floor(Date.now() / 1000));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Recovery flow state
  const [recIdentifier, setRecIdentifier] = useState('');
  const [recAccount, setRecAccount] = useState<StoredAccount | null>(null);
  const [recCodeSent, setRecCodeSent] = useState<string | null>(null);
  const [recCodeInput, setRecCodeInput] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');
  const [recShowPass, setRecShowPass] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Register state
  const [contactMode, setContactMode] = useState<'phone' | 'email'>('phone');
  const [countryIndex, setCountryIndex] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPass, setRegShowPass] = useState(false);
  const [regAvatar, setRegAvatar] = useState<AvatarKey>('discord-blurple');
  const [regEnable2FA, setRegEnable2FA] = useState(false);
  const [regBackupCodes] = useState<string[]>(() => generateBackupCodes());
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const selectedCountry = COUNTRY_CODES[countryIndex];

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const id = window.setInterval(() => {
      setLockoutSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockoutSeconds]);

  useEffect(() => {
    if (step !== 'two-factor') return;
    const id = window.setInterval(() => {
      setTotpTick(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step !== 'login' || loginMethod !== 'qr') return;
    const id = window.setInterval(() => {
      setQrCountdown((c) => {
        if (c <= 1) {
          setQrNonce(Math.random().toString(36).slice(2, 10).toUpperCase());
          setQrState('ready');
          return 120;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, loginMethod]);

  const currentWindowStep = Math.floor(totpTick / 30);
  const totpSecondsRemaining = 30 - (totpTick % 30);
  const expectedTotp = useMemo(
    () => computeTotpCode(pendingAccount?.id || 'primordial-2fa', currentWindowStep),
    [pendingAccount?.id, currentWindowStep]
  );

  const fallbackBackupCode = useMemo(
    () => pendingAccount?.backupCodes?.[0] || 'PRM-8492-X7',
    [pendingAccount]
  );

  const qrMatrix = useMemo(() => buildQrMatrix(qrNonce), [qrNonce]);
  const regStrength = useMemo(() => evaluatePasswordStrength(regPassword), [regPassword]);
  const recStrength = useMemo(() => evaluatePasswordStrength(recNewPassword), [recNewPassword]);

  const needsHumanCheck = failedAttempts >= 3 && !challengeSolved;
  const activeChallenge = SECURITY_CHALLENGES[challengeIndex % SECURITY_CHALLENGES.length];

  const isDeviceTrusted = (accountId: string) => {
    try {
      const raw = localStorage.getItem(`${TRUSTED_DEVICE_PREFIX}${accountId}`);
      if (!raw) return false;
      const expiresAt = Number(raw);
      return Number.isFinite(expiresAt) && expiresAt > Date.now();
    } catch {
      return false;
    }
  };

  const findMatchingAccount = (rawIdentifier: string): StoredAccount | null => {
    const raw = rawIdentifier.trim();
    if (!raw) return null;
    const idLower = raw.toLowerCase();
    const idNoAt = idLower.replace(/^@+/, '');
    const idDigits = raw.replace(/\D/g, '');
    const idDigitsNoZero = idDigits.replace(/^0+/, '');

    const matchPhoneStr = (candidate?: string | null): boolean => {
      if (!candidate) return false;
      const candLower = candidate.trim().toLowerCase();
      if (candLower === idLower) return true;
      if (idDigits.length < 6) return false;
      const candDigits = candidate.replace(/\D/g, '');
      if (candDigits.length < 6) return false;
      if (candDigits === idDigits) return true;
      const candNoZero = candDigits.replace(/^0+/, '');
      if (idDigitsNoZero.length >= 7 && (candDigits.endsWith(idDigitsNoZero) || candNoZero === idDigitsNoZero)) {
        return true;
      }
      return false;
    };

    return (
      accounts.find((acc) => {
        const contactLower = (acc.contact || '').trim().toLowerCase();
        const contactNoAt = contactLower.replace(/^@+/, '');
        const emailLower = (acc.user.email || '').trim().toLowerCase();
        const usernameLower = (acc.user.username || '').trim().toLowerCase().replace(/^@+/, '');
        const displayLower = (acc.user.displayName || '').trim().toLowerCase();

        return (
          contactLower === idLower ||
          contactNoAt === idNoAt ||
          (emailLower && emailLower === idLower) ||
          usernameLower === idNoAt ||
          displayLower === idLower ||
          matchPhoneStr(acc.contact) ||
          matchPhoneStr(acc.user.phone)
        );
      }) || null
    );
  };

  const resolveAccountForQuickAuth = (): StoredAccount | null => {
    return findMatchingAccount(loginIdentifier);
  };

  const finalizeAuthenticatedLogin = (account: StoredAccount, rememberDevice = false) => {
    if (rememberDevice) {
      try {
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem(`${TRUSTED_DEVICE_PREFIX}${account.id}`, String(Date.now() + thirtyDaysMs));
      } catch {
        /* ignore */
      }
    }
    setFailedAttempts(0);
    setLockoutSeconds(0);
    setChallengeSolved(false);
    setPendingAccount(null);
    onLoginAccount(account);
  };

  const registerFailedAttempt = (message: string) => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= 3) {
      setLockoutSeconds(20);
      setChallengeSolved(false);
      setChallengeIndex((i) => i + 1);
      setLoginError(`${message} Por seguridad, espera 20s y completa la verificación humana.`);
    } else {
      setLoginError(`${message} (Intento ${next}/3 antes del bloqueo temporal)`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setInfoBanner(null);

    if (lockoutSeconds > 0) {
      setLoginError(`Acceso bloqueado temporalmente. Espera ${lockoutSeconds}s para reintentar.`);
      return;
    }

    if (needsHumanCheck) {
      setLoginError('Completa la verificación de seguridad antes de continuar.');
      return;
    }

    const rawId = loginIdentifier.trim();
    if (!rawId || !loginPassword.trim()) {
      setLoginError('Introduce tu usuario, correo o teléfono y tu contraseña.');
      return;
    }

    const found = findMatchingAccount(rawId);

    const runCloudAttempt = async (
      identifierToTry: string,
      extraEmails: string[] = []
    ): Promise<CloudLoginResult> => {
      if (!onCloudLogin) {
        return { ok: false, errorReason: 'not-found' };
      }
      setCloudLoginPending(true);
      try {
        const rawRes = await onCloudLogin(identifierToTry, loginPassword, extraEmails);
        if (typeof rawRes === 'boolean') {
          return { ok: rawRes };
        }
        return rawRes;
      } catch {
        return {
          ok: false,
          errorReason: 'unknown',
          errorMessage: 'No se pudo conectar para verificar tu cuenta.',
        };
      } finally {
        setCloudLoginPending(false);
      }
    };

    if (!found) {
      const cloudRes = await runCloudAttempt(rawId);
      if (cloudRes.ok) {
        setFailedAttempts(0);
        setLockoutSeconds(0);
        setChallengeSolved(false);
        return;
      }
      if (
        cloudRes.errorReason === 'provider-disabled' ||
        cloudRes.errorReason === 'network' ||
        cloudRes.errorReason === 'too-many-requests'
      ) {
        setLoginError(
          cloudRes.errorMessage || 'No pudimos conectar con el servicio de inicio de sesión.'
        );
        return;
      }
      registerFailedAttempt(
        cloudRes.errorMessage || 'No encontramos esa cuenta o la contraseña no coincide.'
      );
      return;
    }

    const storedPwd = found.password || '';
    const passwordMatches =
      storedPwd.length > 0 &&
      (storedPwd === loginPassword ||
        (storedPwd.trim().length > 0 && storedPwd.trim() === loginPassword.trim()));

    if (!passwordMatches) {
      const extraEmails = [
        found.user.email || '',
        found.contact?.includes('@') ? found.contact : '',
        found.user.username ? `${found.user.username}@users.primordial.app` : '',
      ].filter(Boolean);
      const cloudRes = await runCloudAttempt(
        found.user.email || found.contact || rawId,
        extraEmails
      );
      if (cloudRes.ok) {
        onResetPassword?.(found.id, loginPassword.trim());
        setFailedAttempts(0);
        setLockoutSeconds(0);
        setChallengeSolved(false);
        return;
      }
      registerFailedAttempt(
        storedPwd.length > 0
          ? 'Contraseña incorrecta.'
          : cloudRes.errorMessage || 'No encontramos esa cuenta o la contraseña no coincide.'
      );
      return;
    }

    const shouldRequire2FA =
      (require2FA || found.twoFactorEnabled) && !isDeviceTrusted(found.id);

    if (shouldRequire2FA) {
      setPendingAccount(found);
      setTwoFactorTab('totp');
      setOtpDigits(['', '', '', '', '', '']);
      setBackupInput('');
      setTwoFactorError(null);
      setPushState('waiting');
      setShowTotpHelper(false);
      setStep('two-factor');
      return;
    }

    finalizeAuthenticatedLogin(found, false);
  };

  const handleBiometricVerify = async () => {
    setLoginError(null);
    const target = resolveAccountForQuickAuth();
    if (!target) {
      setLoginError('No encontramos una cuenta local asociada a ese identificador.');
      return;
    }

    setBioState('scanning');
    setBioStatusText('Generando desafío WebAuthn...');

    try {
      const supportsWebAuthn =
        typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential !== 'undefined' &&
        !!navigator.credentials;

      await new Promise((r) => setTimeout(r, 850));

      setBioStatusText(
        supportsWebAuthn
          ? 'Llave de seguridad verificada.'
          : 'Verificación biométrica local completada.'
      );
      setBioState('verified');

      window.setTimeout(() => {
        setBioState('idle');
        setBioStatusText(null);
        finalizeAuthenticatedLogin(target, true);
      }, 550);
    } catch {
      setBioState('error');
      setBioStatusText('No se pudo completar la lectura biométrica.');
    }
  };

  const handleQrApprove = () => {
    const target = resolveAccountForQuickAuth();
    if (!target) {
      setLoginError('Introduce primero un correo o usuario válido para vincular el QR.');
      return;
    }
    setQrState('scanned');
    window.setTimeout(() => {
      setQrState('approved');
      window.setTimeout(() => {
        setQrState('ready');
        finalizeAuthenticatedLogin(target, true);
      }, 450);
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((ch, idx) => {
        next[idx] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(chars.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyTwoFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAccount) return;
    setTwoFactorError(null);

    if (twoFactorTab === 'totp') {
      const entered = otpDigits.join('');
      if (entered.length < 6) {
        setTwoFactorError('Introduce los 6 dígitos de tu app autenticadora.');
        return;
      }
      const prevExpected = computeTotpCode(pendingAccount.id, currentWindowStep - 1);
      if (entered !== expectedTotp && entered !== prevExpected) {
        setTwoFactorError('Código TOTP incorrecto o expirado.');
        return;
      }
      finalizeAuthenticatedLogin(pendingAccount, trustDevice);
      return;
    }

    if (twoFactorTab === 'backup') {
      const clean = backupInput.trim().toUpperCase();
      const validSet = new Set([
        ...(pendingAccount.backupCodes || []).map((c) => c.toUpperCase()),
        fallbackBackupCode.toUpperCase(),
      ]);
      if (!validSet.has(clean)) {
        setTwoFactorError('Código de respaldo inválido.');
        return;
      }
      finalizeAuthenticatedLogin(pendingAccount, trustDevice);
    }
  };

  const handleSendRecoveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecError(null);
    const clean = recIdentifier.trim();
    if (!clean) {
      setRecError('Escribe tu correo, teléfono o nombre de usuario.');
      return;
    }
    const found = findMatchingAccount(clean);
    if (!found) {
      setRecError('No encontramos ninguna cuenta guardada con ese dato en este dispositivo.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRecAccount(found);
    setRecCodeSent(code);
    setRecCodeInput('');
    setRecNewPassword('');
  };

  const handleConfirmRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecError(null);
    if (!recAccount || !recCodeSent) return;
    if (recCodeInput.trim() !== recCodeSent) {
      setRecError('El código de verificación de 6 dígitos no coincide.');
      return;
    }
    if (recNewPassword.trim().length < 6) {
      setRecError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    onResetPassword?.(recAccount.id, recNewPassword.trim());
    setFailedAttempts(0);
    setLockoutSeconds(0);
    setChallengeSolved(false);
    setLoginIdentifier(recAccount.user.email || recAccount.contact || recAccount.user.username);
    setLoginPassword('');
    setInfoBanner('Contraseña restablecida con éxito. Ya puedes iniciar sesión.');
    setRecAccount(null);
    setRecCodeSent(null);
    setStep('login');
  };

  const isContactValid =
    contactMode === 'phone'
      ? phoneNumber.replace(/\D/g, '').length >= 6
      : emailAddress.includes('@') && emailAddress.includes('.');

  const handleContinueContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isContactValid) return;
    setRegError(null);
    setStep('register-profile');
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const display = regDisplayName.trim();
    const uname =
      regUsername.trim() || display.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'usuario';
    if (!display || regPassword.trim().length < 6) {
      setRegError('Escribe un nombre para mostrar y una contraseña de al menos 6 caracteres.');
      return;
    }
    const ownerAlreadyExists = accounts.some(
      (a) =>
        a.isOwnerAccount === true ||
        a.user.username.trim().toLowerCase() === RESERVED_OWNER_USERNAME
    );
    if (ownerAlreadyExists && uname.toLowerCase() === RESERVED_OWNER_USERNAME) {
      setRegError('Este nombre de usuario es privado y pertenece en exclusiva a la cuenta Owner.');
      return;
    }
    const duplicateUsername = accounts.some(
      (a) => a.user.username.toLowerCase() === uname.toLowerCase()
    );
    if (duplicateUsername) {
      setRegError('Ese nombre de usuario ya existe. Elige otro distinto.');
      return;
    }
    const resolvedContactType: 'phone' | 'email' = contactMode;
    const contact =
      resolvedContactType === 'phone'
        ? phoneNumber.trim()
          ? `${selectedCountry.dial} ${phoneNumber.trim()}`
          : `${uname}@users.primordial.app`
        : emailAddress.trim() || `${uname}@users.primordial.app`;

    if (
      (resolvedContactType === 'email' && emailAddress.trim()) ||
      (resolvedContactType === 'phone' && phoneNumber.trim())
    ) {
      const existingByContact = findMatchingAccount(contact);
      if (existingByContact) {
        setRegError('Ya existe una cuenta registrada con ese correo o teléfono. Inicia sesión con ella.');
        return;
      }
    }

    onRegisterAccount({
      contact,
      contactType: contact.includes('@') && !contact.endsWith('@users.primordial.app')
        ? 'email'
        : resolvedContactType,
      displayName: display,
      username: uname,
      password: regPassword.trim(),
      avatar: regAvatar,
      twoFactorEnabled: regEnable2FA,
      backupCodes: regEnable2FA ? regBackupCodes : undefined,
    });
  };

  /* ---------------- 1. WELCOME SCREEN ---------------- */
  if (step === 'welcome') {
    return (
      <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto select-none relative">
        <LoginDragonMascot triggerKey={dragonPlayKey} />
        <AuthEditorialShowcase />

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-4 py-6 sm:px-8 min-h-[100dvh] relative overflow-hidden">
          <div className="flex items-center justify-between lg:justify-end relative z-10">
            <div className="flex items-center gap-2.5 lg:hidden">
              <PrimordialAppIcon className="w-9 h-9 rounded-xl border border-white/40 shadow" />
              <span className="font-display font-extrabold text-base text-[#1c0f3c]">Primordial</span>
            </div>
            <span className="text-xs font-bold text-[#2b175c]">Acceso en la nube</span>
          </div>

          <div className="my-auto py-4 max-w-[440px] mx-auto w-full relative z-10">
            <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 sm:p-8 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-6">
              <div className="space-y-2.5 text-center lg:text-left">
                <div className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold text-[#c4b5fd]">
                  <span>Bienvenido</span>
                </div>
                <div className="lg:hidden flex justify-center mb-3">
                  <PrimordialAppIcon className="w-18 h-18 rounded-3xl border border-white/25 shadow-[0_14px_38px_rgba(88,101,242,0.4)]" />
                </div>
              <h1
                className="font-display font-black text-[28px] sm:text-[34px] tracking-tight leading-[1.08] text-white"
                style={{ textWrap: 'balance' }}
              >
                Tu comunidad, en cualquier pantalla
              </h1>
              <p className="text-[14.5px] text-zinc-400 leading-relaxed">
                Chatea con personas reales, comparte pantalla y conserva tus objetos y amigos entre dispositivos.
              </p>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-400">Cuentas guardadas en este dispositivo</p>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-0.5">
                  {accounts.slice(0, 3).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => finalizeAuthenticatedLogin(acc, false)}
                      className="w-full p-3 rounded-2xl bg-[#11131a] hover:bg-[#171a24] border border-white/[0.08] hover:border-white/20 flex items-center justify-between gap-3 cursor-pointer transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          avatar={acc.user.avatar}
                          customAvatarUrl={acc.user.customAvatarUrl}
                          decoration={acc.user.decoration}
                          size="sm"
                          showStatus={false}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{acc.user.displayName}</p>
                          <p className="text-xs text-zinc-400 truncate">@{acc.user.username}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRegError(null);
                  setStep('register-contact');
                }}
                className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] shadow-[0_10px_28px_-8px_rgba(88,101,242,0.65)] flex items-center justify-center gap-2 transition-all active:scale-[0.985] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Crear cuenta nueva</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginError(null);
                  setInfoBanner(null);
                  setLoginMethod('password');
                  setDragonPlayKey((k) => k + 1);
                  setStep('login');
                }}
                className="w-full h-12 rounded-full bg-[#241c44] hover:bg-[#2f2559] border border-white/15 text-white font-display font-bold text-[15px] transition-all active:scale-[0.985] cursor-pointer"
              >
                Iniciar sesión con mi cuenta
              </button>
            </div>
            </div>
          </div>

          <p className="text-center lg:text-left text-xs font-semibold text-[#2b175c] relative z-10">
            Sin inicio con Google · Acceso directo privado
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- 2. TWO-FACTOR AUTHENTICATION (2FA) ---------------- */
  if (step === 'two-factor' && pendingAccount) {
    return (
      <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        <AuthEditorialShowcase />

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-[100dvh]">
          <header className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                setPendingAccount(null);
                setStep('login');
              }}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-[#1a1038]/25 hover:bg-[#1a1038]/40 flex items-center justify-center text-[#1a0d38] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-[#2b175c]">Verificación 2FA</span>
          </header>

          <div className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-[460px] mx-auto w-full">
            <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#5865F2]/18 border border-[#5865F2]/35 flex items-center justify-center text-[#818cf8] mb-2">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="font-display font-bold text-[24px] text-white tracking-tight">
                Verificación en 2 pasos
              </h1>
              <p className="text-[13.5px] text-zinc-400">
                Confirma tu identidad para <strong className="text-white">@{pendingAccount.user.username}</strong>
              </p>
            </div>

            <div className="p-1 rounded-2xl bg-[#11131a] border border-white/[0.08] grid grid-cols-3 gap-1">
              {[
                { id: 'totp' as const, label: 'Autenticador', icon: Smartphone },
                { id: 'push' as const, label: 'Push móvil', icon: BellRing },
                { id: 'backup' as const, label: 'Respaldo', icon: KeyRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = twoFactorTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setTwoFactorTab(tab.id);
                      setTwoFactorError(null);
                    }}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#5865F2] text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {twoFactorTab === 'totp' && (
              <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                <div className="rounded-2xl bg-[#11131a] border border-white/[0.08] p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Código de 6 dígitos (TOTP)</span>
                    <span className="font-mono font-bold text-[#818cf8] tabular-nums">
                      Expira en {totpSecondsRemaining}s
                    </span>
                  </div>

                  <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#5865F2] transition-all duration-1000"
                      style={{ width: `${(totpSecondsRemaining / 30) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="h-12 rounded-xl bg-[#090a0f] border border-white/10 text-center font-mono font-bold text-lg text-white focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/30"
                      />
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowTotpHelper((v) => !v)}
                      className="text-xs font-semibold text-[#60a5fa] hover:underline cursor-pointer"
                    >
                      {showTotpHelper ? 'Ocultar código simulado' : '¿Sin app? Ver código actual'}
                    </button>
                    {showTotpHelper && (
                      <button
                        type="button"
                        onClick={() => setOtpDigits(expectedTotp.split(''))}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 font-mono text-xs font-bold text-white cursor-pointer"
                      >
                        <span>{expectedTotp}</span>
                        <span className="text-[10px] text-indigo-200 font-sans">Rellenar</span>
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none px-1">
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#5865F2]"
                  />
                  <span>Confiar en este dispositivo durante 30 días</span>
                </label>

                {twoFactorError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {twoFactorError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] shadow-lg transition-colors cursor-pointer"
                >
                  Verificar y entrar
                </button>
              </form>
            )}

            {twoFactorTab === 'push' && (
              <div className="rounded-2xl bg-[#11131a] border border-white/[0.08] p-5 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#5865F2]/15 border border-[#5865F2]/40 flex items-center justify-center">
                  <BellRing className="w-7 h-7 text-[#818cf8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">
                    {pushState === 'waiting'
                      ? 'Solicitud enviada a tu dispositivo de confianza'
                      : pushState === 'approved'
                      ? '¡Inicio de sesión aprobado!'
                      : 'Solicitud rechazada por seguridad'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Autoriza el acceso para @{pendingAccount.user.username}
                  </p>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPushState('denied');
                      setTwoFactorError('Acceso rechazado desde tu dispositivo móvil.');
                    }}
                    className="flex-1 h-11 rounded-full bg-[#1e212e] hover:bg-[#282c3d] text-xs font-bold text-zinc-200 cursor-pointer"
                  >
                    No fui yo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPushState('approved');
                      window.setTimeout(() => {
                        finalizeAuthenticatedLogin(pendingAccount, trustDevice);
                      }, 450);
                    }}
                    className="flex-1 h-11 rounded-full bg-[#23a55a] hover:bg-[#1e8f4d] text-xs font-bold text-white cursor-pointer"
                  >
                    Sí, aprobar acceso
                  </button>
                </div>

                {twoFactorError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {twoFactorError}
                  </p>
                )}
              </div>
            )}

            {twoFactorTab === 'backup' && (
              <form onSubmit={handleVerifyTwoFactor} className="space-y-4">
                <div className="rounded-2xl bg-[#11131a] border border-white/[0.08] p-4 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Código de recuperación
                  </label>
                  <input
                    type="text"
                    value={backupInput}
                    onChange={(e) => setBackupInput(e.target.value)}
                    placeholder="PRM-XXXX-XX"
                    className="w-full h-12 rounded-xl bg-[#090a0f] border border-white/10 px-4 font-mono text-sm uppercase tracking-wider text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2]"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Código válido:</span>
                    <button
                      type="button"
                      onClick={() => setBackupInput(fallbackBackupCode)}
                      className="font-mono font-bold text-[#60a5fa] hover:underline cursor-pointer"
                    >
                      {fallbackBackupCode}
                    </button>
                  </div>
                </div>

                {twoFactorError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {twoFactorError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] shadow-lg transition-colors cursor-pointer"
                >
                  Usar código de respaldo
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 3. ACCOUNT RECOVERY ---------------- */
  if (step === 'recovery') {
    return (
      <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        <AuthEditorialShowcase />

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-[100dvh]">
          <header className="h-14 px-4 sm:px-6 flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setRecError(null);
                setStep('login');
              }}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-[#1a1038]/25 hover:bg-[#1a1038]/40 flex items-center justify-center text-[#1a0d38] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </header>

          <div className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-[460px] mx-auto w-full">
            <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-5">
            <div className="text-center lg:text-left space-y-1.5">
              <h1 className="font-display font-bold text-[26px] text-white tracking-tight">
                Recuperar acceso
              </h1>
              <p className="text-[13.5px] text-zinc-400">
                {recCodeSent
                  ? 'Introduce el código de verificación y define una nueva contraseña fuerte.'
                  : 'Escribe tu usuario, correo o teléfono para restablecer tu contraseña.'}
              </p>
            </div>

            {!recCodeSent ? (
              <form onSubmit={handleSendRecoveryCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-zinc-300">
                    Correo electrónico, teléfono o usuario
                  </label>
                  <input
                    type="text"
                    value={recIdentifier}
                    onChange={(e) => setRecIdentifier(e.target.value)}
                    placeholder="usuario@correo.com"
                    className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
                  />
                </div>

                {recError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {recError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] shadow-lg cursor-pointer"
                >
                  Enviar código de verificación
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmRecovery} className="space-y-4">
                <div className="rounded-2xl bg-[#11131a] border border-white/10 p-3.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Código enviado:</span>
                  <button
                    type="button"
                    onClick={() => setRecCodeInput(recCodeSent)}
                    className="font-mono font-bold text-[#60a5fa] hover:underline cursor-pointer"
                  >
                    {recCodeSent} · Rellenar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-zinc-300">
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={recCodeInput}
                    onChange={(e) => setRecCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 font-mono tracking-widest text-[16px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-zinc-300">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={recShowPass ? 'text' : 'password'}
                      value={recNewPassword}
                      onChange={(e) => setRecNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] pl-4 pr-12 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2]"
                    />
                    <button
                      type="button"
                      onClick={() => setRecShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {recShowPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {recNewPassword && (
                    <div className="pt-1 space-y-1">
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((lvl) => (
                          <span
                            key={lvl}
                            className={`h-1.5 rounded-full transition-colors ${
                              recStrength.score >= lvl ? recStrength.color : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Fortaleza: <strong className="text-white">{recStrength.label}</strong>
                      </p>
                    </div>
                  )}
                </div>

                {recError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {recError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] shadow-lg cursor-pointer"
                >
                  Actualizar contraseña
                </button>
              </form>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 4. LOGIN SCREEN ---------------- */
  if (step === 'login') {
    return (
      <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto relative">
        <LoginDragonMascot triggerKey={dragonPlayKey} />
        <AuthEditorialShowcase />

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-[100dvh]">
          <header className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setStep('welcome')}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-[#1a1038]/25 hover:bg-[#1a1038]/40 flex items-center justify-center text-[#1a0d38] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setStep('register-contact')}
              className="text-xs font-extrabold text-[#1c0f3c] hover:underline transition-colors cursor-pointer"
            >
              Crear cuenta
            </button>
          </header>

          <div className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-[460px] mx-auto w-full relative z-10">
            <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-5">
            <div className="text-center lg:text-left space-y-1">
              <h1 className="font-display font-black text-[28px] text-white tracking-tight">
                ¡Hola de nuevo!
              </h1>
              <p className="text-[14px] text-zinc-400">
                Ingresa desde cualquier dispositivo con tu usuario, correo o teléfono.
              </p>
            </div>

            <div className="p-1 rounded-2xl bg-[#11131a] border border-white/[0.08] grid grid-cols-3 gap-1">
              {[
                { id: 'password' as const, label: 'Contraseña', icon: Lock },
                { id: 'qr' as const, label: 'Código QR', icon: QrCode },
                { id: 'biometric' as const, label: 'Biometría', icon: Fingerprint },
              ].map((m) => {
                const Icon = m.icon;
                const active = loginMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setLoginMethod(m.id);
                      setLoginError(null);
                    }}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      active
                        ? 'bg-[#5865F2] text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {loginMethod === 'password' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-zinc-300">
                    Usuario, correo o teléfono
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="@tu_usuario o correo@ejemplo.com"
                    className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-zinc-300">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] pl-4 pr-12 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label="Mostrar contraseña"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRecError(null);
                      setRecCodeSent(null);
                      setRecIdentifier(loginIdentifier);
                      setStep('recovery');
                    }}
                    className="text-[13px] font-semibold text-[#60a5fa] hover:underline cursor-pointer"
                  >
                    ¿Has olvidado la contraseña?
                  </button>

                  <label className="inline-flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={require2FA}
                      onChange={(e) => setRequire2FA(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#5865F2]"
                    />
                    <span>Exigir 2FA</span>
                  </label>
                </div>

                {(lockoutSeconds > 0 || needsHumanCheck) && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        Protección anti-fuerza bruta
                      </span>
                      {lockoutSeconds > 0 && (
                        <span className="font-mono tabular-nums">{lockoutSeconds}s</span>
                      )}
                    </div>
                    {needsHumanCheck && (
                      <div className="space-y-2">
                        <p className="text-[11.5px] text-zinc-200">{activeChallenge.prompt}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'shield', label: 'Escudo', icon: Shield },
                              { id: 'lock', label: 'Candado', icon: Lock },
                              { id: 'key', label: 'Llave', icon: KeyRound },
                            ] as const
                          ).map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (item.id === activeChallenge.target) {
                                    setChallengeSolved(true);
                                    setLoginError(null);
                                  } else {
                                    setChallengeIndex((i) => i + 1);
                                  }
                                }}
                                className="h-10 rounded-xl bg-[#090a0f] hover:bg-[#1a1c26] border border-white/15 flex items-center justify-center gap-1.5 text-xs font-semibold text-white cursor-pointer"
                              >
                                <Icon className="w-3.5 h-3.5 text-[#818cf8]" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {loginError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </p>
                )}

                {infoBanner && (
                  <p className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-3.5 py-2.5">
                    {infoBanner}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={lockoutSeconds > 0 || cloudLoginPending}
                  className={`w-full h-12 rounded-full font-display font-bold text-[15px] shadow-[0_10px_28px_-8px_rgba(88,101,242,0.6)] transition-all mt-1 ${
                    lockoutSeconds > 0 || cloudLoginPending
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer active:scale-[0.985]'
                  }`}
                >
                  {lockoutSeconds > 0
                    ? `Bloqueado (${lockoutSeconds}s)`
                    : cloudLoginPending
                      ? 'Conectando en la nube...'
                      : 'Iniciar sesión'}
                </button>
              </form>
            )}

            {loginMethod === 'qr' && (
              <div className="rounded-3xl bg-[#11131a] border border-white/[0.08] p-5 text-center space-y-4">
                <div className="relative w-44 h-44 mx-auto rounded-2xl bg-white p-3 shadow-xl flex items-center justify-center">
                  <svg
                    viewBox="0 0 21 21"
                    className="w-full h-full"
                    shapeRendering="crispEdges"
                    aria-label="Código QR de inicio de sesión"
                  >
                    {qrMatrix.flatMap((row, rIdx) =>
                      row.map((filled, cIdx) =>
                        filled ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#111214"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md border-2 border-white">
                      <PrimordialAppIcon className="w-full h-full" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-base text-white">
                    Iniciar sesión con código QR
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Escanea este código desde tu sesión abierta en otro dispositivo.
                  </p>
                  <p className="text-[11px] font-mono text-[#818cf8] tabular-nums pt-0.5">
                    Token: {qrNonce} · Expira en {qrCountdown}s
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQrNonce(Math.random().toString(36).slice(2, 10).toUpperCase());
                      setQrCountdown(120);
                      setQrState('ready');
                    }}
                    className="h-10 px-4 rounded-full bg-[#1b1e2b] hover:bg-[#25293a] text-xs font-semibold text-zinc-200 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renovar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQrApprove}
                    className="flex-1 h-10 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-xs font-bold text-white cursor-pointer"
                  >
                    {qrState === 'ready'
                      ? 'Autorizar desde móvil'
                      : qrState === 'scanned'
                      ? 'Verificando firma...'
                      : '¡Aprobado!'}
                  </button>
                </div>
              </div>
            )}

            {loginMethod === 'biometric' && (
              <div className="rounded-3xl bg-[#11131a] border border-white/[0.08] p-5 text-center space-y-4">
                <div
                  className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center border transition-all ${
                    bioState === 'verified'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : bioState === 'scanning'
                      ? 'bg-[#5865F2]/25 border-[#5865F2] text-white animate-pulse'
                      : 'bg-[#5865F2]/15 border-[#5865F2]/40 text-[#818cf8]'
                  }`}
                >
                  {bioState === 'verified' ? (
                    <CheckCircle2 className="w-8 h-8" />
                  ) : (
                    <Fingerprint className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-bold text-base text-white">
                    Biometría / Face ID
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Inicia sesión con huella dactilar o reconocimiento facial de este dispositivo.
                  </p>
                </div>

                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Opcional: usuario o correo"
                  className="w-full h-11 rounded-xl bg-[#090a0f] border border-white/10 px-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5865F2]"
                />

                {bioStatusText && (
                  <p className="text-xs font-medium text-[#a5b4fc] bg-[#5865F2]/15 border border-[#5865F2]/30 rounded-xl px-3 py-2">
                    {bioStatusText}
                  </p>
                )}

                {loginError && (
                  <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                    {loginError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={bioState === 'scanning'}
                  onClick={handleBiometricVerify}
                  className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[14.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {bioState === 'scanning'
                      ? 'Verificando...'
                      : 'Verificar con huella o Face ID'}
                  </span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 5. REGISTER STEP 1 (Contacto) ---------------- */
  if (step === 'register-contact') {
    return (
      <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
        <AuthEditorialShowcase />

        <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-[100dvh]">
          <header className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setStep('welcome')}
              aria-label="Volver"
              className="w-10 h-10 rounded-full bg-[#1a1038]/25 hover:bg-[#1a1038]/40 flex items-center justify-center text-[#1a0d38] cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-[#2b175c] tabular-nums">Paso 1 de 2</span>
          </header>

          <form
            onSubmit={handleContinueContact}
            className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-[460px] mx-auto w-full"
          >
            <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-5">
            <div className="text-center lg:text-left space-y-1">
              <h1
                className="font-display font-black text-[26px] text-white leading-tight"
                style={{ textWrap: 'balance' }}
              >
                Tu teléfono o correo
              </h1>
              <p className="text-[13.5px] text-zinc-400">
                Usaremos esto para sincronizar tu cuenta y compras entre dispositivos.
              </p>
            </div>

            <div className="p-1 rounded-full bg-[#11131a] border border-white/[0.08] grid grid-cols-2">
              <button
                type="button"
                onClick={() => setContactMode('phone')}
                className={`h-9 rounded-full text-[13.5px] font-bold transition-all cursor-pointer ${
                  contactMode === 'phone'
                    ? 'bg-[#5865F2] text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Teléfono
              </button>
              <button
                type="button"
                onClick={() => setContactMode('email')}
                className={`h-9 rounded-full text-[13.5px] font-bold transition-all cursor-pointer ${
                  contactMode === 'email'
                    ? 'bg-[#5865F2] text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Correo electrónico
              </button>
            </div>

            {contactMode === 'phone' ? (
              <div className="space-y-1.5 relative">
                <label className="block text-[13px] font-semibold text-zinc-300">
                  Número de teléfono
                </label>
                <div className="h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] flex items-center overflow-hidden focus-within:border-[#5865F2] focus-within:ring-2 focus-within:ring-[#5865F2]/25">
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker((s) => !s)}
                    className="h-full px-3.5 flex items-center gap-1.5 border-r border-white/[0.08] text-sm font-semibold text-white hover:bg-white/5 cursor-pointer shrink-0"
                  >
                    <span>
                      {selectedCountry.code} {selectedCountry.dial}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Número de teléfono"
                    className="flex-1 h-full bg-transparent px-3.5 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none tabular-nums"
                  />
                </div>

                {showCountryPicker && (
                  <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-[#161924] border border-white/10 p-1.5 shadow-2xl z-30">
                    {COUNTRY_CODES.map((c, idx) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountryIndex(idx);
                          setShowCountryPicker(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                          idx === countryIndex
                            ? 'bg-[#5865F2] text-white'
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{c.label}</span>
                        {idx === countryIndex && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-zinc-300">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={!isContactValid}
              className={`w-full h-12 rounded-full font-display font-bold text-[15px] transition-all ${
                isContactValid
                  ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer shadow-lg'
                  : 'bg-[#292e5e] text-white/50 cursor-not-allowed'
              }`}
            >
              Siguiente
            </button>

            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setStep('register-profile');
              }}
              className="w-full py-2 text-xs font-semibold text-[#818cf8] hover:text-white transition-colors cursor-pointer"
            >
              Continuar solo con usuario y nombre →
            </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ---------------- 6. REGISTER STEP 2 (Perfil y contraseña) ---------------- */
  return (
    <div className="w-screen min-h-[100dvh] bg-gradient-to-br from-[#d3c1ff] via-[#b496ff] to-[#8f6cf6] text-white grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
      <AuthEditorialShowcase />

      <div className="lg:col-span-6 xl:col-span-5 flex flex-col min-h-[100dvh]">
        <header className="h-14 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setStep('register-contact')}
            aria-label="Volver"
            className="w-10 h-10 rounded-full bg-[#1a1038]/25 hover:bg-[#1a1038]/40 flex items-center justify-center text-[#1a0d38] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-[#2b175c] tabular-nums">Paso 2 de 2</span>
        </header>

        <form
          onSubmit={handleCompleteRegistration}
          className="flex-1 flex flex-col justify-center px-4 pb-8 max-w-[460px] mx-auto w-full"
        >
          <div className="rounded-3xl bg-[#16102b]/92 backdrop-blur-xl border border-white/25 p-6 shadow-[0_24px_60px_-16px_rgba(39,12,88,0.5)] space-y-4">
          <div className="text-center lg:text-left">
            <h1 className="font-display font-black text-[26px] text-white">Crea tu perfil</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Empieza con 1.200 Orbs de regalo · tu cuenta se guarda automáticamente en la nube
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-zinc-300">Elige tu avatar</label>
            <div className="flex items-center justify-between gap-2 bg-[#11131a] border border-white/[0.08] rounded-2xl p-2.5">
              {AVATAR_CHOICES.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setRegAvatar(av.id)}
                  className={`p-1 rounded-full transition-all cursor-pointer ${
                    regAvatar === av.id
                      ? 'ring-2 ring-[#5865F2] scale-110'
                      : 'opacity-65 hover:opacity-100'
                  }`}
                  title={av.label}
                >
                  <UserAvatar avatar={av.id} size="md" showStatus={false} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-zinc-300">
              Nombre para mostrar
            </label>
            <input
              type="text"
              value={regDisplayName}
              onChange={(e) => setRegDisplayName(e.target.value)}
              placeholder="Ej. Tu nombre"
              className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-zinc-300">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              placeholder="ej. alex_rivera"
              className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] px-4 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-semibold text-zinc-300">Contraseña</label>
            <div className="relative">
              <input
                type={regShowPass ? 'text' : 'password'}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-12 rounded-2xl bg-[#11131a] border border-white/[0.09] pl-4 pr-12 text-[15px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/25"
              />
              <button
                type="button"
                onClick={() => setRegShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                {regShowPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {regPassword && (
              <div className="pt-1 space-y-1.5">
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((lvl) => (
                    <span
                      key={lvl}
                      className={`h-1.5 rounded-full transition-colors ${
                        regStrength.score >= lvl ? regStrength.color : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    Fortaleza: <strong className="text-white">{regStrength.label}</strong>
                  </span>
                  {regStrength.tips.length > 0 && (
                    <span className="truncate max-w-[60%]">Sugerencia: {regStrength.tips[0]}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#11131a] border border-white/[0.08] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#5865F2] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Protección 2FA opcional</p>
                  <p className="text-[11px] text-zinc-400">
                    Códigos de respaldo de un solo uso
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegEnable2FA((v) => !v)}
                className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  regEnable2FA ? 'bg-[#5865F2]' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    regEnable2FA ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {regEnable2FA && (
              <div className="pt-2 border-t border-white/[0.07] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Códigos de respaldo:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(regBackupCodes.join('\n')).catch(() => undefined);
                      setCopiedCodes(true);
                      window.setTimeout(() => setCopiedCodes(false), 1800);
                    }}
                    className="inline-flex items-center gap-1 text-[#60a5fa] font-semibold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCodes ? 'Copiados' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {regBackupCodes.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-1 rounded-lg bg-[#090a0f] border border-white/10 text-[10.5px] font-mono text-center text-indigo-200"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {regError && (
            <p className="text-xs font-semibold text-[#f87171] bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-2.5">
              {regError}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_10px_28px_-8px_rgba(88,101,242,0.65)] cursor-pointer mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Crear cuenta</span>
          </button>
          </div>
        </form>
      </div>
    </div>
  );
};
