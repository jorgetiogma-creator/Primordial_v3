import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, AtSign, Award, Bell, Check, CheckCheck, ChevronRight, Clapperboard, Clock, Gamepad2, Globe, Headphones, HeadphoneOff, HelpCircle, Info, Languages, Link2, LogOut, MessageSquare, MessageSquareMore, Mic, MicOff, Monitor, Music, Palette, PhoneCall, PhoneOff, Plus, QrCode, Search, Settings, Shield, Smartphone, Sparkles, Store, Trash2, Upload, User, UserCheck, UserPlus, Users, Video, VideoOff, Volume2, X } from 'lucide-react';
import {
  AppLanguage,
  AppPreferences,
  AvatarKey,
  CreateServerPayload,
  DirectMessageThread,
  FriendRequestItem,
  NotificationItem,
  PublicUserProfile,
  Server,
  ServerRole,
  ServerTemplateId,
  ThemeMode,
  UserProfile,
  VoiceSession,
} from '../types/discord';
import {
  LaurelQuestIcon,
  NitroWheelIcon,
  OrbsCrystalIcon,
  PrimordialAppIcon,
  SafeImage,
  UserAvatar,
} from './DiscordArt';
import { BoostGemIcon } from './ServerBoostView';
import { PWAInstallButton } from './PWAPrompts';
import { playSoundboardClip, SOUNDBOARD_CLIPS, SoundboardClipId, triggerHaptic } from '../utils/soundEffects';
import { APP_LANGUAGES, translateAppText, useTranslation } from '../utils/i18n';

const AVATAR_DOMINANT_COLORS: Record<string, string> = {
  madara: '#7f1d1d',
  snuf: '#312e81',
  bumper: '#065f46',
  alex: '#1d4ed8',
  discrofy: '#5865F2',
  dev: '#0f766e',
  joawasa: '#9333ea',
  dragon: '#b91c1c',
  welcomer: '#047857',
  yourbot: '#4338ca',
  alirito: '#be185d',
  xjenx: '#0369a1',
  jorge: '#4f46e5',
  carioca: '#b45309',
  phibi: '#7c3aed',
  locke: '#334155',
  coffee: '#78350f',
};

const getAvatarBackdrop = (avatar: AvatarKey) =>
  AVATAR_DOMINANT_COLORS[avatar] || '#5865F2';

const PrimordialRowIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <PrimordialAppIcon className={`${className} rounded-md border border-white/10`} />
);

/* ---------------- EXACT SETTINGS VIEW (Screenshots 5 & 6) ---------------- */
export const SettingsView: React.FC<{
  user: UserProfile;
  theme: ThemeMode;
  appPreferences?: AppPreferences;
  onUpdateAppPreferences?: (patch: Partial<AppPreferences>) => void;
  onChangeTheme: (t: ThemeMode) => void;
  onBack: () => void;
  onOpenNitro: () => void;
  onOpenShop: () => void;
  onOpenQuests: () => void;
  onOpenServerBoost: () => void;
  onOpenBadges: () => void;
  onLogout: () => void;
  onNotify?: (msg: string) => void;
}> = ({
  user,
  theme,
  appPreferences = {
    soundsEnabled: true,
    chatFontSize: 'standard',
    compactMode: false,
    typingIndicatorEnabled: true,
    language: 'es',
    autoTranslateMessages: false,
  },
  onUpdateAppPreferences,
  onChangeTheme,
  onBack,
  onOpenNitro,
  onOpenShop,
  onOpenQuests,
  onOpenServerBoost,
  onOpenBadges,
  onLogout,
  onNotify,
}) => {
  const { language, languageOption, t } = useTranslation();
  const [search, setSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [activeSubPanel, setActiveSubPanel] = useState<string | null>(null);
  const [pushNotifs, setPushNotifs] = useState(true);
  const typingIndicator = appPreferences.typingIndicatorEnabled;

  const q = search.trim().toLowerCase();

  const matches = (label: string, extraKeywords = '') =>
    !q || label.toLowerCase().includes(q) || extraKeywords.toLowerCase().includes(q);

  const accountRows = [
    { id: 'nitro', label: t('settings.row.getNitro'), keywords: 'nitro', icon: NitroWheelIcon, badge: t('settings.row.discount'), action: onOpenNitro },
    { id: 'cuenta', label: t('settings.row.account'), keywords: 'cuenta account', icon: User, action: () => setActiveSubPanel('Cuenta') },
    { id: 'contenido', label: t('settings.row.contentSocial'), keywords: 'social', icon: Users, action: () => setActiveSubPanel('Contenido y social') },
    { id: 'privacidad', label: t('settings.row.privacy'), keywords: 'privacidad privacy', icon: Shield, action: () => setActiveSubPanel('Datos y privacidad') },
    { id: 'familia', label: t('settings.row.family'), keywords: 'familia family', icon: Users, action: () => setActiveSubPanel('Centro familiar') },
    { id: 'dispositivos', label: t('settings.row.devices'), keywords: 'dispositivos devices', icon: Smartphone, action: () => setActiveSubPanel('Dispositivos') },
    { id: 'apps', label: t('settings.row.connections'), keywords: 'apps connections', icon: Link2, action: () => setActiveSubPanel('Aplicaciones conectadas') },
    { id: 'clips', label: t('settings.row.clips'), keywords: 'clips', icon: Clapperboard, action: () => setActiveSubPanel('Clips') },
    { id: 'qr', label: t('settings.row.qr'), keywords: 'qr', icon: QrCode, action: () => setActiveSubPanel('Escanear código QR') },
  ].filter((r) => matches(r.label, r.keywords));

  const billingRows = [
    { id: 'tienda', label: t('settings.row.shop'), keywords: 'tienda shop', icon: Store, action: onOpenShop },
    { id: 'misiones', label: t('settings.row.quests'), keywords: 'misiones quests', icon: LaurelQuestIcon, action: onOpenQuests },
    { id: 'insignias', label: t('settings.row.badges'), keywords: 'insignias badges', icon: Award, action: onOpenBadges },
    { id: 'mejora', label: t('settings.row.boost'), keywords: 'boost mejora', icon: BoostGemIcon, action: onOpenServerBoost },
  ].filter((r) => matches(r.label, r.keywords));

  const appRows = [
    { id: 'apariencia', label: t('settings.row.appearance'), keywords: 'apariencia theme tema appearance', icon: Palette, action: () => setActiveSubPanel('Apariencia') },
    {
      id: 'idioma',
      label: t('settings.row.language'),
      keywords: 'idioma idiomas language translation traduccion traducción español english',
      icon: Languages,
      action: () => {
        setLanguageSearch('');
        setActiveSubPanel('Idioma');
      },
    },
    { id: 'chat', label: t('settings.row.chat'), keywords: 'chat font fuente', icon: MessageSquare, action: () => setActiveSubPanel('Chat') },
    { id: 'escribiendo', label: t('settings.row.typing'), keywords: 'escritura typing', icon: MessageSquareMore, action: () => setActiveSubPanel('Indicador de escritura') },
    { id: 'navegador', label: t('settings.row.browser'), keywords: 'navegador browser', icon: Globe, action: () => setActiveSubPanel('Navegador web') },
    { id: 'notificaciones', label: t('settings.row.notifications'), keywords: 'notificaciones notifications', icon: Bell, action: () => setActiveSubPanel('Notificaciones') },
    { id: 'icono', label: t('settings.row.appIcon'), keywords: 'icono icon', icon: PrimordialRowIcon, action: () => setActiveSubPanel('Icono de la aplicación') },
    { id: 'avanzado', label: t('settings.row.advanced'), keywords: 'avanzado advanced', icon: Settings, action: () => setActiveSubPanel('Avanzado') },
  ].filter((r) => matches(r.label, r.keywords));

  const supportRows = [
    { id: 'soporte', label: t('settings.row.support'), keywords: 'soporte support', icon: HelpCircle, action: () => setActiveSubPanel('Soporte técnico') },
    {
      id: 'registros',
      label: t('settings.row.debugLogs'),
      keywords: 'debug logs registros',
      icon: Info,
      action: () => setActiveSubPanel('Registros de depuración'),
    },
    { id: 'agradecimientos', label: t('settings.row.acknowledgements'), keywords: 'agradecimientos', icon: Info, action: () => setActiveSubPanel('Agradecimientos') },
  ].filter((r) => matches(r.label, r.keywords));

  const getHeaderTitle = () => {
    if (!activeSubPanel) return t('settings.title');
    if (activeSubPanel === 'Idioma') return t('settings.languagePanelTitle');
    if (activeSubPanel === 'Apariencia') return t('settings.row.appearance');
    if (activeSubPanel === 'Cuenta') return t('settings.row.account');
    if (activeSubPanel === 'Chat') return t('settings.row.chat');
    if (activeSubPanel === 'Notificaciones') return t('settings.row.notifications');
    return activeSubPanel;
  };

  const langQuery = languageSearch.trim().toLowerCase();
  const filteredLanguages = APP_LANGUAGES.filter(
    (opt) =>
      !langQuery ||
      opt.nativeName.toLowerCase().includes(langQuery) ||
      opt.localizedName.toLowerCase().includes(langQuery) ||
      opt.region.toLowerCase().includes(langQuery) ||
      opt.id.toLowerCase().includes(langQuery)
  );

  const handleSelectLanguage = (nextLang: AppLanguage, nativeName: string) => {
    onUpdateAppPreferences?.({ language: nextLang });
    onNotify?.(`${translateAppText(nextLang, 'settings.languageChangedToast')} ${nativeName}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--dc-bg-sidebar)] text-[var(--dc-text-primary)] overflow-hidden">
      {/* Top Header */}
      <header className="h-14 px-4 flex items-center gap-3 bg-[var(--dc-bg-sidebar)] shrink-0">
        <button
          onClick={activeSubPanel ? () => setActiveSubPanel(null) : onBack}
          className="relative p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--dc-text-primary)] cursor-pointer"
        >
          {activeSubPanel ? <ArrowLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </button>
        <h1 className="font-display font-bold text-[19px]">
          {getHeaderTitle()}
        </h1>
      </header>

      {activeSubPanel === 'Idioma' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-10 max-w-xl mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5865F2]/20 text-[#9aa4ff] flex items-center justify-center shrink-0">
                <Languages className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-[16px] text-[var(--dc-text-primary)]">
                  {t('settings.languagePanelTitle')}
                </p>
                <p className="text-xs text-[var(--dc-text-muted)] mt-0.5 leading-relaxed">
                  {t('settings.languagePanelSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[var(--dc-bg-card)] border border-[var(--dc-border)] rounded-xl px-3 h-10">
              <Search className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
              <input
                type="text"
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                placeholder={t('settings.languageSearch')}
                className="flex-1 bg-transparent text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none"
              />
              {languageSearch && (
                <button
                  type="button"
                  onClick={() => setLanguageSearch('')}
                  className="text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Chat Translation Toggle */}
          <label className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-4 flex items-center justify-between gap-3 cursor-pointer">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--dc-text-primary)]">
                {t('settings.languageAutoTranslate')}
              </p>
              <p className="text-xs text-[var(--dc-text-muted)] mt-0.5">
                {t('settings.languageAutoTranslateDesc')} ({languageOption.nativeName})
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(appPreferences.autoTranslateMessages)}
              onChange={(e) =>
                onUpdateAppPreferences?.({ autoTranslateMessages: e.target.checked })
              }
              className="w-5 h-5 accent-[#5865F2] shrink-0"
            />
          </label>

          {/* Language List */}
          <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] overflow-hidden">
            {filteredLanguages.map((opt) => {
              const selected = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectLanguage(opt.id, opt.nativeName)}
                  className={`w-full px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#5865F2]/12 hover:bg-[#5865F2]/18'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 text-left">
                    <span className="text-2xl leading-none shrink-0" aria-hidden="true">
                      {opt.flag}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold text-[var(--dc-text-primary)] truncate">
                        {opt.nativeName}
                      </p>
                      <p className="text-xs text-[var(--dc-text-muted)] truncate">
                        {opt.localizedName} · {opt.region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#5865F2] text-white text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('settings.languageActive')}</span>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-[var(--dc-border)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setActiveSubPanel(null)}
            className="w-full h-11 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
          >
            {t('settings.done')}
          </button>
        </div>
      ) : activeSubPanel === 'Apariencia' ? (
        <div className="flex-1 overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--dc-text-muted)]">
            {t('settings.row.appearance')}
          </p>
          <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                { id: 'light', label: t('theme.light'), swatch: '#ffffff' },
                { id: 'onyx', label: t('theme.onyx'), swatch: '#0e0e11' },
                { id: 'dark', label: t('theme.dark'), swatch: '#313338' },
                { id: 'vice-city', label: t('theme.viceCity'), swatch: '#361c4d' },
              ] as { id: ThemeMode; label: string; swatch: string }[]
            ).map((tItem) => (
              <button
                key={tItem.id}
                onClick={() => onChangeTheme(tItem.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === tItem.id
                    ? 'border-[#5865F2] bg-[#5865F2]/15'
                    : 'border-[var(--dc-border)] bg-[var(--dc-bg-card)]'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border border-black/15 dark:border-white/20 mb-2 flex items-center justify-center"
                  style={{ backgroundColor: tItem.swatch }}
                >
                  {theme === tItem.id && (
                    <Check className={`w-4 h-4 ${tItem.id === 'light' ? 'text-black' : 'text-white'}`} />
                  )}
                </div>
                <span className="text-xs font-bold">{tItem.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : activeSubPanel === 'Cuenta' ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-4 space-y-4">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatar={user.avatar}
                customAvatarUrl={user.customAvatarUrl}
                status={user.status}
                decoration={user.decoration}
                size="lg"
                borderColor="var(--dc-bg-chat)"
              />
              <div className="min-w-0">
                <p className="font-display font-bold text-lg text-[var(--dc-text-primary)] truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-[var(--dc-text-muted)]">@{user.username}</p>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] text-sm">
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-[var(--dc-text-muted)]">Contacto</span>
                <span className="font-semibold text-[var(--dc-text-primary)] truncate">
                  {user.email || user.phone || `${user.username}@discord.gg`}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                <span className="text-[var(--dc-text-muted)]">{t('profile.orbsBalance')}</span>
                <span className="inline-flex items-center gap-1 font-bold text-indigo-400 tabular-nums">
                  <OrbsCrystalIcon className="w-3.5 h-3.5" />
                  {user.orbs.toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onLogout}
                className="flex-1 h-10 rounded-full dc-btn-danger text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('settings.logoutSwitch')}</span>
              </button>
              <button
                onClick={() => setActiveSubPanel(null)}
                className="px-5 h-10 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
              >
                {t('settings.back')}
              </button>
            </div>
          </div>
        </div>
      ) : activeSubPanel ? (
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-4 space-y-3">
            <p className="font-bold text-base">{activeSubPanel}</p>
            {activeSubPanel === 'Icono de la aplicación' ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)]">
                <PrimordialAppIcon className="w-16 h-16 rounded-2xl shadow-lg border border-white/15 shrink-0" />
                <div>
                  <p className="font-display font-bold text-sm text-[var(--dc-text-primary)]">
                    Primordial · Emblema Oficial
                  </p>
                  <p className="text-xs text-[var(--dc-text-secondary)] mt-0.5">
                    Activo en la aplicación web, PWA y acceso directo de Android.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--dc-text-secondary)]">
                Configuración de {activeSubPanel.toLowerCase()} para la cuenta{' '}
                <strong>{user.username}</strong>.
              </p>
            )}
            {activeSubPanel === 'Chat' && (
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold">{t('settings.uiSounds')}</p>
                    <p className="text-xs text-[var(--dc-text-muted)]">
                      Efectos suaves al enviar mensajes o entrar a voz
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appPreferences.soundsEnabled}
                    onChange={(e) =>
                      onUpdateAppPreferences?.({ soundsEnabled: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#5865F2]"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold">{t('settings.compactMode')}</p>
                    <p className="text-xs text-[var(--dc-text-muted)]">
                      Muestra más mensajes reduciendo el espaciado vertical
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={appPreferences.compactMode}
                    onChange={(e) =>
                      onUpdateAppPreferences?.({ compactMode: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#5865F2]"
                  />
                </label>

                <div className="p-3 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] space-y-2">
                  <p className="text-sm font-semibold">{t('settings.chatFontSize')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'small', label: '14px' },
                        { id: 'standard', label: '15px' },
                        { id: 'large', label: '16px' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateAppPreferences?.({ chatFontSize: opt.id })}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer ${
                          appPreferences.chatFontSize === opt.id
                            ? 'bg-[#5865F2] border-[#5865F2] text-white'
                            : 'bg-[var(--dc-bg-input)] border-[var(--dc-border)] text-[var(--dc-text-secondary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeSubPanel === 'Indicador de escritura' && (
              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-sm">Mostrar cuando otros están escribiendo</span>
                <input
                  type="checkbox"
                  checked={typingIndicator}
                  onChange={(e) =>
                    onUpdateAppPreferences?.({ typingIndicatorEnabled: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#5865F2]"
                />
              </label>
            )}
            {activeSubPanel === 'Notificaciones' && (
              <label className="flex items-center justify-between pt-2 cursor-pointer">
                <span className="text-sm">Notificaciones push activadas</span>
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="w-5 h-5 accent-[#5865F2]"
                />
              </label>
            )}
            <button
              onClick={() => setActiveSubPanel(null)}
              className="px-5 py-2 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
            >
              {t('settings.done')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-12 max-w-xl mx-auto w-full space-y-5">
          {/* Search Bar */}
          <div className="flex items-center gap-2.5 bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] rounded-2xl px-3.5 h-11">
            <Search className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('settings.searchPlaceholder')}
              className="flex-1 bg-transparent text-[15px] text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none"
            />
          </div>

          <PWAInstallButton variant="card" />

          {/* Ajustes de la cuenta */}
          {accountRows.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-[var(--dc-text-muted)] px-1">
                {t('settings.section.account')}
              </h2>
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] overflow-hidden">
                {accountRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      onClick={row.action}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className="w-5 h-5 text-[var(--dc-text-primary)] shrink-0" />
                        <span className="text-[15px] font-medium text-[var(--dc-text-primary)]">
                          {row.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.badge && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--dc-bg-elevated)] text-[11px] font-bold text-[var(--dc-text-primary)]">
                            <Clock className="w-3 h-3" />
                            <span>{row.badge}</span>
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ajustes de facturación */}
          {billingRows.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-[var(--dc-text-muted)] px-1">
                {t('settings.section.billing')}
              </h2>
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] overflow-hidden">
                {billingRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      onClick={row.action}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className="w-5 h-5 text-[var(--dc-text-primary)] shrink-0" />
                        <span className="text-[15px] font-medium text-[var(--dc-text-primary)]">
                          {row.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)]" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ajustes de la aplicación */}
          {appRows.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-[var(--dc-text-muted)] px-1">
                {t('settings.section.app')}
              </h2>
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] overflow-hidden">
                {appRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      onClick={row.action}
                      className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className="w-5 h-5 text-[var(--dc-text-primary)] shrink-0" />
                        <span className="text-[15px] font-medium text-[var(--dc-text-primary)]">
                          {row.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {row.id === 'apariencia' && (
                          <span className="text-xs text-[var(--dc-text-muted)] capitalize">
                            {theme === 'light'
                              ? t('theme.light')
                              : theme === 'vice-city'
                              ? t('theme.viceCity')
                              : theme === 'dark'
                              ? t('theme.dark')
                              : t('theme.onyx')}
                          </span>
                        )}
                        {row.id === 'idioma' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9aa4ff]">
                            <span>{languageOption.flag}</span>
                            <span>{languageOption.nativeName}</span>
                          </span>
                        )}
                        {row.id === 'chat' && (
                          <span className="text-xs text-[var(--dc-text-muted)]">
                            {appPreferences.chatFontSize === 'small'
                              ? '14px'
                              : appPreferences.chatFontSize === 'large'
                              ? '16px'
                              : '15px'}
                            {appPreferences.compactMode ? ' · Compact' : ''}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)]" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Controles rápidos de la App */}
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] p-3.5 space-y-3 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dc-text-muted)]">
                  {t('settings.quickControls')}
                </p>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                    {t('settings.uiSounds')}
                  </span>
                  <input
                    type="checkbox"
                    checked={appPreferences.soundsEnabled}
                    onChange={(e) =>
                      onUpdateAppPreferences?.({ soundsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5865F2]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                    {t('settings.compactMode')}
                  </span>
                  <input
                    type="checkbox"
                    checked={appPreferences.compactMode}
                    onChange={(e) =>
                      onUpdateAppPreferences?.({ compactMode: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#5865F2]"
                  />
                </label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--dc-text-primary)]">
                    {t('settings.chatFontSize')}
                  </span>
                  <div className="flex items-center gap-1">
                    {(['small', 'standard', 'large'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => onUpdateAppPreferences?.({ chatFontSize: sz })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                          appPreferences.chatFontSize === sz
                            ? 'bg-[#5865F2] text-white'
                            : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-muted)]'
                        }`}
                      >
                        {sz === 'small' ? '14px' : sz === 'standard' ? '15px' : '16px'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Soporte técnico */}
          {supportRows.length > 0 && (
            <section className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-[var(--dc-text-muted)] px-1">
                {t('settings.section.support')}
              </h2>
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] divide-y divide-[var(--dc-border)] overflow-hidden">
                {supportRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      onClick={row.action}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon className="w-5 h-5 text-[var(--dc-text-primary)] shrink-0" />
                        <span className="text-[15px] font-medium text-[var(--dc-text-primary)]">
                          {row.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Novedades */}
          {matches(t('settings.section.whatsNew'), 'novedades whats new') && (
            <section className="space-y-1.5">
              <h2 className="text-[13px] font-semibold text-[var(--dc-text-muted)] px-1">
                {t('settings.section.whatsNew')}
              </h2>
              <div className="rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] overflow-hidden">
                <button
                  onClick={() => setActiveSubPanel(t('settings.row.whatsNew'))}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Info className="w-5 h-5 text-[var(--dc-text-primary)] shrink-0" />
                    <span className="text-[15px] font-medium text-[var(--dc-text-primary)]">
                      {t('settings.row.whatsNew')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)]" />
                </button>
              </div>
            </section>
          )}

          {/* Cerrar sesión */}
          <button
            onClick={onLogout}
            className="w-full rounded-2xl bg-[var(--dc-bg-chat)] border border-[var(--dc-border)] px-4 py-3.5 flex items-center gap-3 text-[#da373c] font-semibold text-[15px] hover:bg-red-500/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('settings.logout')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------- FRIENDS VIEW ---------------- */
export const FriendsView: React.FC<{
  dms: DirectMessageThread[];
  friendRequests?: FriendRequestItem[];
  sentFriendRequestUids?: string[];
  isCloudConnected?: boolean;
  authProviderNeedsSetup?: boolean;
  onRetryCloudSync?: () => void;
  onBack: () => void;
  onOpenDm: (dmId: string) => void;
  onAddFriend: (
    username: string,
    opts?: { avatar?: UserProfile['avatar']; status?: UserProfile['status']; initialGreeting?: string }
  ) => void;
  onSearchUsers?: (query: string) => Promise<PublicUserProfile[]>;
  onAddRealUser?: (profile: PublicUserProfile) => Promise<void>;
  onSendFriendRequest?: (profile: PublicUserProfile) => Promise<void>;
  onRespondFriendRequest?: (req: FriendRequestItem, accept: boolean) => Promise<void>;
  onInspectUser?: (userId: string, fallback?: Partial<PublicUserProfile>) => void;
}> = ({
  dms,
  friendRequests = [],
  sentFriendRequestUids = [],
  isCloudConnected = true,
  authProviderNeedsSetup = false,
  onRetryCloudSync,
  onBack,
  onOpenDm,
  onAddFriend,
  onSearchUsers,
  onAddRealUser,
  onSendFriendRequest,
  onRespondFriendRequest,
  onInspectUser,
}) => {
  const { t } = useTranslation();
  const friendThreads = dms.filter((d) => !d.isBot && !d.isGroup);
  const [tab, setTab] = useState<'online' | 'all' | 'pending' | 'add'>(
    friendRequests.length > 0 ? 'pending' : friendThreads.length === 0 ? 'add' : 'all'
  );
  const [friendHandle, setFriendHandle] = useState('');
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [realUsers, setRealUsers] = useState<PublicUserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const [chattingUid, setChattingUid] = useState<string | null>(null);
  const [localSentRequestUids, setLocalSentRequestUids] = useState<Record<string, boolean>>({});

  const filtered =
    tab === 'online' ? friendThreads.filter((f) => f.status === 'online') : friendThreads;

  const q = friendHandle.trim().toLowerCase();

  useEffect(() => {
    if (tab !== 'add' || !onSearchUsers) return;
    if (!isCloudConnected) {
      setRealUsers([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    setSearchError(null);
    const timer = window.setTimeout(() => {
      onSearchUsers(friendHandle)
        .then((res) => {
          if (!cancelled) {
            setRealUsers(res);
            setSearchError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setRealUsers([]);
            const raw = err instanceof Error ? err.message : '';
            let cleanErr = 'No se pudo consultar el directorio de usuarios en la nube.';
            if (raw.startsWith('{')) {
              try {
                const parsed = JSON.parse(raw) as { error?: string };
                if (parsed.error?.toLowerCase().includes('permission')) {
                  cleanErr = 'Tu sesión necesita reconectarse con la nube para consultar usuarios.';
                }
              } catch {
                /* ignore */
              }
            } else if (raw && !raw.includes('Missing or insufficient permissions')) {
              cleanErr = `No se pudo buscar ahora mismo (${raw}).`;
            }
            setSearchError(cleanErr);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [tab, friendHandle, onSearchUsers, isCloudConnected]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawTrimmed = friendHandle.trim();
    const clean = rawTrimmed.replace(/^@+/, '');
    if (!clean || adding) return;
    setErrorMsg(null);
    setAddedMsg(null);

    if (onAddRealUser) {
      if (!isCloudConnected) {
        setErrorMsg(t('friends.cloudRequired'));
        return;
      }

      setAdding(true);
      try {
        const cleanLower = clean.toLowerCase();
        const normalizedClean = cleanLower.replace(/[^a-z0-9_.-]/g, '').slice(0, 32);

        const findBestMatch = (list: PublicUserProfile[]) => {
          const exactUser = list.find(
            (entry) =>
              entry.username.toLowerCase() === cleanLower ||
              (normalizedClean && entry.username.toLowerCase() === normalizedClean) ||
              entry.displayName.toLowerCase() === cleanLower ||
              entry.id === clean
          );
          if (exactUser) return { match: exactUser, multiple: false };
          if (list.length === 1) return { match: list[0], multiple: false };
          if (list.length > 1) return { match: undefined, multiple: true };
          return { match: undefined, multiple: false };
        };

        let pool = realUsers;
        let { match, multiple } = findBestMatch(pool);

        // Always perform an immediate fresh search when submitting so debounce never causes false "not found"
        if (!match && onSearchUsers) {
          const fresh = await onSearchUsers(clean);
          pool = fresh;
          setRealUsers(fresh);
          setSearchError(null);
          const resolved = findBestMatch(fresh);
          match = resolved.match;
          multiple = resolved.multiple;
        }

        if (!match) {
          setErrorMsg(
            multiple
              ? `Hay ${pool.length} cuentas parecidas a «${clean}». Toca «Enviar solicitud» o «Chatear» en la cuenta exacta de abajo.`
              : `No encontramos ninguna cuenta con «${clean}». Verifica el @usuario o nombre real exacto y asegúrate de que esa persona haya abierto su cuenta actualizada en Primordial.`
          );
          return;
        }

        if (onSendFriendRequest) {
          await onSendFriendRequest(match);
          setLocalSentRequestUids((prev) => ({ ...prev, [match!.id]: true }));
        }
        await onAddRealUser(match);
        setAddedMsg(`Solicitud enviada y chat abierto con ${match.displayName} (@${match.username})`);
        setFriendHandle('');
        setTimeout(() => setAddedMsg(null), 3200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        setErrorMsg(
          msg && !msg.startsWith('{')
            ? `No se pudo añadir al usuario: ${msg}`
            : 'Ocurrió un error buscando o enviando la solicitud.'
        );
      } finally {
        setAdding(false);
      }
      return;
    }

    onAddFriend(clean);
    setAddedMsg(`Chat abierto con ${clean}`);
    setFriendHandle('');
    setTimeout(() => setAddedMsg(null), 2600);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-[var(--dc-text-primary)] overflow-hidden">
      <header className="h-14 px-4 flex items-center justify-between border-b border-[#2e3035] shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-white/10 text-white cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Users className="w-5 h-5 text-zinc-400" />
          <h1 className="font-display font-bold text-[17px] text-white">{t('friends.title')}</h1>
        </div>
        <button
          onClick={() => setTab('add')}
          className="px-3.5 py-1.5 rounded-full dc-btn-success text-xs font-bold cursor-pointer whitespace-nowrap"
        >
          {t('friends.addFriend')}
        </button>
      </header>

      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#2e3035] overflow-x-auto no-scrollbar bg-[#1c1d22]">
        {[
          { id: 'online', label: t('friends.tab.online') },
          { id: 'all', label: `${t('friends.tab.all')} (${friendThreads.length})` },
          { id: 'pending', label: `${t('friends.tab.pending')} (${friendRequests.length})` },
          { id: 'add', label: t('friends.tab.add') },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id as 'online' | 'all' | 'pending' | 'add')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
              tab === tabItem.id ? 'dc-btn-primary' : 'bg-[#26272f] text-zinc-300 hover:text-white'
            }`}
          >
            <span>{tabItem.label}</span>
            {tabItem.id === 'pending' && friendRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#f23f43]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-2xl w-full mx-auto space-y-4">
        {tab === 'pending' ? (
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              {t('friends.tab.pending')} ({friendRequests.length})
            </p>
            {friendRequests.length === 0 ? (
              <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-8 text-center space-y-2">
                <UserPlus className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-sm font-bold text-white">{t('friends.noPendingTitle')}</p>
                <p className="text-xs text-zinc-400">
                  {t('friends.noPendingDesc')}
                </p>
              </div>
            ) : (
              friendRequests.map((req) => (
                <div
                  key={req.fromUid}
                  className="p-3.5 rounded-2xl bg-[#1c1d22] border border-[#2e3035] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      avatar={req.fromAvatar}
                      customAvatarUrl={req.fromCustomAvatarUrl}
                      status="online"
                      size="md"
                      borderColor="#1c1d22"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">
                        {req.fromDisplayName}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        @{req.fromUsername} · {t('friends.pendingIncoming')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void onRespondFriendRequest?.(req, true)}
                      aria-label="Aceptar solicitud"
                      className="w-9 h-9 rounded-full bg-[#23a55a]/20 hover:bg-[#23a55a]/35 text-[#23a55a] border border-[#23a55a]/40 flex items-center justify-center cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onRespondFriendRequest?.(req, false)}
                      aria-label="Rechazar solicitud"
                      className="w-9 h-9 rounded-full bg-[#f23f43]/15 hover:bg-[#f23f43]/30 text-[#f23f43] border border-[#f23f43]/40 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : tab === 'add' ? (
          <>
            {!isCloudConnected && (
              <div className="rounded-2xl bg-amber-500/12 border border-amber-400/35 p-3.5 text-xs text-amber-200 font-medium leading-relaxed flex flex-col gap-2">
                {authProviderNeedsSetup ? (
                  <>
                    <p className="font-bold text-amber-100">
                      Activa el acceso en la nube para ver a los usuarios registrados
                    </p>
                    <p className="text-[11.5px] text-amber-100/90">
                      En Firebase Console → Authentication → Sign-in method (proyecto{' '}
                      <code className="bg-black/30 px-1 rounded">gen-lang-client-0457794873</code>), habilita{' '}
                      <strong>Correo electrónico/Contraseña</strong> y <strong>Anónimo</strong>. Luego pulsa el botón de abajo.
                    </p>
                  </>
                ) : (
                  <p>{t('friends.cloudRequired')}</p>
                )}
                {onRetryCloudSync && (
                  <button
                    type="button"
                    onClick={onRetryCloudSync}
                    className="self-start px-3 py-1.5 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 font-bold text-[11px] cursor-pointer"
                  >
                    Reintentar conexión con la nube
                  </button>
                )}
              </div>
            )}

            <form
              onSubmit={handleAdd}
              className="space-y-3 bg-[#1c1d22] p-5 rounded-2xl border border-[#2e3035]"
            >
              <h2 className="font-display font-bold text-base">{t('friends.searchHeading')}</h2>
              <p className="text-xs text-zinc-400">
                {t('friends.searchSubheading')}
              </p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-[#111214] border border-[#2e3035] rounded-xl px-3.5 focus-within:border-[#5865F2]">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={friendHandle}
                    onChange={(e) => {
                      setFriendHandle(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={t('friends.searchPlaceholder')}
                    className="flex-1 bg-transparent py-2.5 text-sm text-white focus:outline-none"
                  />
                  {friendHandle && (
                    <button
                      type="button"
                      onClick={() => setFriendHandle('')}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={adding || !friendHandle.trim()}
                  className="px-4 py-2.5 rounded-xl dc-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{adding ? '...' : t('friends.addButton')}</span>
                </button>
              </div>
              {addedMsg && (
                <p className="text-xs text-[#23a55a] font-semibold flex items-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  <span>{addedMsg}</span>
                </p>
              )}
              {(errorMsg || searchError) && (
                <p className="text-xs text-[#f23f43] font-semibold">
                  {errorMsg || searchError}
                </p>
              )}
            </form>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {searching
                    ? t('friends.searching')
                    : q
                      ? `${t('friends.resultsLabel')} (${realUsers.length})`
                      : `${t('friends.registeredLabel')} (${realUsers.length})`}
                </p>
                {isCloudConnected && onSearchUsers && (
                  <button
                    type="button"
                    disabled={searching}
                    onClick={() => {
                      setSearching(true);
                      setSearchError(null);
                      void onSearchUsers(friendHandle)
                        .then((res) => setRealUsers(res))
                        .catch(() => setSearchError('No se pudo actualizar la lista ahora.'))
                        .finally(() => setSearching(false));
                    }}
                    className="text-[11px] font-bold text-[#949cf7] hover:text-white cursor-pointer disabled:opacity-50"
                  >
                    {searching ? 'Actualizando...' : 'Actualizar'}
                  </button>
                )}
              </div>

              {realUsers.map((person) => {
                const existingDm = dms.find(
                  (d) =>
                    d.otherUid === person.id ||
                    (d.username && person.username && d.username.toLowerCase() === person.username.toLowerCase())
                );
                const sent =
                  Boolean(localSentRequestUids[person.id]) ||
                  sentFriendRequestUids.includes(person.id);
                const isSendingReq = sendingUid === person.id;
                const isOpeningChat = chattingUid === person.id;

                return (
                  <div
                    key={person.id}
                    onClick={() =>
                      onInspectUser?.(person.id, person)
                    }
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26272f] border border-[#2e3035] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatar={person.avatar}
                        customAvatarUrl={person.customAvatarUrl}
                        status={person.status}
                        size="md"
                        borderColor="#1c1d22"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate text-white">{person.displayName}</p>
                          <span className="text-[11px] text-zinc-400 truncate">
                            @{person.username}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {person.customStatus || person.bio}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!existingDm && onSendFriendRequest && (
                        <button
                          type="button"
                          disabled={isSendingReq || sent}
                          onClick={(e) => {
                            e.stopPropagation();
                            setErrorMsg(null);
                            setSendingUid(person.id);
                            void onSendFriendRequest(person)
                              .then(() => {
                                setLocalSentRequestUids((prev) => ({ ...prev, [person.id]: true }));
                                setAddedMsg(`Solicitud enviada a @${person.username}`);
                                setTimeout(() => setAddedMsg(null), 2600);
                              })
                              .catch((err: unknown) => {
                                const m = err instanceof Error ? err.message : '';
                                setErrorMsg(m || 'No se pudo enviar la solicitud a este usuario.');
                              })
                              .finally(() => setSendingUid(null));
                          }}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer disabled:opacity-75 ${
                            sent
                              ? 'bg-[#23a55a]/20 border-[#23a55a]/40 text-[#23a55a]'
                              : 'bg-[#26272f] hover:bg-[#31333d] border-[#2e3035] text-white'
                          }`}
                        >
                          {isSendingReq ? '...' : sent ? t('friends.requestSent') : t('friends.sendRequest')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isOpeningChat}
                        onClick={(e) => {
                          e.stopPropagation();
                          setErrorMsg(null);
                          if (existingDm) {
                            onOpenDm(existingDm.id);
                          } else if (onAddRealUser) {
                            setChattingUid(person.id);
                            void onAddRealUser(person)
                              .catch((err: unknown) => {
                                const m = err instanceof Error ? err.message : '';
                                setErrorMsg(m || 'No se pudo abrir el chat con este usuario.');
                              })
                              .finally(() => setChattingUid(null));
                          } else {
                            onAddFriend(person.displayName, {
                              avatar: person.avatar,
                              status: person.status,
                            });
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer whitespace-nowrap disabled:opacity-70 ${
                          existingDm ? 'dc-btn-secondary' : 'dc-btn-primary'
                        }`}
                      >
                        {isOpeningChat ? 'Abriendo...' : existingDm ? t('friends.openChat') : t('friends.chatNow')}
                      </button>
                    </div>
                  </div>
                );
              })}

              {!searching && realUsers.length === 0 && (
                <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-6 text-center space-y-2">
                  <Users className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-sm font-semibold text-white">
                    {q ? `Sin cuentas reales para «${friendHandle.trim()}»` : 'Aún no hay otros usuarios registrados'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Cuando otra persona cree su cuenta o inicie sesión en Primordial, aparecerá aquí al instante para buscarla por su @usuario o nombre real.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {filtered.map((f) => (
              <div
                key={f.id}
                onClick={() =>
                  onInspectUser?.(f.id, {
                    displayName: f.name,
                    username: f.username || f.name.toLowerCase().replace(/\s+/g, ''),
                    avatar: f.avatar,
                    customAvatarUrl: f.customAvatarUrl,
                    status: f.status,
                    decoration: f.decoration,
                    nameplate: f.nameplate,
                    serverTag: f.serverTag,
                  })
                }
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#1c1d22] hover:bg-[#26272f] border border-[#2e3035] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    avatar={f.avatar}
                    customAvatarUrl={f.customAvatarUrl}
                    status={f.status}
                    decoration={f.decoration || 'none'}
                    size="md"
                    borderColor="#1c1d22"
                  />
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm truncate text-white">{f.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {f.username ? `@${f.username}` : f.lastMessagePreview}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDm(f.id);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#26272f] hover:bg-[#31333d] text-xs font-semibold text-white cursor-pointer"
                >
                  {t('friends.message')}
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-8 text-center space-y-3">
                <p className="text-sm font-medium text-zinc-300">
                  {tab === 'online'
                    ? t('friends.emptyOnline')
                    : t('friends.emptyAll')}
                </p>
                <button
                  type="button"
                  onClick={() => setTab('add')}
                  className="px-5 py-2.5 rounded-full dc-btn-primary text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('friends.searchFriendsCta')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- NOTIFICATIONS VIEW ---------------- */
export const NotificationsView: React.FC<{
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClickNotification: (n: NotificationItem) => void;
}> = ({ notifications, onMarkAllRead, onClickNotification }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'all' | 'mentions'>('all');
  const mentionItems = notifications.filter((n) => n.type === 'mention' || n.type === 'reply');
  const visible = tab === 'mentions' ? mentionItems : notifications;

  const badgeLabel = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
        return { text: 'Mención', cls: 'bg-[#5865F2]/25 text-[#9aa4ff]' };
      case 'reply':
        return { text: 'Respuesta', cls: 'bg-emerald-500/20 text-emerald-300' };
      case 'friend':
        return { text: 'Amigo', cls: 'bg-amber-500/20 text-amber-300' };
      case 'quest':
        return { text: 'Misión', cls: 'bg-purple-500/20 text-purple-300' };
      default:
        return { text: 'Sistema', cls: 'bg-white/10 text-zinc-300' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--dc-bg-sidebar)] text-[var(--dc-text-primary)] overflow-hidden">
      <header className="px-4 pt-3.5 pb-2.5 border-b border-[var(--dc-border)] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--dc-text-primary)]" />
            <h1 className="font-display font-extrabold text-[22px] tracking-tight">{t('notifications.title')}</h1>
          </div>
          <button
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('notifications.markAllRead')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              tab === 'all'
                ? 'bg-[#5865F2] text-white'
                : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] hover:text-white'
            }`}
          >
            {t('notifications.tabAll')} ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('mentions')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              tab === 'mentions'
                ? 'bg-[#5865F2] text-white'
                : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] hover:text-white'
            }`}
          >
            <AtSign className="w-3.5 h-3.5" />
            <span>{t('notifications.tabMentions')} ({mentionItems.length})</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-w-2xl w-full mx-auto pb-24">
        {visible.map((n) => {
          const badge = badgeLabel(n.type);
          return (
            <button
              key={n.id}
              onClick={() => onClickNotification(n)}
              className={`w-full text-left p-3.5 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer ${
                n.unread
                  ? 'bg-[#5865F2]/15 border border-[#5865F2]/35 hover:bg-[#5865F2]/20'
                  : 'bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-transparent'
              }`}
            >
              <UserAvatar avatar={n.avatar} size="md" showStatus={false} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${badge.cls}`}>
                      {badge.text}
                    </span>
                    <p className="font-bold text-sm text-[var(--dc-text-primary)] truncate">{n.title}</p>
                  </div>
                  <span className="text-[11px] text-[var(--dc-text-muted)] shrink-0 tabular-nums">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[var(--dc-text-secondary)] mt-1 line-clamp-2">{n.body}</p>
              </div>
            </button>
          );
        })}

        {visible.length === 0 && (
          <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-8 text-center space-y-2 mt-4">
            <Bell className="w-8 h-8 text-[var(--dc-text-muted)] mx-auto opacity-75" />
            <p className="font-bold text-sm text-[var(--dc-text-primary)]">
              {t('notifications.emptyTitle')}
            </p>
            <p className="text-xs text-[var(--dc-text-muted)]">
              {t('notifications.emptyDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- VOICE BAR & CALL OVERLAY ---------------- */
export const VoiceOverlay: React.FC<{
  voice: VoiceSession;
  currentUser: UserProfile;
  soundsEnabled?: boolean;
  localVideoStream?: MediaStream | null;
  remoteVideoStream?: MediaStream | null;
  remoteAudioStream?: MediaStream | null;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo: () => void;
  onToggleScreen: () => void;
  onDisconnect: () => void;
}> = ({
  voice,
  currentUser,
  soundsEnabled = true,
  localVideoStream = null,
  remoteVideoStream = null,
  remoteAudioStream = null,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreen,
  onDisconnect,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [activeClipLabel, setActiveClipLabel] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const hasLocalVideo = Boolean(
    localVideoStream && localVideoStream.getVideoTracks().some((t) => t.readyState === 'live')
  );
  const hasRemoteVideo = Boolean(
    remoteVideoStream && remoteVideoStream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  useEffect(() => {
    if (voice.active && voice.callNonce) {
      setExpanded(true);
    }
    if (!voice.active) {
      setExpanded(false);
      setShowSoundboard(false);
    }
  }, [voice.active, voice.callNonce]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    if (hasLocalVideo && localVideoStream) {
      el.srcObject = localVideoStream;
      void el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [localVideoStream, hasLocalVideo, expanded]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (hasRemoteVideo && remoteVideoStream) {
      el.srcObject = remoteVideoStream;
      void el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [remoteVideoStream, hasRemoteVideo, expanded]);

  useEffect(() => {
    const el = remoteAudioRef.current;
    if (!el) return;
    if (voice.active && remoteAudioStream) {
      el.srcObject = remoteAudioStream;
      el.muted = voice.deafened;
      void el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [voice.active, remoteAudioStream, voice.deafened]);

  if (!voice.active) return null;

  const mins = String(Math.floor(voice.connectedSeconds / 60)).padStart(2, '0');
  const secs = String(voice.connectedSeconds % 60).padStart(2, '0');
  const isRinging = voice.callStatus === 'ringing';
  const statusSubtitle = voice.screenSharing
    ? `Compartiendo pantalla · ${mins}:${secs}`
    : isRinging
    ? 'Llamando...'
    : `${voice.contextName} · ${mins}:${secs}`;

  const triggerClip = (clipId: SoundboardClipId, label: string, emoji: string) => {
    playSoundboardClip(clipId, soundsEnabled);
    triggerHaptic(18);
    setActiveClipLabel(`${emoji} ${label}`);
    window.setTimeout(() => setActiveClipLabel(null), 1600);
  };

  const selfTint = getAvatarBackdrop(currentUser.avatar);
  const anyRemoteScreen = voice.participants.some((p) => p.screenSharing);

  return (
    <>
      <audio ref={remoteAudioRef} autoPlay playsInline muted={voice.deafened} className="hidden" />

      <div className="bg-[#1c1d22] border-t border-[#23a55a]/40 px-3 py-2 flex items-center justify-between gap-2 shrink-0 text-white shadow-xl">
        <button onClick={() => setExpanded(true)} className="text-left min-w-0 flex-1 cursor-pointer">
          <p className="text-xs font-bold text-[#23a55a] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
            <span>
              {voice.screenSharing
                ? 'Pantalla compartida'
                : voice.videoOn
                ? 'Videollamada'
                : isRinging
                ? 'Llamando'
                : 'Voz conectada'}{' '}
              · {mins}:{secs}
            </span>
          </p>
          <p className="text-[11.5px] text-zinc-300 truncate">
            {voice.channelName} / {voice.contextName}
          </p>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleScreen}
            aria-label="Compartir pantalla"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
              voice.screenSharing ? 'bg-[#5865F2] text-white' : 'hover:bg-white/10 text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleVideo}
            aria-label="Alternar cámara"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
              voice.videoOn ? 'bg-[#23a55a]/25 text-[#3dd67d]' : 'hover:bg-white/10 text-white'
            }`}
          >
            {voice.videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleMute}
            aria-label="Silenciar micrófono"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
              voice.muted ? 'bg-[#f23f43]/20 text-[#f23f43]' : 'hover:bg-white/10 text-white'
            }`}
          >
            {voice.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={onToggleDeafen}
            aria-label="Ensordecer audio"
            className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
              voice.deafened ? 'bg-[#f23f43]/20 text-[#f23f43]' : 'hover:bg-white/10 text-white'
            }`}
          >
            {voice.deafened ? (
              <HeadphoneOff className="w-4 h-4" />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDisconnect}
            aria-label="Desconectar llamada"
            className="w-9 h-9 rounded-full bg-[#f23f43] hover:bg-[#d83337] text-white flex items-center justify-center cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="fixed inset-0 z-50 bg-[#111214] flex flex-col justify-between p-4 sm:p-5 overflow-y-auto">
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#23a55a]/20 text-[#23a55a] flex items-center justify-center shrink-0">
                {voice.screenSharing ? (
                  <Monitor className="w-4.5 h-4.5" />
                ) : voice.videoOn ? (
                  <Video className="w-4.5 h-4.5" />
                ) : (
                  <Volume2 className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-white leading-tight truncate">
                  {voice.channelName}
                </h3>
                <p className="text-xs text-[#23a55a] font-semibold tabular-nums truncate">
                  {statusSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeClipLabel && (
                <span className="px-3 py-1 rounded-full bg-[#5865F2]/25 border border-[#5865F2]/40 text-xs font-bold text-white animate-pulse">
                  {activeClipLabel}
                </span>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="px-3.5 py-1.5 rounded-full bg-[#26272f] hover:bg-[#31333d] border border-[#2e3035] text-xs font-semibold text-white cursor-pointer"
              >
                Minimizar
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3.5 max-w-4xl mx-auto w-full my-auto py-3 ${
              voice.participants.length <= 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
            }`}
          >
            <div
              className={`rounded-3xl border flex flex-col items-center justify-center gap-2.5 relative overflow-hidden transition-all ${
                voice.screenSharing && !anyRemoteScreen
                  ? 'col-span-full aspect-video max-h-[52vh]'
                  : 'aspect-video sm:aspect-square'
              } ${
                !voice.muted
                  ? 'border-[#23a55a]/70 shadow-[0_0_24px_rgba(35,165,90,0.22)]'
                  : 'border-[#2e3035]'
              }`}
              style={{
                background: `radial-gradient(circle at 50% 42%, ${selfTint}66 0%, #1c1d22 72%, #111214 100%)`,
              }}
            >
              {hasLocalVideo && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full ${
                    voice.screenSharing ? 'object-contain bg-black' : 'object-cover -scale-x-100'
                  }`}
                />
              )}
              {voice.videoOn && !voice.screenSharing && (
                <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-black/65 border border-white/15 text-[10.5px] font-bold text-[#23a55a] flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  <span>Cámara activa</span>
                </div>
              )}
              {voice.screenSharing && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full bg-[#5865F2] text-[10.5px] font-bold text-white flex items-center gap-1 shadow">
                  <Monitor className="w-3 h-3" />
                  <span>Compartiendo pantalla</span>
                </div>
              )}
              {!hasLocalVideo && (
                <div
                  className={`rounded-full p-1 transition-all ${
                    !voice.muted && !voice.deafened
                      ? 'ring-3 ring-[#23a55a] shadow-[0_0_22px_rgba(35,165,90,0.65)]'
                      : ''
                  }`}
                >
                  <UserAvatar
                    avatar={currentUser.avatar}
                    customAvatarUrl={currentUser.customAvatarUrl}
                    size="xl"
                    showStatus={false}
                  />
                </div>
              )}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 z-10 ${
                  hasLocalVideo ? 'absolute bottom-3 left-3' : ''
                }`}
              >
                <span className="text-sm font-bold text-white">{currentUser.displayName} (Tú)</span>
                {voice.muted && <MicOff className="w-3.5 h-3.5 text-[#f23f43]" />}
                {voice.deafened && <HeadphoneOff className="w-3.5 h-3.5 text-[#f23f43]" />}
              </div>
            </div>

            {voice.participants.map((p, idx) => {
              const pTint = getAvatarBackdrop(p.avatar);
              const isSpeaking = Boolean(p.speaking && !p.muted);
              const showRemoteVideoHere = idx === 0 && hasRemoteVideo;
              const spotlightRemote = idx === 0 && (Boolean(p.screenSharing) || (hasRemoteVideo && !voice.screenSharing));
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl border flex flex-col items-center justify-center gap-2.5 relative overflow-hidden transition-all ${
                    spotlightRemote ? 'col-span-full aspect-video max-h-[56vh]' : 'aspect-video sm:aspect-square'
                  } ${
                    isSpeaking
                      ? 'border-[#23a55a]/75 shadow-[0_0_24px_rgba(35,165,90,0.25)]'
                      : 'border-[#2e3035]'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 50% 42%, ${pTint}66 0%, #1c1d22 72%, #111214 100%)`,
                  }}
                >
                  {showRemoteVideoHere && (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full ${
                        p.screenSharing ? 'object-contain bg-black' : 'object-cover'
                      }`}
                    />
                  )}
                  {p.screenSharing && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full bg-[#5865F2] text-[10.5px] font-bold text-white flex items-center gap-1 shadow">
                      <Monitor className="w-3 h-3" />
                      <span>Pantalla en vivo</span>
                    </div>
                  )}
                  {p.videoOn && !p.screenSharing && (
                    <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-black/65 border border-white/15 text-[10.5px] font-bold text-sky-300 flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>Video en vivo</span>
                    </div>
                  )}
                  {!showRemoteVideoHere && (
                    <div
                      className={`rounded-full p-1 transition-all ${
                        isSpeaking ? 'ring-3 ring-[#23a55a] shadow-[0_0_22px_rgba(35,165,90,0.65)]' : ''
                      }`}
                    >
                      <UserAvatar
                        avatar={p.avatar}
                        customAvatarUrl={p.customAvatarUrl}
                        size="xl"
                        showStatus={false}
                      />
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/65 z-10 ${
                      showRemoteVideoHere ? 'absolute bottom-3 left-3' : ''
                    }`}
                  >
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    {p.muted && <MicOff className="w-3.5 h-3.5 text-[#f23f43]" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pb-3">
            {showSoundboard && (
              <div className="max-w-md mx-auto rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-3.5 space-y-2.5 animate-slideUp">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#5865F2]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Caja de resonancia (Soundboard)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSoundboard(false)}
                    className="text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SOUNDBOARD_CLIPS.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      onClick={() => triggerClip(clip.id, clip.label, clip.emoji)}
                      className="p-2.5 rounded-xl bg-[#26272f] hover:bg-[#31333d] border border-[#2e3035] flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <span className="text-xl">{clip.emoji}</span>
                      <span className="text-[11px] font-bold text-white">{clip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 sm:gap-3">
              <button
                onClick={onToggleVideo}
                title={voice.videoOn ? 'Apagar cámara' : 'Encender cámara'}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  voice.videoOn ? 'bg-white text-black' : 'bg-[#26272f] hover:bg-[#31333d] text-white'
                }`}
              >
                {voice.videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button
                onClick={onToggleScreen}
                title="Compartir pantalla"
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  voice.screenSharing ? 'bg-[#5865F2] text-white' : 'bg-[#26272f] hover:bg-[#31333d] text-white'
                }`}
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSoundboard((s) => !s)}
                title="Caja de resonancia"
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  showSoundboard ? 'bg-[#5865F2] text-white' : 'bg-[#26272f] hover:bg-[#31333d] text-white'
                }`}
              >
                <Music className="w-5 h-5" />
              </button>
              <button
                onClick={onToggleMute}
                title={voice.muted ? 'Activar micrófono' : 'Silenciar micrófono'}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  voice.muted ? 'bg-[#f23f43]/20 text-[#f23f43] border border-[#f23f43]/40' : 'bg-[#26272f] hover:bg-[#31333d] text-white'
                }`}
              >
                {voice.muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={onToggleDeafen}
                title={voice.deafened ? 'Activar audio' : 'Ensordecer'}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  voice.deafened ? 'bg-[#f23f43]/20 text-[#f23f43] border border-[#f23f43]/40' : 'bg-[#26272f] hover:bg-[#31333d] text-white'
                }`}
              >
                {voice.deafened ? (
                  <HeadphoneOff className="w-5 h-5" />
                ) : (
                  <Headphones className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => {
                  setExpanded(false);
                  onDisconnect();
                }}
                title="Colgar llamada"
                className="w-14 h-12 rounded-full bg-[#f23f43] hover:bg-[#d83337] text-white flex items-center justify-center cursor-pointer shadow-lg"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SERVER_ICON_COLORS = [
  '#5865F2',
  '#23a55a',
  '#ec4899',
  '#f59e0b',
  '#06b6d4',
  '#9333ea',
  '#ef4444',
];

const SERVER_ICON_EMOJIS = ['', '🚀', '🎮', '⚡', '💻', '🔥', '👑', '🎧'];

const DEFAULT_STARTER_ROLES: ServerRole[] = [
  {
    id: 'role-owner',
    name: '👑 Owner',
    color: '#f59e0b',
    hoist: true,
    permissions: ['Administrador'],
  },
  {
    id: 'role-mod',
    name: '🛡️ Moderador',
    color: '#38bdf8',
    hoist: true,
    permissions: ['Gestionar mensajes', 'Fijar mensajes'],
  },
  {
    id: 'role-member',
    name: '🎮 Miembro',
    color: '#4ade80',
    hoist: false,
    permissions: ['Leer canales', 'Enviar mensajes'],
  },
  {
    id: 'role-everyone',
    name: '@everyone',
    color: '#b5bac1',
    hoist: false,
    permissions: ['Leer canales', 'Enviar mensajes'],
  },
];

const ROLE_SWATCH_COLORS = ['#f59e0b', '#38bdf8', '#4ade80', '#f472b6', '#a855f7', '#ef4444'];

const downscaleIconFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_error'));
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      if (!raw) {
        reject(new Error('empty'));
        return;
      }
      if (file.type === 'image/gif' || file.type === 'image/svg+xml' || raw.length < 180000) {
        resolve(raw);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const maxSide = 256;
          const scale = Math.min(1, maxSide / Math.max(img.width || maxSide, img.height || maxSide));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(raw);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png', 0.9));
        } catch {
          resolve(raw);
        }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });

/* ---------------- CREATE SERVER MODAL ---------------- */
export const CreateServerModal: React.FC<{
  open: boolean;
  initialTemplate?: ServerTemplateId;
  onClose: () => void;
  onCreate: (payload: CreateServerPayload) => void;
}> = ({ open, initialTemplate = 'friends', onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState<'friends' | 'gaming'>(
    initialTemplate === 'gaming' ? 'gaming' : 'friends'
  );
  const [accentColor, setAccentColor] = useState('#5865F2');
  const [customEmoji, setCustomEmoji] = useState('🚀');
  const [customIconUrl, setCustomIconUrl] = useState<string | undefined>(undefined);
  const [rolesDraft, setRolesDraft] = useState<ServerRole[]>(DEFAULT_STARTER_ROLES);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#a855f7');
  const [iconError, setIconError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backdropDownRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setTemplateId(initialTemplate === 'gaming' ? 'gaming' : 'friends');
    setName('');
    setAccentColor(initialTemplate === 'gaming' ? '#23a55a' : '#5865F2');
    setCustomEmoji(initialTemplate === 'gaming' ? '🎮' : '🚀');
    setCustomIconUrl(undefined);
    setRolesDraft(DEFAULT_STARTER_ROLES.map((r) => ({ ...r, permissions: [...r.permissions] })));
    setNewRoleName('');
    setNewRoleColor('#a855f7');
    setIconError(null);
  }, [open, initialTemplate]);

  if (!open) return null;

  const placeholder = templateId === 'gaming' ? 'Squad Gaming' : 'Mi nuevo servidor';
  const previewShortCode = (name.trim() || placeholder)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const handleIconFile = async (file: File) => {
    setIconError(null);
    try {
      const dataUrl = await downscaleIconFile(file);
      setCustomIconUrl(dataUrl);
    } catch {
      setIconError('No se pudo cargar esa imagen. Prueba con PNG o JPG.');
    }
  };

  const moveRole = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= rolesDraft.length) return;
    setRolesDraft((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const addDraftRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    const newRole: ServerRole = {
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: trimmed,
      color: newRoleColor,
      hoist: true,
      permissions: ['Leer canales', 'Enviar mensajes'],
    };
    setRolesDraft((prev) => {
      const everyoneIdx = prev.findIndex((r) => r.id === 'role-everyone');
      if (everyoneIdx === -1) return [...prev, newRole];
      const next = [...prev];
      next.splice(everyoneIdx, 0, newRole);
      return next;
    });
    setNewRoleName('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || placeholder;
    onCreate({
      name: finalName,
      templateId,
      audience: templateId === 'gaming' ? 'community' : 'friends',
      accentColor,
      customIconUrl,
      customEmoji: customIconUrl ? undefined : customEmoji || undefined,
      chatTheme: 'black',
      chatMessageStyle: 'classic',
      includeBots: false,
      includeStarterRoles: true,
      includeVoiceChannels: true,
      starterRoles: rolesDraft,
    });
    setName('');
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => {
        backdropDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropDownRef.current) {
          onClose();
        }
        backdropDownRef.current = false;
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            const f = e.target.files?.[0];
            if (f) void handleIconFile(f);
            e.target.value = '';
          }}
        />

        {/* Sticky Modal Header */}
        <div className="px-5 pt-5 pb-3.5 flex items-start justify-between gap-2 border-b border-[var(--dc-border)] shrink-0">
          <div>
            <h3 className="font-display font-bold text-lg text-[var(--dc-text-primary)]">
              Crea tu servidor
            </h3>
            <p className="text-xs text-[var(--dc-text-secondary)] mt-0.5 leading-snug">
              Personaliza icono, plantilla, nombre y orden de roles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
          {/* Custom Server Icon Preview & Picker */}
          <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3.5 space-y-3">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
                aria-label="Seleccionar foto para el servidor"
                className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center font-display font-extrabold text-white text-xl shrink-0 border border-white/15 shadow-lg relative cursor-pointer hover:ring-2 hover:ring-[#5865F2] transition-all"
                style={
                  customIconUrl
                    ? undefined
                    : { background: `linear-gradient(135deg, ${accentColor} 0%, #11121a 100%)` }
                }
              >
                {customIconUrl ? (
                  <img src={customIconUrl} alt="Icono" className="w-full h-full object-cover" />
                ) : (
                  <span className={customEmoji ? 'text-2xl' : 'text-lg'}>
                    {customEmoji || previewShortCode}
                  </span>
                )}
              </button>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-bold text-[var(--dc-text-primary)]">
                  Icono del servidor
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dc-btn-primary text-[11px] font-bold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customIconUrl ? 'Cambiar foto' : 'Subir icono'}</span>
                  </button>
                  {customIconUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomIconUrl(undefined);
                      }}
                      className="px-2.5 py-1.5 rounded-full dc-btn-secondary text-[11px] font-semibold cursor-pointer"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
                {iconError && <p className="text-[11px] text-rose-400">{iconError}</p>}
              </div>
            </div>

            {!customIconUrl && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SERVER_ICON_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAccentColor(col)}
                      aria-label={`Color ${col}`}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        accentColor === col ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SERVER_ICON_EMOJIS.map((em) => (
                    <button
                      key={em || 'initials'}
                      type="button"
                      onClick={() => setCustomEmoji(em)}
                      className={`px-2 h-7 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors ${
                        customEmoji === em
                          ? 'bg-[#5865F2] text-white'
                          : 'bg-[var(--dc-bg-input)] text-[var(--dc-text-secondary)] hover:text-white'
                      }`}
                    >
                      {em || previewShortCode}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Template Selector */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setTemplateId('friends')}
              className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                templateId === 'friends'
                  ? 'border-[#5865F2] bg-[#5865F2]/15'
                  : 'border-[var(--dc-border)] bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)]'
              }`}
            >
              <span className="w-9 h-9 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-[var(--dc-text-primary)]">
                  Solo para pasar el rato
                </p>
                <p className="text-[11.5px] text-[var(--dc-text-muted)]">
                  Para mis amigos y para mí
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setTemplateId('gaming')}
              className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-colors cursor-pointer ${
                templateId === 'gaming'
                  ? 'border-[#5865F2] bg-[#5865F2]/15'
                  : 'border-[var(--dc-border)] bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)]'
              }`}
            >
              <span className="w-9 h-9 rounded-xl bg-[#23a55a] text-white flex items-center justify-center shrink-0">
                <Gamepad2 className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-[var(--dc-text-primary)]">
                  Para juegos
                </p>
                <p className="text-[11.5px] text-[var(--dc-text-muted)]">
                  Para un club o comunidad
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
            </button>
          </div>

          {/* Server Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--dc-text-muted)] block">
              Nombre del servidor
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--dc-text-primary)] focus:outline-none focus:border-[#5865F2]"
            />
          </div>

          {/* Role Hierarchy Ordering */}
          <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#8b95ff]" />
                <p className="text-xs font-bold text-[var(--dc-text-primary)]">
                  Ordenar roles ({rolesDraft.length})
                </p>
              </div>
              <span className="text-[10.5px] text-[var(--dc-text-muted)]">
                Mayor prioridad arriba
              </span>
            </div>

            <div className="divide-y divide-white/[0.06] rounded-xl bg-[var(--dc-bg-input)] border border-[var(--dc-border)] overflow-hidden">
              {rolesDraft.map((role, idx) => (
                <div
                  key={role.id}
                  className="px-2.5 py-2 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-[10.5px] font-bold text-[var(--dc-text-muted)] tabular-nums w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: role.color }}
                    />
                    <input
                      type="text"
                      value={role.name}
                      disabled={role.id === 'role-everyone'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRolesDraft((prev) =>
                          prev.map((item) =>
                            item.id === role.id ? { ...item, name: val } : item
                          )
                        );
                      }}
                      className="min-w-0 flex-1 bg-transparent text-xs font-semibold focus:outline-none disabled:opacity-75"
                      style={{ color: role.color }}
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveRole(idx, -1)}
                      aria-label={`Subir ${role.name}`}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/12 disabled:opacity-25 flex items-center justify-center text-zinc-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === rolesDraft.length - 1}
                      onClick={() => moveRole(idx, 1)}
                      aria-label={`Bajar ${role.name}`}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/12 disabled:opacity-25 flex items-center justify-center text-zinc-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {role.id !== 'role-owner' && role.id !== 'role-everyone' && (
                      <button
                        type="button"
                        onClick={() =>
                          setRolesDraft((prev) => prev.filter((item) => item.id !== role.id))
                        }
                        aria-label={`Eliminar ${role.name}`}
                        className="w-7 h-7 rounded-lg bg-rose-500/12 hover:bg-rose-500/25 flex items-center justify-center text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Role */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDraftRole();
                  }
                }}
                placeholder="Añadir rol nuevo..."
                className="flex-1 min-w-0 bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--dc-text-primary)] focus:outline-none focus:border-[#5865F2]"
              />
              <div className="flex items-center gap-1 shrink-0">
                {ROLE_SWATCH_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewRoleColor(c)}
                    className={`w-4.5 h-4.5 rounded-full cursor-pointer ${
                      newRoleColor === c ? 'ring-2 ring-white scale-110' : 'opacity-75'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color rol ${c}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addDraftRole}
                disabled={!newRoleName.trim()}
                className="px-2.5 py-1.5 rounded-xl dc-btn-secondary text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rol</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--dc-border)] flex justify-end gap-2 bg-[var(--dc-bg-sheet)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
          >
            Crear servidor
          </button>
        </div>
      </form>
    </div>
  );
};

/* ---------------- DISCOVER SERVERS MODAL ---------------- */
export const DiscoverModal: React.FC<{
  open: boolean;
  onClose: () => void;
  discoverableServers?: Server[];
  joinedServerIds?: string[];
  onLoadServers?: () => Promise<Server[]>;
  onJoinServer?: (serverIdOrInvite: string) => Promise<boolean>;
  onOpenCreateServer?: () => void;
}> = ({
  open,
  onClose,
  discoverableServers = [],
  joinedServerIds = [],
  onLoadServers,
  onJoinServer,
  onOpenCreateServer,
}) => {
  const [q, setQ] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [servers, setServers] = useState<Server[]>(discoverableServers);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const onLoadServersRef = useRef(onLoadServers);
  useEffect(() => {
    onLoadServersRef.current = onLoadServers;
  }, [onLoadServers]);

  useEffect(() => {
    if (!open) return;
    setJoinError(null);
    if (!onLoadServersRef.current) {
      setServers(discoverableServers);
      return;
    }
    let cancelled = false;
    setLoading(true);
    onLoadServersRef.current()
      .then((res) => {
        if (!cancelled) setServers(res);
      })
      .catch(() => {
        if (!cancelled) setServers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const lowerQ = q.trim().toLowerCase();
  const filtered = servers.filter(
    (s) =>
      !lowerQ ||
      s.name.toLowerCase().includes(lowerQ) ||
      (s.description || '').toLowerCase().includes(lowerQ)
  );

  const handleJoin = async (idOrInvite: string) => {
    if (!onJoinServer) return;
    setJoinError(null);
    const ok = await onJoinServer(idOrInvite);
    if (!ok) {
      setJoinError('No se encontró ese servidor o código de invitación.');
      return;
    }
    setQ('');
    setInviteCode('');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] p-5 space-y-4 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#23a55a]" />
            <h3 className="font-display font-bold text-lg text-[var(--dc-text-primary)]">
              Descubrir y unirse a servidores
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--dc-text-muted)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite code bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inviteCode.trim()) void handleJoin(inviteCode.trim());
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Código o ID de invitación (ej. srv-...)"
            className="flex-1 bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-xl px-3 py-2 text-xs text-[var(--dc-text-primary)] focus:outline-none focus:border-[#5865F2]"
          />
          <button
            type="submit"
            disabled={!inviteCode.trim()}
            className="px-3.5 py-2 rounded-xl dc-btn-primary text-xs font-bold disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            Unirse por ID
          </button>
        </form>

        <div className="flex items-center gap-2 bg-[var(--dc-bg-input)] rounded-xl px-3 py-2 border border-[var(--dc-border)] focus-within:border-[#5865F2]">
          <Search className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar servidores creados por usuarios..."
            className="flex-1 bg-transparent text-sm text-[var(--dc-text-primary)] focus:outline-none"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-[var(--dc-text-muted)] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {joinError && (
          <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2">
            {joinError}
          </p>
        )}

        <div className="flex-1 overflow-y-auto space-y-2.5">
          {loading ? (
            <p className="text-xs text-[var(--dc-text-muted)] text-center py-6">
              Cargando servidores reales...
            </p>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-[var(--dc-text-primary)]">
                No hay servidores públicos disponibles aún
              </p>
              <p className="text-xs text-[var(--dc-text-muted)]">
                Crea tu propio servidor o pide el ID de invitación a otro usuario real.
              </p>
              {onOpenCreateServer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateServer();
                  }}
                  className="px-4 py-2 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
                >
                  Crear mi servidor
                </button>
              )}
            </div>
          ) : (
            filtered.map((srv) => {
              const alreadyJoined = joinedServerIds.includes(srv.id);
              return (
                <div
                  key={srv.id}
                  className="p-3 rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-12 h-12 rounded-2xl overflow-hidden border border-white/15 shrink-0 flex items-center justify-center font-display font-bold text-white"
                      style={{ backgroundColor: srv.accentColor }}
                    >
                      {srv.customIconUrl ? (
                        <SafeImage src={srv.customIconUrl} alt={srv.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{srv.customEmoji || srv.shortCode}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-[var(--dc-text-primary)] truncate">
                        {srv.name}
                      </p>
                      <p className="text-xs text-[var(--dc-text-muted)] mt-0.5 line-clamp-1">
                        {srv.description || 'Servidor comunitario en Primordial'}
                      </p>
                      <p className="text-[11px] text-[#23a55a] font-semibold mt-1 tabular-nums">
                        {srv.memberCount} {srv.memberCount === 1 ? 'miembro' : 'miembros'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={alreadyJoined}
                    onClick={() => void handleJoin(srv.id)}
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 whitespace-nowrap ${
                      alreadyJoined
                        ? 'bg-white/10 text-zinc-400 cursor-default'
                        : 'dc-btn-success cursor-pointer'
                    }`}
                  >
                    {alreadyJoined ? 'Ya unido' : 'Unirse'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
