import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AvatarKey,
  DecorationId,
  NameplateId,
  PresenceStatus,
  ProfileEffectId,
  ProfileFrameId,
  Server,
} from '../types/discord';

export const GENERATED_ASSETS = {
  madaraAvatar: '/src/assets/images/avatar_black_cat_1795349127144.jpg',
  snufAvatar: '/src/assets/images/avatar_tokyo_car_1795349126950.jpg',
  alexAvatar: '/src/assets/images/avatar_rooftop_dusk_1795349127113.jpg',
  joawasaAvatar: '/src/assets/images/avatar_shiba_portrait_1795349127656.jpg',
  dragonAvatar: '/src/assets/images/avatar_alpine_monolith_1795349126857.jpg',
  coffeeAvatar: '/src/assets/images/avatar_desk_coffee_1795349126809.jpg',
  hoyoverseIcon: '/src/assets/images/server_hoyoverse_1795280758930.jpg',
  reboIcon: '/src/assets/images/server_rebo_1795280759300.jpg',
  viceCityBanner: '/src/assets/images/banner_vice_city_1795280073889.jpg',
  zzzEllenBanner: '/src/assets/images/banner_zzz_ellen_1795280074875.jpg',
  deadpoolBanner: '/src/assets/images/banner_deadpool_duo_1795280758288.jpg',
  dbdBanner: '/src/assets/images/banner_dbd_1795280075129.jpg',
  duneBanner: '/src/assets/images/banner_dune_1795280073636.jpg',
  monopolyBanner: '/src/assets/images/banner_monopoly_city_1795280759244.jpg',
  shopMiyabiArt: '/src/assets/images/shop_miyabi_art_1795281106262.jpg',
  shopEllenArt: '/src/assets/images/shop_ellen_art_1795281108333.jpg',
  shopBurniceArt: '/src/assets/images/shop_burnice_art_1795281108082.jpg',
  shopLofiPlants: '/src/assets/images/shop_lofi_plants_1795281107687.jpg',
  shopCozyCat: '/src/assets/images/shop_cozy_cat_1795281108030.jpg',
  shopTrappedSouls: '/src/assets/images/shop_trapped_souls_1795281108312.jpg',
  shopObserverEyes: '/src/assets/images/shop_observer_eyes_1795281108045.jpg',
  shopGojoArt: '/src/assets/images/shop_gojo_art_1795286602337.jpg',
  shopSukunaArt: '/src/assets/images/shop_sukuna_art_1795286601954.jpg',
  shopYujiArt: '/src/assets/images/shop_yuji_art_1795286603030.jpg',
  shopCerberoArt: '/src/assets/images/shop_cerbero_art_1795286601612.jpg',
  shopLlamaInfernal: '/src/assets/images/shop_llama_infernal_1795286603800.jpg',
  shopRamaEnFlor: '/src/assets/images/shop_rama_en_flor_1795286601745.jpg',
  shopCondenacionEterna: '/src/assets/images/shop_condenacion_eterna_1795286601053.jpg',
  shopVamosAJugar: '/src/assets/images/shop_vamos_a_jugar_1795286601846.jpg',
  shopEspectroArt: '/src/assets/images/shop_espectro_art_1795286601969.jpg',
  shopGrabadoJapones: '/src/assets/images/shop_grabado_japones_1795286602758.jpg',
  shopLoboLuna: '/src/assets/images/shop_lobo_luna_1795286603884.jpg',
  shopPatoArt: '/src/assets/images/shop_el_mismo_pato_1795286960166.jpg',
  shopVaderArt: '/src/assets/images/shop_darth_vader_1795286979020.jpg',
  shopPesadillaArt: '/src/assets/images/shop_hora_pesadilla_1795286960539.jpg',
  zenithIcon: '/src/assets/images/server_zenith_icon_1795298975258.jpg',
  zenithBanner: '/src/assets/images/server_zenith_banner_1795298975451.jpg',
  shopCromaArt: '/src/assets/images/shop_croma_art_1795298975319.jpg',
  shopOrejasGato: '/src/assets/images/shop_orejas_gato_1795298975480.jpg',
  questBadgesBanner: '/src/assets/images/quest_badges_banner_1795298975739.jpg',
  questExterminautsBanner: '/src/assets/images/quest_exterminauts_banner_1795298975841.jpg',
  aldeaRoleplayIcon: '/src/assets/images/game_aldea_roleplay_1795298975176.jpg',
  boostPerksShowcase: '/src/assets/images/boost_perks_showcase_1795298974887.jpg',
  decoRingPesadilla: '/src/assets/images/deco_ring_pesadilla_1795335721769.jpg',
  decoRingGojo: '/src/assets/images/deco_ring_gojo_1795335722890.jpg',
  decoRingSukuna: '/src/assets/images/deco_ring_sukuna_1795335722623.jpg',
  decoRingGrabado: '/src/assets/images/deco_ring_grabado_1795335722748.jpg',
  decoRingLobo: '/src/assets/images/deco_ring_lobo_1795335722058.jpg',
  shopBannerBonanza: '/src/assets/images/shop_banner_bonanza_1795352099929.jpg',
  shopBannerBorderlands: '/src/assets/images/shop_banner_borderlands_1795352100556.jpg',
  shopBannerSecretGarden: '/src/assets/images/shop_banner_secret_garden_1795352099587.jpg',
  shopBannerRawrXd: '/src/assets/images/shop_banner_rawr_xd_1795352099144.jpg',
  shopMothmanArt: '/src/assets/images/shop_mothman_art_1795352099690.jpg',
  shopMoonflowersArt: '/src/assets/images/shop_moonflowers_art_1795352099282.jpg',
  shopJerseyDevilArt: '/src/assets/images/shop_jersey_devil_art_1795352099050.jpg',
  shopLloronaArt: '/src/assets/images/shop_llorona_art_1795352099493.jpg',
  shopWaterStalkerArt: '/src/assets/images/shop_water_stalker_art_1795352100251.jpg',
  shopDbdHookArt: '/src/assets/images/shop_dbd_hook_art_1795352099003.jpg',
  shopDbdBloodwebArt: '/src/assets/images/shop_dbd_bloodweb_art_1795352099142.jpg',
  shopStrawberryBunnyArt: '/src/assets/images/shop_strawberry_bunny_art_1795352099320.jpg',
  shopCelestialMoonArt: '/src/assets/images/shop_celestial_moon_art_1795352098726.jpg',
  shopRawrSceneArt: '/src/assets/images/shop_rawr_scene_art_1795352102034.jpg',
};

export const SafeImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackGradient?: string;
  fallbackLabel?: string;
}> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  style,
  fallbackGradient = 'from-indigo-950 via-slate-900 to-zinc-950',
  fallbackLabel,
}) => {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center ${className}`}
        style={style}
      >
        {fallbackLabel && (
          <span className="font-display font-bold text-white/80 text-xs">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
      style={style}
    />
  );
};

export const PrimordialAppIcon: React.FC<{ className?: string }> = ({
  className = 'w-16 h-16 rounded-2xl',
}) => (
  <img
    src="/icon-192.png?v=2"
    alt="Primordial"
    className={`object-cover select-none ${className}`}
  />
);

export const DiscordLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 127.14 96.36" fill="currentColor" className={className} aria-hidden="true">
    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
  </svg>
);

export const NitroWheelIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    {/* Speed wing bars cleanly merged to the wheel without overlapping the hollow center */}
    <path d="M3.2 5.2h9.2v2.4H4.6a1.2 1.2 0 0 1-1.4-2.4ZM1.8 9.2h6.8v2.2H3a1.1 1.1 0 0 1-1.2-2.2ZM4.4 13h3.9v2H5.4a1 1 0 0 1-1-2Z" />
    {/* Precision hollow wheel + center hub */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.2 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 3.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"
    />
    <circle cx="14.2" cy="12" r="1.95" />
  </svg>
);

export const OrbsCrystalIcon: React.FC<{ className?: string; colored?: boolean }> = ({
  className = 'w-5 h-5',
  colored = false,
}) =>
  colored ? (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="#18181f" stroke="url(#orbGrad)" strokeWidth="2.5" />
      <polygon points="24,8 37,16 37,32 24,40 11,32 11,16" fill="url(#orbGrad)" opacity="0.9" />
      <path d="M24 14 L27 21 L34 24 L27 27 L24 34 L21 27 L14 24 L21 21 Z" fill="#ffffff" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm0 4.2l1.6 4.2L17.8 12l-4.2 1.6L12 17.8l-1.6-4.2L6.2 12l4.2-1.6L12 6.2z" />
    </svg>
  );

export const LaurelQuestIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    {/* Symmetrical Left Wreath Branch */}
    <path d="M11.1 19.3C7.1 18.8 4.4 15.6 4.4 11.4c0-2.5.9-4.7 2.5-6.4.4-.4 1-.3 1.2.2.3.9-.1 2-.9 2.6-.9.7-1.4 1.9-1.4 3.4 0 3.3 2.2 5.9 5.5 6.4.4.1.7.5.6.9-.1.5-.4.9-.8.8Z" />
    <path d="M7.1 8.4c-1.5-.1-2.8-1-3.2-2.3-.1-.4.2-.8.6-.7 1.3.2 2.4 1.2 2.9 2.5.1.3-.1.6-.3.5Z" />
    <path d="M5.6 12.1c-1.5.2-2.9-.5-3.6-1.8-.2-.4.1-.8.5-.8 1.3 0 2.5.8 3.3 2 .2.3 0 .6-.2.6Z" />
    <path d="M6.4 15.6c-1.4.6-3 .3-4-.8-.3-.3-.1-.8.3-.9 1.3-.3 2.7.2 3.8 1.2.2.2.1.4-.1.5Z" />
    <path d="M8.9 18.2c-1.1 1-2.7 1.2-4 .5-.4-.2-.3-.7.1-.9 1.2-.6 2.6-.5 3.8.1.3.1.3.3.1.3Z" />

    {/* Symmetrical Right Wreath Branch (mirrored around x = 12) */}
    <path d="M12.9 19.3c4-.5 6.7-3.7 6.7-7.9 0-2.5-.9-4.7-2.5-6.4-.4-.4-1-.3-1.2.2-.3.9.1 2 .9 2.6.9.7 1.4 1.9 1.4 3.4 0 3.3-2.2 5.9-5.5 6.4-.4.1-.7.5-.6.9.1.5.4.9.8.8Z" />
    <path d="M16.9 8.4c1.5-.1 2.8-1 3.2-2.3.1-.4-.2-.8-.6-.7-1.3.2-2.4 1.2-2.9 2.5-.1.3.1.6.3.5Z" />
    <path d="M18.4 12.1c1.5.2 2.9-.5 3.6-1.8.2-.4-.1-.8-.5-.8-1.3 0-2.5.8-3.3 2-.2.3 0 .6.2.6Z" />
    <path d="M17.6 15.6c1.4.6 3 .3 4-.8.3-.3.1-.8-.3-.9-1.3-.3-2.7.2-3.8 1.2-.2.2-.1.4.1.5Z" />
    <path d="M15.1 18.2c1.1 1 2.7 1.2 4 .5.4-.2.3-.7-.1-.9-1.2-.6-2.6-.5-3.8.1-.3.1-.3.3-.1.3Z" />

    {/* Clean Joined Stem Base */}
    <path d="M9.4 20.1c1.7.7 3.5.7 5.2 0a.75.75 0 0 0-.56-1.39c-1.34.54-2.74.54-4.08 0a.75.75 0 0 0-.56 1.39Z" />
  </svg>
);

export const FilledStoreIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    {/* Symmetrical 4-Scallop Storefront Awning (centered at x=12, width 18: 3..21) */}
    <path d="M5.2 3.6h13.6Q20.1 3.6 20.4 4.8L21 8.8a2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0 2.25 2.25 0 0 1-4.5 0l.6-4Q3.9 3.6 5.2 3.6Z" />
    {/* Symmetrical Store Facade with Clean Arched Doorway Cutout */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.5 12.2h15v6.3a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-6.3Zm5.3 8.3v-4.2a2.2 2.2 0 0 1 4.4 0v4.2H9.8Z"
    />
  </svg>
);

export const FilledSettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.56 2.35a1.5 1.5 0 0 1 2.88 0l.4 1.48c.5.14.98.34 1.43.59l1.33-.76a1.5 1.5 0 0 1 2.04.56l1.44 2.5a1.5 1.5 0 0 1-.55 2.04l-1.3.76c.07.5.07 1.02 0 1.52l1.3.76a1.5 1.5 0 0 1 .55 2.04l-1.44 2.5a1.5 1.5 0 0 1-2.04.56l-1.33-.76c-.45.25-.93.45-1.43.59l-.4 1.48a1.5 1.5 0 0 1-2.88 0l-.4-1.48a6.8 6.8 0 0 1-1.43-.59l-1.33.76a1.5 1.5 0 0 1-2.04-.56l-1.44-2.5a1.5 1.5 0 0 1 .55-2.04l1.3-.76a6.7 6.7 0 0 1 0-1.52l-1.3-.76a1.5 1.5 0 0 1-.55-2.04l1.44-2.5a1.5 1.5 0 0 1 2.04-.56l1.33.76c.45-.25.93-.45 1.43-.59l.4-1.48ZM12 8.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
    />
  </svg>
);

export const StatusIndicator: React.FC<{
  status: PresenceStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  borderColor?: string;
}> = ({ status, size = 'sm', borderColor = 'var(--dc-bg-sidebar)' }) => {
  const dim =
    size === 'xs'
      ? 'w-3 h-3 border-[2.5px] border-solid'
      : size === 'sm'
      ? 'w-3.5 h-3.5 border-[2.5px] border-solid'
      : size === 'md'
      ? 'w-[18px] h-[18px] border-[3.5px] border-solid'
      : 'w-5 h-5 border-[4px] border-solid';

  if (status === 'online') {
    return (
      <span
        style={{ borderColor }}
        className={`${dim} rounded-full bg-[#23a55a] inline-block shrink-0`}
        title="En línea"
      />
    );
  }
  if (status === 'dnd') {
    return (
      <span
        style={{ borderColor }}
        className={`${dim} rounded-full bg-[#da373c] inline-flex items-center justify-center shrink-0`}
        title="No molestar"
      >
        <span className="w-[55%] h-[2px] bg-white rounded-full" />
      </span>
    );
  }
  if (status === 'idle') {
    return (
      <span
        style={{ borderColor }}
        className={`${dim} rounded-full bg-[#f0b232] inline-flex items-center justify-center shrink-0 relative`}
        title="Ausente"
      >
        <span
          style={{ backgroundColor: borderColor }}
          className="w-[45%] h-[45%] rounded-full absolute -top-[1px] -left-[1px]"
        />
      </span>
    );
  }
  return (
    <span
      style={{ borderColor }}
      className={`${dim} rounded-full bg-[#80848e] inline-flex items-center justify-center shrink-0`}
      title="Desconectado"
    >
      <span style={{ backgroundColor: borderColor }} className="w-[46%] h-[46%] rounded-full" />
    </span>
  );
};

export const AvatarArtwork: React.FC<{ avatar: AvatarKey; className?: string }> = ({
  avatar,
  className = 'w-full h-full',
}) => {
  switch (avatar) {
    case 'madara':
      return (
        <img
          src={GENERATED_ASSETS.madaraAvatar}
          alt="Avatar Gato Noir"
          referrerPolicy="no-referrer"
          className={`${className} object-cover`}
        />
      );
    case 'snuf':
      return (
        <img
          src={GENERATED_ASSETS.snufAvatar}
          alt="Avatar Tokyo Night"
          referrerPolicy="no-referrer"
          className={`${className} object-cover`}
        />
      );
    case 'alex':
      return (
        <img
          src={GENERATED_ASSETS.alexAvatar}
          alt="Avatar Atardecer"
          referrerPolicy="no-referrer"
          className={`${className} object-cover`}
        />
      );
    case 'joawasa':
      return (
        <img
          src={GENERATED_ASSETS.joawasaAvatar}
          alt="Avatar Shiba Inu"
          referrerPolicy="no-referrer"
          className={`${className} object-cover`}
        />
      );
    case 'dragon':
      return (
        <img
          src={GENERATED_ASSETS.dragonAvatar}
          alt="Avatar Cumbre B&N"
          referrerPolicy="no-referrer"
          className={`${className} object-cover scale-110`}
        />
      );
    case 'coffee':
    case 'phibi':
      return (
        <img
          src={GENERATED_ASSETS.coffeeAvatar}
          alt="Avatar Café y Vinilo"
          referrerPolicy="no-referrer"
          className={`${className} object-cover`}
        />
      );
    case 'locke':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="lockeClean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#lockeClean)" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="30"
            fontWeight="800"
            fontFamily="sans-serif"
            letterSpacing="-1"
          >
            LK
          </text>
        </svg>
      );
    case 'bumper':
    case 'yourbot':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id={`botClean-${avatar}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={avatar === 'bumper' ? '#2563eb' : '#4f46e5'} />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#botClean-${avatar})`} />
          <rect x="26" y="32" width="48" height="36" rx="12" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="41" cy="50" r="4.5" fill="#e0f2fe" />
          <circle cx="59" cy="50" r="4.5" fill="#e0f2fe" />
        </svg>
      );
    case 'discrofy':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="discrofyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2c2f36" />
              <stop offset="100%" stopColor="#16171b" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#discrofyGrad)" />
          <circle cx="50" cy="50" r="36" fill="#23252b" stroke="#3f424b" strokeWidth="2" />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fill="#e4e4e7"
            fontSize="14.5"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            Discrofy
          </text>
        </svg>
      );
    case 'dev':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="devGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#devGrad)" />
          <g transform="translate(22, 27) scale(0.44)" fill="#ffffff">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
          </g>
        </svg>
      );
    case 'welcomer':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="welcGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#welcGrad)" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="30"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            W
          </text>
        </svg>
      );
    case 'carioca':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="cariocaClean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#831843" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#cariocaClean)" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="30"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            CR
          </text>
        </svg>
      );
    case 'jorge':
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="jorgeClean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#881337" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#jorgeClean)" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="30"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            JG
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <defs>
            <linearGradient id="defaultClean" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5865F2" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#defaultClean)" />
          <g transform="translate(22, 27) scale(0.44)" fill="#ffffff">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
          </g>
        </svg>
      );
  }
};

export const AvatarDecorationRing: React.FC<{
  decoration: DecorationId;
  accentColor?: string;
}> = ({ decoration, accentColor }) => {
  if (decoration === 'none') return null;

  /* 1. Hoshimi Miyabi — Glacial Cyan Foxfire Halo, Kitsune Eye & Frost Talisman */
  if (decoration === 'miyabi') {
    return (
      <div className="absolute -inset-[22%] w-[144%] h-[144%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="miyabiFlameGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="45%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="miyabiScarfGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#09090b" />
              <stop offset="50%" stopColor="#27272a" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <filter id="miyabiGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#miyabiFlameGrad)" strokeWidth="2.2" opacity="0.65" />
          <g className="anim-flame" filter="url(#miyabiGlow)">
            <path
              d="M14 48 Q20 10 62 7 Q89 9 102 26 Q81 15 56 20 Q33 25 14 48 Z"
              fill="url(#miyabiFlameGrad)"
              opacity="0.95"
            />
            <path d="M24 26 Q47 3 80 13 Q57 10 38 22 Z" fill="#ecfeff" opacity="0.82" />
            <path d="M98 76 Q92 103 60 112 Q84 98 94 74 Z" fill="#22d3ee" opacity="0.7" />
          </g>
          {/* Floating Kitsune Spirit Mask */}
          <g className="anim-float">
            <circle cx="95" cy="28" r="14" fill="#09090b" stroke="#22d3ee" strokeWidth="2.2" />
            <circle cx="95" cy="28" r="11" fill="none" stroke="#67e8f9" strokeWidth="0.7" opacity="0.6" />
            <path d="M84 15 L89 21 M104 15 L99 21" stroke="#22d3ee" strokeWidth="2.6" strokeLinecap="round" />
            <g className="anim-eye-blink">
              <ellipse cx="95" cy="29" rx="7.2" ry="4" fill="#ef4444" />
              <ellipse cx="95" cy="29" rx="3" ry="3.8" fill="#09090b" />
              <circle cx="96.5" cy="27.5" r="1.1" fill="#ffffff" />
            </g>
          </g>
          {/* Traditional Hairpin & Collar */}
          <path d="M22 92 Q60 115 98 92" stroke="url(#miyabiScarfGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M26 92 Q60 111 94 92" stroke="#52525b" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="44" y="96" width="32" height="10" rx="5" fill="#f4f4f5" stroke="#18181b" strokeWidth="1.8" />
          <line x1="55" y1="97" x2="55" y2="105" stroke="#18181b" strokeWidth="1.4" />
          <line x1="65" y1="97" x2="65" y2="105" stroke="#18181b" strokeWidth="1.4" />
          {/* Frost Talisman */}
          <g className="anim-sway">
            <rect
              x="7"
              y="66"
              width="16"
              height="19"
              rx="2.5"
              fill="#f4f4f5"
              stroke="#18181b"
              strokeWidth="1.5"
              transform="rotate(-14 15 75)"
            />
            <path d="M12 70 L18 70 M15 70 L15 80 M12 75 L18 75" stroke="#0891b2" strokeWidth="1.8" strokeLinecap="round" transform="rotate(-14 15 75)" />
          </g>
        </svg>
      </div>
    );
  }

  /* 2. Ellen Joe — Shark Maid Headband, Dorsal Teeth & Crimson Tail Accent */
  if (decoration === 'ellen') {
    return (
      <div className="absolute -inset-[20%] w-[140%] h-[140%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="ellenRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#e4e4e7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#ellenRing)" strokeWidth="2.5" opacity="0.7" />
          <g className="anim-float">
            <path d="M16 40 Q60 -2 104 40" stroke="#f8fafc" strokeWidth="9" fill="none" strokeLinecap="round" />
            <path d="M20 39 Q60 2 100 39" stroke="#e11d48" strokeWidth="3" fill="none" strokeLinecap="round" />
            <polygon points="31,27 39,40 47,24" fill="#ffffff" stroke="#18181b" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="52,17 60,33 68,17" fill="#ffffff" stroke="#18181b" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="73,24 81,40 89,27" fill="#ffffff" stroke="#18181b" strokeWidth="1.2" strokeLinejoin="round" />
          </g>
          <path d="M22 86 Q60 117 98 86" stroke="#09090b" strokeWidth="8.5" fill="none" strokeLinecap="round" />
          <path d="M25 86 Q60 114 95 86" stroke="#27272a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <polygon points="38,96 45,83 52,99" fill="#f8fafc" stroke="#18181b" strokeWidth="1" />
          <polygon points="68,99 75,83 82,96" fill="#f8fafc" stroke="#18181b" strokeWidth="1" />
          <circle cx="96" cy="84" r="7.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.8" />
          <circle cx="96" cy="84" r="2.6" fill="#fef2f2" />
        </svg>
      </div>
    );
  }

  /* 3. Burnice White — Nitro-Fuel Blazing Pyromaniac Corona */
  if (decoration === 'burnice') {
    return (
      <div className="absolute -inset-[24%] w-[148%] h-[148%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="burniceRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="38%" stopColor="#fb923c" />
              <stop offset="75%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <filter id="burniceGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="anim-ember" filter="url(#burniceGlow)">
            <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#burniceRing)" strokeWidth="5" />
            <circle cx="60" cy="60" r="47" fill="none" stroke="#fef08a" strokeWidth="1.2" opacity="0.75" />
            <path d="M13 52 Q2 18 33 7 Q23 23 36 27 Q20 33 13 52 Z" fill="url(#burniceRing)" />
            <path d="M107 52 Q118 18 87 7 Q97 23 84 27 Q100 33 107 52 Z" fill="url(#burniceRing)" />
            <path d="M48 11 Q60 -3 72 11 Q60 15 48 11 Z" fill="#fef08a" />
          </g>
          <g className="anim-flame">
            <path d="M22 96 Q16 86 24 81 Q31 86 22 96 Z" fill="#fde047" />
            <path d="M98 96 Q91 86 99 81 Q106 86 98 96 Z" fill="#fb923c" />
            <circle cx="60" cy="112" r="3.2" fill="#fef08a" />
          </g>
        </svg>
      </div>
    );
  }

  /* 4. Lofi Plants — Botanical Terrarium Vine & Morning Dew Ring */
  if (decoration === 'plantas' || decoration === 'lofi') {
    return (
      <div className="absolute -inset-[20%] w-[140%] h-[140%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-sway">
          <defs>
            <linearGradient id="lofiVineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="50%" stopColor="#4d7c0f" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#lofiVineGrad)" strokeWidth="4.2" opacity="0.95" />
          <path d="M18 42 Q32 8 64 11 Q95 15 102 48" stroke="#84cc16" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M20 76 Q32 108 62 108 Q92 106 100 76" stroke="#84cc16" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.9" />
          <ellipse cx="21" cy="46" rx="7" ry="10.5" fill="#65a30d" stroke="#365314" strokeWidth="1" transform="rotate(-24 21 46)" />
          <ellipse cx="15" cy="68" rx="6" ry="9" fill="#84cc16" stroke="#365314" strokeWidth="1" transform="rotate(14 15 68)" />
          <ellipse cx="99" cy="44" rx="7" ry="10.5" fill="#4d7c0f" stroke="#365314" strokeWidth="1" transform="rotate(24 99 44)" />
          <ellipse cx="101" cy="67" rx="6" ry="9" fill="#65a30d" stroke="#365314" strokeWidth="1" transform="rotate(-14 101 67)" />
          <circle cx="50" cy="12" r="5.2" fill="#fef08a" />
          <circle cx="50" cy="12" r="2.2" fill="#f97316" />
          <circle cx="78" cy="17" r="4.2" fill="#fde047" />
          <circle cx="78" cy="17" r="1.8" fill="#ea580c" />
          <circle cx="88" cy="98" r="4.5" fill="#7dd3fc" opacity="0.92" />
        </svg>
      </div>
    );
  }

  /* 5. Onda cromática — Studio Liquid Iridescent Prism Swirl */
  if (decoration === 'croma') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-spin-slow"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 42%, rgba(0,0,0,0.9) 50%, black 66%, transparent 94%)',
            maskImage:
              'radial-gradient(circle, transparent 42%, rgba(0,0,0,0.9) 50%, black 66%, transparent 94%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.35) contrast(1.12) drop-shadow(0 0 14px rgba(168,85,247,0.75))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopCromaArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="cromaRim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="44.5" fill="none" stroke="url(#cromaRim)" strokeWidth="1.6" opacity="0.85" />
          <g className="anim-twinkle">
            <path d="M98 20 L100 25 L105 27 L100 29 L98 34 L96 29 L91 27 L96 25 Z" fill="#ffffff" />
            <path d="M22 92 L23.5 95.5 L27 97 L23.5 98.5 L22 102 L20.5 98.5 L17 97 L20.5 95.5 Z" fill="#e879f9" />
          </g>
        </svg>
      </div>
    );
  }

  /* 6. Gato cómodo — Sleeping Ginger Tabby Purring Above Avatar */
  if (decoration === 'gato') {
    return (
      <div className="absolute -inset-[21%] w-[142%] h-[142%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
          <defs>
            <linearGradient id="tabbyFur" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50" fill="none" stroke="#fb923c" strokeWidth="2.5" opacity="0.5" />
          <ellipse cx="60" cy="19" rx="25" ry="13.5" fill="url(#tabbyFur)" stroke="#7c2d12" strokeWidth="1.6" />
          <path d="M47 11 Q51 19 47 26 M58 9 Q62 19 58 27 M69 10 Q73 19 69 26" stroke="#7c2d12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <polygon points="41,14 46,2 54,12" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.4" strokeLinejoin="round" />
          <polygon points="66,12 74,2 79,14" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.4" strokeLinejoin="round" />
          <polygon points="44,12 47,5 51,11" fill="#fed7aa" />
          <polygon points="69,11 73,5 76,12" fill="#fed7aa" />
          <path d="M49 19 Q53 22 57 19 M63 19 Q67 22 71 19" stroke="#fef3c7" strokeWidth="1.9" fill="none" strokeLinecap="round" />
          <path d="M82 22 Q100 26 94 40" stroke="#c2410c" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <text x="90" y="13" fill="#fde047" fontSize="9.5" fontWeight="900">
            Zzz
          </text>
        </svg>
      </div>
    );
  }

  /* 7. Alex Cyber HUD Ring */
  if (decoration === 'alex') {
    return (
      <div className="absolute -inset-[21%] w-[142%] h-[142%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="alexRingGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <g className="anim-spin-slow" style={{ transformOrigin: '60px 60px' }}>
            <circle cx="60" cy="60" r="51" fill="none" stroke="url(#alexRingGrad)" strokeWidth="3.8" strokeDasharray="24 6 6 6" />
            <circle cx="96" cy="24" r="4.5" fill="#fbbf24" stroke="#09090b" strokeWidth="1.2" />
            <circle cx="24" cy="96" r="4" fill="#38bdf8" stroke="#09090b" strokeWidth="1.2" />
          </g>
          <g className="anim-spin-reverse" style={{ transformOrigin: '60px 60px' }}>
            <circle cx="60" cy="60" r="55" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="10 14" opacity="0.6" />
          </g>
        </svg>
      </div>
    );
  }

  /* 8. Marvel Deadpool & Wolverine — Crossed Adamantium Claws & Twin Forged Katanas */
  if (decoration === 'deadpool' || decoration === 'wolverine') {
    const isWolv = decoration === 'wolverine';
    return (
      <div className="absolute -inset-[23%] w-[146%] h-[146%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="katanaSteel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#cbd5e1" />
              <stop offset="85%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="adamantium" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>
          </defs>
          {isWolv ? (
            <g className="anim-ember">
              <circle cx="60" cy="60" r="50.5" fill="none" stroke="#eab308" strokeWidth="4.2" />
              <circle cx="60" cy="60" r="47" fill="none" stroke="#fef08a" strokeWidth="1.2" opacity="0.7" />
              <path d="M8 28 L37 45 M5 37 L34 52 M14 18 L41 37" stroke="#09090b" strokeWidth="6.4" strokeLinecap="round" />
              <path d="M8 28 L37 45 M5 37 L34 52 M14 18 L41 37" stroke="url(#adamantium)" strokeWidth="3.6" strokeLinecap="round" />
              <path d="M112 28 L83 45 M115 37 L86 52 M106 18 L79 37" stroke="#09090b" strokeWidth="6.4" strokeLinecap="round" />
              <path d="M112 28 L83 45 M115 37 L86 52 M106 18 L79 37" stroke="url(#adamantium)" strokeWidth="3.6" strokeLinecap="round" />
              <polygon points="56,6 64,6 60,15" fill="#fde047" />
            </g>
          ) : (
            <g className="anim-ember">
              {/* Crossed Katanas behind circle */}
              <line x1="10" y1="10" x2="110" y2="110" stroke="#09090b" strokeWidth="7.5" strokeLinecap="round" />
              <line x1="10" y1="10" x2="110" y2="110" stroke="url(#katanaSteel)" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="110" y1="10" x2="10" y2="110" stroke="#09090b" strokeWidth="7.5" strokeLinecap="round" />
              <line x1="110" y1="10" x2="10" y2="110" stroke="url(#katanaSteel)" strokeWidth="4.2" strokeLinecap="round" />
              {/* Katana Tsuba Guards */}
              <rect x="8" y="16" width="12" height="3.5" rx="1.5" fill="#facc15" transform="rotate(-45 14 18)" />
              <rect x="100" y="16" width="12" height="3.5" rx="1.5" fill="#facc15" transform="rotate(45 106 18)" />
              <circle cx="60" cy="60" r="50.5" fill="none" stroke="#dc2626" strokeWidth="4.8" />
              <circle cx="60" cy="60" r="47" fill="none" stroke="#fecaca" strokeWidth="1" opacity="0.7" />
              <circle cx="60" cy="109" r="5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  /* 9. Dead by Daylight — The Entity's Jagged Claw Ring & Embers */
  if (decoration === 'dbd') {
    return (
      <div className="absolute -inset-[23%] w-[146%] h-[146%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ember">
          <defs>
            <linearGradient id="dbdFireRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="url(#dbdFireRing)" strokeWidth="4.2" />
          <circle cx="60" cy="60" r="47" fill="none" stroke="#fed7aa" strokeWidth="0.9" strokeDasharray="12 6" opacity="0.6" />
          <path d="M10 22 Q20 35 34 45 L20 38 Z" fill="#ea580c" stroke="#09090b" strokeWidth="1.4" />
          <path d="M110 22 Q100 35 86 45 L100 38 Z" fill="#dc2626" stroke="#09090b" strokeWidth="1.4" />
          <path d="M12 96 Q24 85 35 76 L24 91 Z" fill="#f97316" stroke="#09090b" strokeWidth="1.4" />
          <path d="M108 96 Q96 85 85 76 L96 91 Z" fill="#ea580c" stroke="#09090b" strokeWidth="1.4" />
          <circle cx="26" cy="14" r="2.6" fill="#fde047" />
          <circle cx="96" cy="92" r="2.6" fill="#fb923c" />
          <circle cx="60" cy="8" r="2.4" fill="#fca5a5" />
        </svg>
      </div>
    );
  }

  /* 10. Almas atrapadas / Observador — Spectral Eyes & Reaching Ink Hands */
  if (decoration === 'almas' || decoration === 'observador') {
    const isSouls = decoration === 'almas';
    return (
      <div className="absolute -inset-[23%] w-[146%] h-[146%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ghost">
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="#e4e4e7" strokeWidth="2.8" strokeDasharray="16 5 5 5" opacity="0.85" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="#71717a" strokeWidth="1" strokeDasharray="6 8" opacity="0.55" />
          {isSouls ? (
            <>
              {/* Reaching Spectral Hands */}
              <path d="M14 78 L8 60 M18 76 L14 55 M22 76 L21 56 M26 78 L27 60" stroke="#e4e4e7" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M14 78 Q20 88 28 82" fill="#e4e4e7" stroke="#09090b" strokeWidth="1.2" />
              <path d="M94 42 L91 23 M99 41 L99 20 M104 42 L106 23 M108 45 L112 28" stroke="#f4f4f5" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M93 43 Q101 52 109 45" fill="#f4f4f5" stroke="#09090b" strokeWidth="1.2" />
            </>
          ) : (
            <>
              <g className="anim-eye-blink">
                <ellipse cx="95" cy="26" rx="12" ry="6.2" fill="#ffffff" stroke="#09090b" strokeWidth="1.6" />
                <circle cx="95" cy="26" r="3.6" fill="#09090b" />
                <circle cx="96.3" cy="24.7" r="1.2" fill="#ffffff" />
              </g>
              <g className="anim-eye-blink">
                <ellipse cx="24" cy="91" rx="10" ry="5.2" fill="#e4e4e7" stroke="#09090b" strokeWidth="1.6" />
                <circle cx="24" cy="91" r="2.9" fill="#09090b" />
                <circle cx="25" cy="89.8" r="1" fill="#ffffff" />
              </g>
              <g className="anim-eye-blink">
                <ellipse cx="26" cy="26" rx="7.5" ry="4" fill="#d4d4d8" stroke="#09090b" strokeWidth="1.4" />
                <circle cx="26" cy="26" r="2.2" fill="#09090b" />
              </g>
            </>
          )}
        </svg>
      </div>
    );
  }

  /* 11. Llama infernal & Cerbero — Studio-Painted Swirling Hellfire Ring */
  if (decoration === 'llama' || decoration === 'cerbero') {
    const isCerb = decoration === 'cerbero';
    return (
      <div className="absolute -inset-[28%] w-[156%] h-[156%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-spin-slow"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 49%, black 66%, transparent 94%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 49%, black 66%, transparent 94%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.25) drop-shadow(0 0 14px rgba(236,72,153,0.85))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopLlamaInfernal}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-120"
          />
        </div>
        {isCerb && (
          <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible anim-ember">
            <circle cx="98" cy="22" r="4.5" fill="#f472b6" />
            <circle cx="22" cy="98" r="4" fill="#fde047" />
          </svg>
        )}
      </div>
    );
  }

  /* 12. Orejas de gato — Ultra-Plush Multi-Swatch Cat Ears & Tapered Whiskers */
  if (decoration === 'orejas') {
    const innerTint = accentColor || '#f9a8d4';
    const outerTint =
      accentColor === '#fde047'
        ? '#fefce8'
        : accentColor === '#86efac'
        ? '#f0fdf4'
        : accentColor === '#c084fc'
        ? '#faf5ff'
        : '#f8fafc';
    const shadowTint =
      accentColor === '#fde047'
        ? '#fef08a'
        : accentColor === '#86efac'
        ? '#bbf7d0'
        : accentColor === '#c084fc'
        ? '#e9d5ff'
        : '#e2e8f0';
    return (
      <div className="absolute -inset-[22%] w-[144%] h-[144%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
          <defs>
            <linearGradient id="catEarOuterL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="65%" stopColor={outerTint} />
              <stop offset="100%" stopColor={shadowTint} />
            </linearGradient>
            <linearGradient id="catEarInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={innerTint} />
              <stop offset="100%" stopColor={innerTint} stopOpacity="0.55" />
            </linearGradient>
            <filter id="plushShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>
          <g filter="url(#plushShadow)">
            {/* Left Plush Ear */}
            <path
              d="M15 49 Q13 13 24 8 Q37 12 49 28 Q32 36 15 49 Z"
              fill="url(#catEarOuterL)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M20 42 Q20 19 26 15 Q35 19 43 29 Q31 35 20 42 Z" fill="url(#catEarInner)" />
            <path d="M23 38 L29 29 M28 36 L34 28" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
            {/* Right Plush Ear */}
            <path
              d="M105 49 Q107 13 96 8 Q83 12 71 28 Q88 36 105 49 Z"
              fill="url(#catEarOuterL)"
              stroke="#18181b"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path d="M100 42 Q100 19 94 15 Q85 19 77 29 Q89 35 100 42 Z" fill="url(#catEarInner)" />
            <path d="M97 38 L91 29 M92 36 L86 28" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" />
          </g>
          {/* Tapered Double-Tone Whiskers */}
          <g strokeLinecap="round">
            <path d="M2 53 L22 58 M0 64 L21 64 M3 75 L22 70" stroke="#09090b" strokeWidth="3.6" />
            <path d="M118 53 L98 58 M120 64 L99 64 M117 75 L98 70" stroke="#09090b" strokeWidth="3.6" />
            <path d="M2 53 L22 58 M0 64 L21 64 M3 75 L22 70" stroke="#f8fafc" strokeWidth="1.3" opacity="0.85" />
            <path d="M118 53 L98 58 M120 64 L99 64 M117 75 L98 70" stroke="#f8fafc" strokeWidth="1.3" opacity="0.85" />
          </g>
        </svg>
      </div>
    );
  }

  /* 13. Hora de pesadilla — Studio-Inked Manga Horror Maw & Claws Ring */
  if (decoration === 'pesadilla') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-ghost"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 45%, black 75%, transparent 90%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 45%, black 75%, transparent 90%)',
            filter: 'contrast(1.18) drop-shadow(0 2px 10px rgba(0,0,0,0.9))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingPesadilla}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105"
          />
        </div>
      </div>
    );
  }

  /* 14. Espectro — Studio-Painted Monochrome Manga Wraith */
  if (decoration === 'espectro') {
    return (
      <div className="absolute -inset-[28%] w-[156%] h-[156%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-ghost"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 49%, black 76%, transparent 96%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 49%, black 76%, transparent 96%)',
            filter: 'contrast(1.12) drop-shadow(0 2px 10px rgba(0,0,0,0.85))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopEspectroArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-105"
          />
        </div>
      </div>
    );
  }

  /* 15. el mismo pato — Crystalline Pond Ripple & Illustrated Diving Duck */
  if (decoration === 'pato') {
    return (
      <div className="absolute -inset-[22%] w-[144%] h-[144%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="duckPondRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
            <linearGradient id="duckFeather" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="51" fill="none" stroke="url(#duckPondRing)" strokeWidth="3.5" opacity="0.92" />
          <circle cx="60" cy="60" r="55" fill="none" stroke="#bae6fd" strokeWidth="1.2" strokeDasharray="16 8" opacity="0.65" />
          <ellipse cx="22" cy="24" rx="12" ry="5" fill="#4ade80" stroke="#166534" strokeWidth="1.2" transform="rotate(-16 22 24)" />
          <path d="M14 25 L22 24" stroke="#166534" strokeWidth="1" transform="rotate(-16 22 24)" />
          <g className="anim-float">
            <ellipse cx="92" cy="23" rx="16.5" ry="12.5" fill="url(#duckFeather)" stroke="#94a3b8" strokeWidth="1.2" />
            <ellipse cx="87" cy="19" rx="10" ry="6" fill="#ffffff" />
            <path d="M96 30 L103 44 L110 39 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1" strokeLinejoin="round" />
            <path d="M102 27 L112 37 L116 31 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" strokeLinejoin="round" />
            <circle cx="80" cy="36" r="10.5" fill="url(#duckFeather)" stroke="#cbd5e1" strokeWidth="1.2" />
            <path d="M70 36 Q57 38 58 43 Q62 46 72 43 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="1" strokeLinejoin="round" />
            <circle cx="75.5" cy="34.5" r="2" fill="#0f172a" />
            <circle cx="76.2" cy="33.8" r="0.7" fill="#ffffff" />
            <circle cx="61" cy="22" r="2.7" fill="#e0f2fe" opacity="0.95" />
            <circle cx="52" cy="16" r="1.9" fill="#e0f2fe" opacity="0.85" />
          </g>
        </svg>
      </div>
    );
  }

  /* 16. Satoru Gojo — Studio-Rendered Electric Cyan & Violet Infinity Halo */
  if (decoration === 'gojo') {
    return (
      <div className="absolute -inset-[28%] w-[156%] h-[156%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-spin-slow"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 48%, black 70%, transparent 95%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 48%, black 70%, transparent 95%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.25) drop-shadow(0 0 14px rgba(56,189,248,0.85))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingGojo}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#bae6fd" strokeWidth="1.2" opacity="0.7" />
        </svg>
      </div>
    );
  }

  /* 17. Ryomen Sukuna — Studio-Rendered Malevolent Shrine Fire & Slash Ring */
  if (decoration === 'sukuna') {
    return (
      <div className="absolute -inset-[28%] w-[156%] h-[156%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-ember"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 48%, black 70%, transparent 95%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.92) 48%, black 70%, transparent 95%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.25) drop-shadow(0 0 14px rgba(239,68,68,0.85))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingSukuna}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="44" fill="none" stroke="#fca5a5" strokeWidth="1.1" opacity="0.55" />
        </svg>
      </div>
    );
  }

  /* 18. Yuji Itadori — Layered Crimson Jujutsu Collar & Black Flash Lightning */
  if (decoration === 'yuji') {
    return (
      <div className="absolute -inset-[22%] w-[144%] h-[144%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="yujiHood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="50%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
            <filter id="blackFlashGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="50.5" fill="none" stroke="#ef4444" strokeWidth="2.4" opacity="0.65" />
          {/* Draped Crimson Collar */}
          <path
            d="M14 78 Q60 123 106 78 Q88 100 60 103 Q32 100 14 78 Z"
            fill="url(#yujiHood)"
            stroke="#270606"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M22 86 Q60 114 98 86" stroke="#f87171" strokeWidth="2.4" fill="none" opacity="0.7" />
          <path d="M32 95 Q60 112 88 95" stroke="#450a0a" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Black Flash Cursed Sparks */}
          <g filter="url(#blackFlashGlow)" className="anim-flame">
            <path d="M95 10 L74 30 L88 33 L67 55" stroke="#09090b" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M95 10 L74 30 L88 33 L67 55" stroke="#fb7185" strokeWidth="3.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M95 10 L74 30 L88 33 L67 55" stroke="#ffffff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 14 L38 28 L29 31 L42 44" stroke="#ef4444" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      </div>
    );
  }

  /* 19. Grabado japonés — Studio-Rendered Sumi-e Brush Circle, Red Seal & Sakura Petals */
  if (decoration === 'grabado') {
    return (
      <div className="absolute -inset-[27%] w-[154%] h-[154%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 46%, black 80%, transparent 96%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 46%, black 80%, transparent 96%)',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.22))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingGrabado}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-108"
          />
        </div>
      </div>
    );
  }

  /* 20. Lobo y Luna — Studio-Rendered Filigree Crescent Moon & Twilight Mist Halo */
  if (decoration === 'lobo') {
    return (
      <div className="absolute -inset-[28%] w-[156%] h-[156%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-float"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.95) 47%, black 75%, transparent 96%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.95) 47%, black 75%, transparent 96%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.2) drop-shadow(0 0 12px rgba(192,132,252,0.8))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingLobo}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-110"
          />
        </div>
      </div>
    );
  }

  /* 21. Hora del tentempié (Night Terrors) — Manga Ink Jagged Teeth Ring */
  if (decoration === 'tentempie') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-ghost"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 46%, black 76%, transparent 92%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 46%, black 76%, transparent 92%)',
            filter: 'contrast(1.25) drop-shadow(0 2px 10px rgba(0,0,0,0.95))',
          }}
        >
          <img
            src={GENERATED_ASSETS.decoRingPesadilla}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-108"
          />
        </div>
      </div>
    );
  }

  /* 22. Polilla fantasma (Dark Folklore) — Veined Spectral Luna-Moth Wings & Plumed Antennae */
  if (decoration === 'polilla') {
    return (
      <div className="absolute -inset-[24%] w-[148%] h-[148%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
          <defs>
            <linearGradient id="mothWingL" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#d4d4d8" />
              <stop offset="100%" stopColor="#52525b" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="49.5" fill="none" stroke="#e4e4e7" strokeWidth="1.8" opacity="0.65" />
          {/* Feathered Moth Antennae on Top */}
          <path d="M55 15 Q40 1 20 7 Q31 15 48 18" fill="url(#mothWingL)" stroke="#27272a" strokeWidth="1.1" />
          <path d="M65 15 Q80 1 100 7 Q89 15 72 18" fill="url(#mothWingL)" stroke="#27272a" strokeWidth="1.1" />
          {/* Sculpted Veined Moth Wings */}
          <path d="M12 61 Q2 89 22 106 Q42 114 53 98 Q36 86 24 60 Z" fill="url(#mothWingL)" stroke="#18181b" strokeWidth="1.3" opacity="0.95" />
          <path d="M108 61 Q118 89 98 106 Q78 114 67 98 Q84 86 96 60 Z" fill="url(#mothWingL)" stroke="#18181b" strokeWidth="1.3" opacity="0.95" />
          <circle cx="24" cy="91" r="4.8" fill="#18181b" stroke="#f4f4f5" strokeWidth="1.2" />
          <circle cx="96" cy="91" r="4.8" fill="#18181b" stroke="#f4f4f5" strokeWidth="1.2" />
          <circle cx="24" cy="91" r="1.8" fill="#ef4444" />
          <circle cx="96" cy="91" r="1.8" fill="#ef4444" />
        </svg>
      </div>
    );
  }

  /* 23. Flores de luna (Dark Folklore) — Blooming Botanical Moonflowers & Climbing Vines */
  if (decoration === 'flores-luna') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-sway"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 80%, transparent 96%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 80%, transparent 96%)',
            filter: 'saturate(1.2) drop-shadow(0 0 12px rgba(187,247,208,0.55))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopMoonflowersArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-110"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#86efac" strokeWidth="1.3" opacity="0.7" />
          <circle cx="60" cy="8" r="5" fill="#fef9c3" />
          <circle cx="24" cy="90" r="5.5" fill="#fef08a" stroke="#4d7c0f" strokeWidth="1.2" />
          <circle cx="96" cy="88" r="5.5" fill="#fef9c3" stroke="#4d7c0f" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  /* 24. Cuernos de demonio (Dark Folklore) — Ridged Cryptid Horns & Furry Ears */
  if (decoration === 'cuernos') {
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
          <defs>
            <linearGradient id="hornMetal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="45%" stopColor="#334155" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="49.5" fill="none" stroke="#64748b" strokeWidth="2.4" opacity="0.7" />
          <path d="M25 43 Q6 16 23 2 Q20 19 35 32 Z" fill="url(#hornMetal)" stroke="#e2e8f0" strokeWidth="1.1" />
          <path d="M95 43 Q114 16 97 2 Q100 19 85 32 Z" fill="url(#hornMetal)" stroke="#e2e8f0" strokeWidth="1.1" />
          <path d="M18 30 L27 28 M16 21 L24 20 M102 30 L93 28 M104 21 L96 20" stroke="#94a3b8" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M15 48 Q2 35 12 26 Q23 35 28 45 Z" fill="#1e293b" stroke="#fb923c" strokeWidth="1.2" />
          <path d="M105 48 Q118 35 108 26 Q97 35 92 45 Z" fill="#1e293b" stroke="#fb923c" strokeWidth="1.2" />
          <circle cx="22" cy="4" r="1.8" fill="#fb923c" />
          <circle cx="98" cy="4" r="1.8" fill="#fb923c" />
        </svg>
      </div>
    );
  }

  /* 25. Fuegos fatuos (Dark Folklore) — Orbiting Cyan-Emerald Spectral Wisps */
  if (decoration === 'fuegos-fatuos') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-spin-slow">
          <defs>
            <radialGradient id="wispGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#5eead4" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="49" fill="none" stroke="#2dd4bf" strokeWidth="2.4" strokeDasharray="20 8" opacity="0.65" />
          <circle cx="22" cy="30" r="15" fill="url(#wispGlow)" />
          <circle cx="98" cy="36" r="12" fill="url(#wispGlow)" />
          <circle cx="88" cy="96" r="16" fill="url(#wispGlow)" />
          <circle cx="24" cy="86" r="11" fill="url(#wispGlow)" />
          <path d="M56 12 Q60 2 65 12 Q60 17 56 12 Z" fill="#ccfbf1" />
        </svg>
      </div>
    );
  }

  /* 26. El Ente (Dead by Daylight) — Blazing Orange-Black Entity Spider Claws */
  if (decoration === 'el-ente') {
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ember">
          <defs>
            <linearGradient id="entityClaw" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="49.5" fill="none" stroke="#f97316" strokeWidth="3.2" opacity="0.9" />
          <circle cx="60" cy="60" r="46.5" fill="none" stroke="#fed7aa" strokeWidth="0.9" opacity="0.6" />
          <path d="M18 32 Q5 12 29 6 Q18 21 31 32 Z" fill="url(#entityClaw)" stroke="#09090b" strokeWidth="1.3" />
          <path d="M102 32 Q115 12 91 6 Q102 21 89 32 Z" fill="url(#entityClaw)" stroke="#09090b" strokeWidth="1.3" />
          <path d="M12 76 Q-1 97 23 110 Q16 90 25 80 Z" fill="url(#entityClaw)" stroke="#09090b" strokeWidth="1.3" />
          <path d="M108 76 Q121 97 97 110 Q104 90 95 80 Z" fill="url(#entityClaw)" stroke="#09090b" strokeWidth="1.3" />
          <path d="M55 12 Q60 -3 68 8 Q62 15 60 15 Z" fill="#fb923c" />
        </svg>
      </div>
    );
  }

  /* 27. Luna oscura (Dead by Daylight) — Ink Brush Eclipse Ring (supports silver / crimson swatch) */
  if (decoration === 'luna-oscura') {
    const ringTone = accentColor === '#ef4444' ? '#ef4444' : '#e2e8f0';
    return (
      <div className="absolute -inset-[23%] w-[146%] h-[146%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ghost">
          <path
            d="M46 12 A49 49 0 1 0 98 92 A41 41 0 1 1 46 12 Z"
            fill="#09090b"
            stroke={ringTone}
            strokeWidth="2.5"
          />
          <circle cx="60" cy="60" r="50.5" fill="none" stroke={ringTone} strokeWidth="1.7" strokeDasharray="34 10 8 6" opacity="0.88" />
          <path d="M88 18 Q94 12 98 18 L94 21 Z" fill={ringTone} />
          <circle cx="24" cy="28" r="2.2" fill={ringTone} />
          <circle cx="94" cy="84" r="2.2" fill={ringTone} />
        </svg>
      </div>
    );
  }

  /* 28. Red de sangre (Dead by Daylight) — Organic Crimson Bloodweb Ring */
  if (decoration === 'red-sangre') {
    return (
      <div className="absolute -inset-[27%] w-[154%] h-[154%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-ember"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.95) 47%, black 78%, transparent 95%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, rgba(0,0,0,0.95) 47%, black 78%, transparent 95%)',
            filter: 'saturate(1.35) drop-shadow(0 0 14px rgba(220,38,38,0.9))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopDbdBloodwebArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="44.5" fill="none" stroke="#ef4444" strokeWidth="1.8" opacity="0.8" />
        </svg>
      </div>
    );
  }

  /* 29. Calabazas del Vacío (Dead by Daylight) — Orbiting Fiery Jack-o'-Lantern Ring */
  if (decoration === 'calabazas') {
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ember">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#f97316" strokeWidth="4" opacity="0.9" />
          <circle cx="60" cy="60" r="53.5" fill="none" stroke="#fde047" strokeWidth="1.2" strokeDasharray="24 12" opacity="0.75" />
          <g transform="translate(86, 11)">
            <path d="M12 0 Q14 -4 16 -2" stroke="#4d7c0f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10.5" fill="#ea580c" stroke="#18181b" strokeWidth="1.4" />
            <polygon points="7,9 10,12 6,12" fill="#fef08a" />
            <polygon points="17,9 14,12 18,12" fill="#fef08a" />
            <path d="M7 15 Q12 19 17 15" stroke="#fef08a" strokeWidth="2" fill="none" />
          </g>
          <g transform="translate(8, 86)">
            <path d="M12 0 Q10 -4 8 -2" stroke="#4d7c0f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10.5" fill="#c2410c" stroke="#18181b" strokeWidth="1.4" />
            <polygon points="7,9 10,12 6,12" fill="#fde047" />
            <polygon points="17,9 14,12 18,12" fill="#fde047" />
            <path d="M7 15 Q12 19 17 15" stroke="#fde047" strokeWidth="2" fill="none" />
          </g>
        </svg>
      </div>
    );
  }

  /* 30. Stardust & Lights (¡Luces, cámara...!, Onda cósmica) — Golden/Emerald Shimmering Stardust Ring */
  if (decoration === 'luces-camara' || decoration === 'onda-cosmica') {
    const color = decoration === 'onda-cosmica' ? '#4ade80' : '#fbbf24';
    const secColor = decoration === 'onda-cosmica' ? '#2dd4bf' : '#fef08a';
    const glow = decoration === 'onda-cosmica' ? 'rgba(74,222,128,0.85)' : 'rgba(251,191,36,0.85)';
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible">
          <g className="anim-spin-slow" style={{ transformOrigin: '60px 60px' }}>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={color}
              strokeWidth="3.6"
              strokeDasharray="10 4 2 4 16 4"
              style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
            />
            <circle cx="60" cy="60" r="54.5" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="3 8 1 6" opacity="0.85" />
          </g>
          <g className="anim-twinkle">
            <path d="M60 3 L62.5 9.5 L69 12 L62.5 14.5 L60 21 L57.5 14.5 L51 12 L57.5 9.5 Z" fill="#ffffff" />
            <path d="M108 58 L110.5 62 L114.5 64 L110.5 66 L108 70 L105.5 66 L101.5 64 L105.5 62 Z" fill={secColor} />
            <path d="M16 86 L18 89.5 L21.5 91.5 L18 93.5 L16 97 L14 93.5 L10.5 91.5 L14 89.5 Z" fill="#ffffff" />
          </g>
        </svg>
      </div>
    );
  }

  /* 31. Borderlands 4 (boveda, saqueo, claptrap) */
  if (decoration === 'boveda' || decoration === 'saqueo' || decoration === 'claptrap') {
    if (decoration === 'claptrap') {
      return (
        <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
          <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
            <circle cx="60" cy="60" r="49.5" fill="none" stroke="#facc15" strokeWidth="3.2" strokeDasharray="24 6" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
            <g transform="translate(6, 65)">
              <rect x="6" y="4" width="25" height="27" rx="4.5" fill="#facc15" stroke="#09090b" strokeWidth="2.2" />
              <rect x="6" y="14" width="25" height="5.5" fill="#f8fafc" />
              <circle cx="18.5" cy="11" r="4.8" fill="#38bdf8" stroke="#09090b" strokeWidth="1.5" />
              <circle cx="19.5" cy="10" r="1.4" fill="#ffffff" />
              <line x1="18.5" y1="-2" x2="18.5" y2="4" stroke="#94a3b8" strokeWidth="2" />
              <circle cx="18.5" cy="-3" r="2.2" fill="#ef4444" />
              <line x1="1" y1="16" x2="6" y2="14" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="31" y1="14" x2="36" y2="7" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="18.5" cy="36.5" r="5" fill="#27272a" stroke="#09090b" strokeWidth="1.8" />
            </g>
          </svg>
        </div>
      );
    }
    const isRainbow = decoration === 'saqueo';
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-ember">
          <defs>
            <linearGradient id={`blGrad-${decoration}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={isRainbow ? '#facc15' : '#38bdf8'} />
              <stop offset="50%" stopColor={isRainbow ? '#ec4899' : '#c084fc'} />
              <stop offset="100%" stopColor={isRainbow ? '#22d3ee' : '#f97316'} />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50.5" fill="none" stroke={`url(#blGrad-${decoration})`} strokeWidth="5" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
          {/* Vault Crest Top */}
          <circle cx="60" cy="10" r="7.5" fill="#09090b" stroke={isRainbow ? '#facc15' : '#f97316'} strokeWidth="2.2" />
          <path d="M55 13 L60 5 L65 13" fill="none" stroke={isRainbow ? '#ec4899' : '#38bdf8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  /* 32. Celestial & Nocturno (luna-mistica, estrella-nocturna, flores-lunares) */
  if (decoration === 'luna-mistica' || decoration === 'estrella-nocturna' || decoration === 'flores-lunares') {
    return (
      <div className="absolute -inset-[26%] w-[152%] h-[152%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-float"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 78%, transparent 95%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 78%, transparent 95%)',
            mixBlendMode: 'screen',
            filter: 'saturate(1.3) drop-shadow(0 0 14px rgba(96,165,250,0.9))',
          }}
        >
          <img
            src={GENERATED_ASSETS.shopCelestialMoonArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#a5b4fc" strokeWidth="1.4" opacity="0.75" />
          <g className="anim-twinkle">
            <path d="M96 20 L98 24 L102 26 L98 28 L96 32 L94 28 L90 26 L94 24 Z" fill="#fef9c3" />
          </g>
        </svg>
      </div>
    );
  }

  /* 33. Secret Garden (trebol, jardin-secreto, lirio) */
  if (decoration === 'trebol' || decoration === 'jardin-secreto' || decoration === 'lirio') {
    const tone = decoration === 'lirio' ? '#34d399' : decoration === 'trebol' ? '#22c55e' : '#a3e635';
    return (
      <div className="absolute -inset-[24%] w-[148%] h-[148%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-sway">
          <circle cx="60" cy="60" r="50" fill="none" stroke={tone} strokeWidth="3.8" opacity="0.92" />
          <circle cx="60" cy="60" r="46.5" fill="none" stroke="#dcfce7" strokeWidth="1" opacity="0.65" />
          <ellipse cx="20" cy="40" rx="8" ry="12" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" transform="rotate(-25 20 40)" />
          <ellipse cx="100" cy="42" rx="8" ry="12" fill="#22c55e" stroke="#14532d" strokeWidth="1.2" transform="rotate(25 100 42)" />
          {/* 4-leaf clover accent at top */}
          <g transform="translate(52, 2)">
            <circle cx="5" cy="5" r="4" fill="#22c55e" stroke="#14532d" strokeWidth="0.9" />
            <circle cx="11" cy="5" r="4" fill="#4ade80" stroke="#14532d" strokeWidth="0.9" />
            <circle cx="5" cy="11" r="4" fill="#4ade80" stroke="#14532d" strokeWidth="0.9" />
            <circle cx="11" cy="11" r="4" fill="#22c55e" stroke="#14532d" strokeWidth="0.9" />
          </g>
          <circle cx="30" cy="96" r="4.5" fill="#fef9c3" />
          <circle cx="90" cy="94" r="4.5" fill="#fde047" />
        </svg>
      </div>
    );
  }

  /* 34. Rawr xD (adorable, random-xd, scene-xd) */
  if (decoration === 'adorable' || decoration === 'random-xd' || decoration === 'scene-xd') {
    const primary = decoration === 'scene-xd' ? '#a3e635' : decoration === 'random-xd' ? '#f472b6' : '#c084fc';
    return (
      <div className="absolute -inset-[25%] w-[150%] h-[150%] pointer-events-none z-10">
        <div
          className="w-full h-full rounded-full overflow-hidden anim-float"
          style={{
            WebkitMaskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 78%, transparent 94%)',
            maskImage:
              'radial-gradient(circle, transparent 41%, black 47%, black 78%, transparent 94%)',
            filter: `drop-shadow(0 0 12px ${primary})`,
          }}
        >
          <img
            src={GENERATED_ASSETS.shopRawrSceneArt}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover scale-115"
          />
        </div>
        <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full overflow-visible">
          <circle cx="60" cy="60" r="45" fill="none" stroke={primary} strokeWidth="1.6" strokeDasharray="8 4" />
        </svg>
      </div>
    );
  }

  /* 35. Exclusivo de Nitro (nitro-disco, nitro-auris, nitro-chip) */
  if (decoration === 'nitro-disco') {
    return (
      <div className="absolute -inset-[20%] w-[140%] h-[140%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-spin-slow">
          <defs>
            <linearGradient id="nitro-disco-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bef264" />
              <stop offset="50%" stopColor="#f4f4f5" />
              <stop offset="100%" stopColor="#65a30d" />
            </linearGradient>
          </defs>
          <path
            d="M22 36 A46 46 0 1 1 88 96 L80 86 A36 36 0 1 0 32 44 Z"
            fill="url(#nitro-disco-g)"
            stroke="#18181b"
            strokeWidth="1.8"
          />
          <circle cx="60" cy="60" r="53" fill="none" stroke="#a3e635" strokeWidth="1" strokeDasharray="4 6" opacity="0.7" />
          <polygon points="94,22 97,28 103,31 97,34 94,40 91,34 85,31 91,28" fill="#bef264" />
          <polygon points="22,88 24,93 29,95 24,97 22,102 20,97 15,95 20,93" fill="#a3e635" />
        </svg>
      </div>
    );
  }

  if (decoration === 'nitro-auris') {
    return (
      <div className="absolute -inset-[21%] w-[142%] h-[142%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-float">
          <path d="M20 62 C20 24 100 24 100 62" fill="none" stroke="#1d4ed8" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M22 60 C22 27 98 27 98 60" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <rect x="8" y="51" width="16" height="30" rx="6.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <rect x="96" y="51" width="16" height="30" rx="6.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="16" cy="66" r="3.4" fill="#818cf8" />
          <circle cx="104" cy="66" r="3.4" fill="#818cf8" />
        </svg>
      </div>
    );
  }

  if (decoration === 'nitro-chip') {
    return (
      <div className="absolute -inset-[21%] w-[142%] h-[142%] pointer-events-none z-10">
        <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-holo-glow">
          <defs>
            <linearGradient id="nitro-chip-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M16 28 L34 14 L88 14 L104 28 L104 92 L88 106 L34 106 L16 92 Z"
            fill="none"
            stroke="url(#nitro-chip-g)"
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          <path d="M26 24 H52 M68 96 H94" stroke="#f472b6" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="92" cy="24" r="3.4" fill="#22d3ee" />
          <circle cx="28" cy="96" r="3.4" fill="#f472b6" />
        </svg>
      </div>
    );
  }

  /* 36. Fallback Premium Iridescent Ring (ofrenda / enfado / etc.) */
  return (
    <div className="absolute -inset-[18%] w-[136%] h-[136%] pointer-events-none z-10">
      <svg viewBox="0 0 120 120" className="w-full h-full overflow-visible anim-holo-glow">
        <defs>
          <linearGradient id="fallbackRingG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="51" fill="none" stroke="url(#fallbackRingG)" strokeWidth="4.2" />
        <circle cx="60" cy="60" r="47" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
};

/* Ornate Discord Profile Frames (all 12 collector frames crafted across 4 edges) */
export const ProfileFrameArtwork: React.FC<{
  frame?: ProfileFrameId;
  accentColor?: string;
}> = ({ frame, accentColor }) => {
  if (!frame || frame === 'none') {
    return null;
  }

  /* 1. Obsidiana — Faceted Obsidian Crystal Bevel Frame */
  if (frame === 'obsidian') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-zinc-300/40 shadow-[0_0_26px_rgba(255,255,255,0.14)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible">
          <polygon points="4,22 22,4 28,10 10,28" fill="#e4e4e7" stroke="#18181b" strokeWidth="1.2" />
          <polygon points="196,22 178,4 172,10 190,28" fill="#e4e4e7" stroke="#18181b" strokeWidth="1.2" />
          <polygon points="4,158 22,176 28,170 10,152" fill="#a1a1aa" stroke="#18181b" strokeWidth="1.2" />
          <polygon points="196,158 178,176 172,170 190,152" fill="#a1a1aa" stroke="#18181b" strokeWidth="1.2" />
          <polygon points="94,4 100,-2 106,4 100,10" fill="#ffffff" stroke="#27272a" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  /* 2. Carmesí GTA — Metallic Vice Racing Frame & Ruby Locks */
  if (frame === 'crimson') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-red-500/80 shadow-[0_0_28px_rgba(239,68,68,0.38)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible anim-ember">
          <path d="M6 28 L6 10 Q6 6 10 6 L34 6" fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
          <path d="M194 28 L194 10 Q194 6 190 6 L166 6" fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />
          <path d="M6 152 L6 170 Q6 174 10 174 L34 174" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
          <path d="M194 152 L194 170 Q194 174 190 174 L166 174" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
          <path d="M74 6 L82 0 L118 0 L126 6 Z" fill="#ef4444" stroke="#fecaca" strokeWidth="0.9" />
        </svg>
      </div>
    );
  }

  /* 3. Neón Azul — Cyber Tactical HUD Brackets */
  if (frame === 'neon-blue') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-sky-400/80 shadow-[0_0_28px_rgba(56,189,248,0.42)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible">
          <path d="M4 32 V10 L14 4 H40" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M196 32 V10 L186 4 H160" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M4 148 V170 L14 176 H40" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M196 148 V170 L186 176 H160" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="82" y1="4" x2="118" y2="4" stroke="#bae6fd" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="176" r="2.6" fill="#38bdf8" />
        </svg>
      </div>
    );
  }

  /* 4. Dorado Real — Royal Baroque Gold Filigree Frame */
  if (frame === 'gold') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-amber-400/85 shadow-[0_0_28px_rgba(245,158,11,0.36)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible">
          <path d="M72 6 Q100 -8 128 6" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" />
          <polygon points="100,-5 107,3 100,11 93,3" fill="#fef08a" stroke="#b45309" strokeWidth="1.2" />
          <path d="M6 26 Q6 6 26 6" fill="none" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M194 26 Q194 6 174 6" fill="none" stroke="#f59e0b" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M6 154 Q6 174 26 174" fill="none" stroke="#d97706" strokeWidth="4.2" strokeLinecap="round" />
          <path d="M194 154 Q194 174 174 174" fill="none" stroke="#d97706" strokeWidth="4.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  /* 5. Cyber Glitch — Chromatic RGB Split & Pixel Glitch Blocks */
  if (frame === 'glitch') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-indigo-400/85 shadow-[0_0_28px_rgba(88,101,242,0.45)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible anim-holo-glow">
          <rect x="18" y="-2" width="32" height="5" fill="#22d3ee" />
          <rect x="132" y="-3" width="24" height="5" fill="#ec4899" />
          <rect x="-2" y="42" width="5" height="26" fill="#ec4899" />
          <rect x="197" y="96" width="5" height="28" fill="#22d3ee" />
          <rect x="64" y="176" width="44" height="5" fill="#a855f7" />
          <rect x="148" y="175" width="16" height="4" fill="#a3e635" />
        </svg>
      </div>
    );
  }

  /* Night Terrors: Espectro — Pale Ghoul Climbing Over Top & Bottom Edges */
  if (frame === 'espectro') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-zinc-200/55 shadow-[0_0_26px_rgba(255,255,255,0.16)]" />
        <svg viewBox="0 0 200 180" className="absolute -top-6 inset-x-0 w-full h-auto overflow-visible anim-ghost">
          <path d="M18 42 Q8 14 38 14 Q48 26 42 40 Z" fill="#18181b" stroke="#e4e4e7" strokeWidth="2.2" />
          <path d="M36 32 Q72 8 104 22 Q128 8 164 26 Q178 36 168 46 Q128 32 100 34 Q70 30 36 32 Z" fill="#f4f4f5" stroke="#09090b" strokeWidth="2.4" />
          <circle cx="116" cy="24" r="14" fill="#f4f4f5" stroke="#09090b" strokeWidth="2.2" />
          <ellipse cx="112" cy="22" rx="3" ry="4" fill="#09090b" />
          <ellipse cx="121" cy="22" rx="3" ry="4" fill="#09090b" />
          <ellipse cx="116.5" cy="31" rx="4.5" ry="6" fill="#09090b" />
        </svg>
      </div>
    );
  }

  /* Night Terrors: Observador — Mass of Staring Ink Eyes Crowning Top & Bottom Edge */
  if (frame === 'observador') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-[3px] border-black shadow-[0_0_25px_rgba(0,0,0,0.95)] ring-1 ring-white/30" />
        <svg viewBox="0 0 200 180" className="absolute -top-6 inset-x-0 w-full h-auto overflow-visible">
          <path d="M10 42 Q26 4 62 10 Q100 -2 138 10 Q174 4 190 42 Q145 30 100 32 Q55 30 10 42 Z" fill="#050507" stroke="#ffffff" strokeWidth="1.2" />
          <g className="anim-eye-blink">
            <ellipse cx="64" cy="20" rx="11" ry="5.5" fill="#ffffff" />
            <circle cx="64" cy="20" r="3" fill="#050507" />
            <ellipse cx="102" cy="14" rx="13" ry="6.5" fill="#ffffff" />
            <circle cx="102" cy="14" r="3.5" fill="#050507" />
            <ellipse cx="140" cy="22" rx="10" ry="5" fill="#ffffff" />
            <circle cx="140" cy="22" r="2.8" fill="#050507" />
          </g>
        </svg>
      </div>
    );
  }

  /* Dark Folklore: Ramas desnudas — Twisted Bare Forest Twigs & Tiny Fairy Sparkles */
  if (frame === 'ramas-desnudas') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-zinc-400/55 shadow-[0_0_20px_rgba(228,228,231,0.16)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible">
          <path d="M12 36 Q18 10 56 12 Q100 4 146 12 Q184 10 188 36" fill="none" stroke="#52525b" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M16 32 Q12 120 18 168 M184 32 Q188 120 182 168" fill="none" stroke="#3f3f46" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M24 164 Q100 176 176 164" fill="none" stroke="#52525b" strokeWidth="3.5" strokeLinecap="round" />
          <g className="anim-twinkle">
            <circle cx="52" cy="8" r="2.4" fill="#fef9c3" />
            <circle cx="110" cy="6" r="2.8" fill="#ffffff" />
            <circle cx="152" cy="10" r="2.2" fill="#fde047" />
          </g>
        </svg>
      </div>
    );
  }

  /* Dark Folklore: Flores de luna — Lush Moonflower Garland Around Profile Card */
  if (frame === 'flores-luna') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-emerald-400/65 shadow-[0_0_24px_rgba(74,222,128,0.28)]" />
        <svg viewBox="0 0 200 180" className="absolute -top-5 inset-x-0 w-full h-auto overflow-visible anim-sway">
          <path d="M14 48 Q20 12 100 16 Q180 12 186 48" fill="none" stroke="#4d7c0f" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="44" cy="18" r="10" fill="#fef9c3" stroke="#65a30d" strokeWidth="1.5" />
          <circle cx="44" cy="18" r="3.5" fill="#fde047" />
          <circle cx="88" cy="14" r="12" fill="#ffffff" stroke="#65a30d" strokeWidth="1.5" />
          <circle cx="88" cy="14" r="4.5" fill="#fef08a" />
          <circle cx="132" cy="16" r="11" fill="#fefce8" stroke="#4d7c0f" strokeWidth="1.5" />
          <circle cx="132" cy="16" r="4" fill="#fde047" />
          <circle cx="164" cy="24" r="8" fill="#fef9c3" stroke="#65a30d" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  /* Dark Folklore: Diablo de Jersey — Dense Thorny Bramble Border */
  if (frame === 'diablo-jersey') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-[3px] border-slate-500/75 shadow-[0_0_24px_rgba(148,163,184,0.28)]" />
        <svg viewBox="0 0 200 180" className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] overflow-visible">
          <path d="M12 24 L26 10 L44 20 L66 8 L88 20 L112 8 L134 20 L156 8 L174 20 L188 12" fill="none" stroke="#64748b" strokeWidth="4" strokeLinejoin="round" />
          <path d="M14 168 L36 156 L58 170 L88 158 L116 170 L146 156 L176 168" fill="none" stroke="#475569" strokeWidth="3.5" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  /* Dead by Daylight: El Ente — Fiery Orange Entity Talons Piercing Top Edge */
  if (frame === 'el-ente') {
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-orange-500/70 shadow-[0_0_26px_rgba(249,115,22,0.34)]" />
        <svg viewBox="0 0 200 180" className="absolute -top-6 inset-x-0 w-full h-auto overflow-visible anim-ember">
          <path d="M24 38 Q16 8 40 4 Q32 22 42 36 Z" fill="#f97316" stroke="#18181b" strokeWidth="1.5" />
          <path d="M62 34 Q58 4 82 2 Q74 20 80 34 Z" fill="#ea580c" stroke="#18181b" strokeWidth="1.5" />
          <path d="M118 34 Q126 4 146 8 Q134 22 136 34 Z" fill="#f97316" stroke="#18181b" strokeWidth="1.5" />
          <path d="M158 38 Q174 6 186 20 Q170 28 172 38 Z" fill="#dc2626" stroke="#18181b" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  /* Dead by Daylight: Luna oscura — Dead Branches + Perched Crows + Full Moon */
  if (frame === 'luna-oscura') {
    const moonColor = accentColor === '#ef4444' ? '#fca5a5' : '#f8fafc';
    return (
      <div className="absolute -inset-2 pointer-events-none z-20 overflow-visible">
        <div className="w-full h-full rounded-2xl border-2 border-slate-400/55 shadow-[0_0_24px_rgba(148,163,184,0.24)]" />
        <svg viewBox="0 0 200 180" className="absolute -top-7 inset-x-0 w-full h-auto overflow-visible">
          <circle cx="92" cy="22" r="18" fill={moonColor} opacity="0.94" />
          <path d="M16 40 Q42 18 82 28 Q128 18 184 40" fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <path d="M46 24 Q52 14 60 22 L54 27 Z" fill="#09090b" />
          <path d="M116 20 Q122 10 130 18 L124 23 Z" fill="#09090b" />
        </svg>
      </div>
    );
  }

  return null;
};

export const UserAvatar: React.FC<{
  avatar: AvatarKey;
  customAvatarUrl?: string;
  status?: PresenceStatus;
  decoration?: DecorationId;
  decorationAccent?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  borderColor?: string;
  showStatus?: boolean;
}> = ({
  avatar,
  customAvatarUrl,
  status = 'online',
  decoration = 'none',
  decorationAccent,
  size = 'md',
  borderColor = 'var(--dc-bg-sidebar)',
  showStatus = true,
}) => {
  const sizeClass =
    size === 'xs'
      ? 'w-6 h-6'
      : size === 'sm'
      ? 'w-8 h-8'
      : size === 'md'
      ? 'w-10 h-10'
      : size === 'lg'
      ? 'w-12 h-12'
      : size === 'xl'
      ? 'w-20 h-20'
      : 'w-28 h-28';

  const statusSize = size === 'xl' || size === '2xl' ? 'lg' : size === 'lg' ? 'md' : size === 'xs' ? 'xs' : 'sm';

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClass}`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-[var(--dc-bg-card)]">
        {customAvatarUrl ? (
          <img
            src={customAvatarUrl}
            alt="Avatar personalizado"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <AvatarArtwork avatar={avatar} />
        )}
      </div>
      <AvatarDecorationRing decoration={decoration} accentColor={decorationAccent} />
      {showStatus && (
        <span className="absolute -bottom-0.5 -right-0.5 z-20 flex">
          <StatusIndicator status={status} size={statusSize} borderColor={borderColor} />
        </span>
      )}
    </div>
  );
};

export const ServerIconArt: React.FC<{ server: Server; className?: string }> = ({
  server,
  className = 'w-full h-full',
}) => {
  if (server.customIconUrl) {
    return (
      <div className={`${className} bg-[#09090b] relative overflow-hidden`}>
        <SafeImage
          src={server.customIconUrl}
          alt={server.name}
          fallbackGradient="from-[#1e1b4b] via-[#312e81] to-[#0f172a]"
          fallbackLabel={server.shortCode}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/15 pointer-events-none" />
      </div>
    );
  }

  switch (server.iconStyle) {
    case 'jmt':
      return (
        <div className={`${className} bg-gradient-to-br from-[#0d111a] via-[#090b12] to-[#020305] flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.42),transparent_68%)]" />
          <div className="absolute inset-y-0 left-2 w-1 bg-gradient-to-b from-white via-sky-200 to-white/40 opacity-85" />
          <div className="absolute inset-y-0 right-2 w-1 bg-gradient-to-b from-white via-sky-200 to-white/40 opacity-85" />
          <span className="z-10 px-1.5 py-0.5 rounded-md bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white font-display font-black text-[9.5px] tracking-tighter shadow-[0_2px_10px_rgba(37,99,235,0.8)] border border-white/25">
            JMT
          </span>
        </div>
      );
    case 'hoyoverse':
      return (
        <div className={`${className} bg-gradient-to-br from-pink-200 via-sky-200 to-purple-200 relative overflow-hidden`}>
          <SafeImage
            src={GENERATED_ASSETS.hoyoverseIcon}
            alt="HoYoverse Oficial"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[6px] font-extrabold tracking-wider text-white text-center py-[1px] backdrop-blur-[1px]">
            HOYOVERSE
          </span>
        </div>
      );
    case 'mtg':
      return (
        <div className={`${className} bg-gradient-to-br from-sky-400 via-slate-900 to-orange-600 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_58%)]" />
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] relative z-10" fill="currentColor">
            <path d="M12 2L9 10l-4-2 3 11h8l3-11-4 2-3-8z" />
          </svg>
        </div>
      );
    case 'zn':
      return (
        <div className={`${className} bg-[#140407] relative overflow-hidden`}>
          <SafeImage
            src={GENERATED_ASSETS.zenithIcon}
            alt={server.name}
            fallbackGradient="from-red-950 via-[#1a050a] to-black"
            fallbackLabel="Zn"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10 pointer-events-none" />
          <div className="absolute inset-0 ring-1 ring-inset ring-red-400/25 pointer-events-none" />
        </div>
      );
    case 'tnu':
      return (
        <div className={`${className} bg-gradient-to-br from-[#0a2342] via-[#051426] to-[#020812] flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.48),transparent_65%)]" />
          <span className="relative z-10 font-display font-black text-[13px] tracking-tight text-sky-100 drop-shadow-[0_0_12px_rgba(56,189,248,0.95)]">
            TNU
          </span>
          <div className="absolute inset-0 ring-1 ring-inset ring-sky-400/30 pointer-events-none" />
        </div>
      );
    case 'b':
      return (
        <div className={`${className} bg-gradient-to-br from-fuchsia-500 via-amber-400 to-cyan-400 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
          <span className="relative z-10 font-display font-black text-2xl text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            B
          </span>
        </div>
      );
    case 'imperio':
      return (
        <div className={`${className} bg-gradient-to-br from-[#1b3b82] via-[#0f2454] to-[#060f24] flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.22),transparent_60%)]" />
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)] relative z-10" fill="currentColor">
            <path d="M3 18h18v2H3v-2zm0-2l2-9 4.5 4L12 5l2.5 6L19 7l2 9H3z" />
          </svg>
          <span className="relative z-10 text-[7px] font-extrabold tracking-wider text-sky-100 mt-0.5">IMPERIO</span>
          <div className="absolute inset-0 ring-1 ring-inset ring-sky-400/30 pointer-events-none" />
        </div>
      );
    case 'fl':
      return (
        <div className={`${className} bg-gradient-to-br from-[#062840] via-[#031525] to-[#010b14] flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,0.45),transparent_65%)]" />
          <span className="relative z-10 font-display font-black text-xl text-cyan-100 drop-shadow-[0_0_12px_rgba(34,211,238,0.95)]">
            FL
          </span>
          <div className="absolute inset-0 ring-1 ring-inset ring-cyan-400/30 pointer-events-none" />
        </div>
      );
    case 'au':
      return (
        <div className={`${className} bg-gradient-to-br from-[#450a0a] via-[#2b0404] to-[#0f0202] flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(248,113,113,0.4),transparent_65%)]" />
          <span className="relative z-10 font-display font-black text-lg text-red-200 tracking-tighter drop-shadow">
            AU
          </span>
          <div className="absolute inset-0 ring-1 ring-inset ring-red-500/30 pointer-events-none" />
        </div>
      );
    case 'zevr':
      return (
        <div className={`${className} bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-900 flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
          <span className="relative z-10 font-display font-black italic text-[12px] text-white leading-none drop-shadow">ZEVR</span>
          <span className="relative z-10 text-[6px] text-sky-100 uppercase tracking-tight font-bold">Uncopy</span>
        </div>
      );
    case 'slbr':
      return (
        <div className={`${className} bg-gradient-to-br from-fuchsia-600 via-purple-700 to-cyan-500 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
          <span className="relative z-10 font-display font-black text-[12px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
            SLBR
          </span>
        </div>
      );
    case 'rebo':
      return (
        <div className={`${className} bg-zinc-900 relative overflow-hidden border border-amber-500/45`}>
          <SafeImage
            src={GENERATED_ASSETS.reboIcon}
            alt="REBO Uncopylocked"
            className="w-full h-full object-cover"
          />
        </div>
      );
    case 'arrow':
      return (
        <div className={`${className} bg-gradient-to-br from-[#14141c] via-[#09090d] to-[#040406] flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.22),transparent_65%)]" />
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] relative z-10" fill="currentColor">
            <path d="M12 4L4 19l8-4 8 4L12 4zm0 5.5l2.5 5-2.5-1.2-2.5 1.2 2.5-5z" />
          </svg>
        </div>
      );
    default:
      return (
        <div
          className={`${className} flex items-center justify-center font-display font-bold text-white text-base relative overflow-hidden`}
          style={{
            background: `linear-gradient(135deg, ${server.accentColor || '#5865F2'} 0%, #11121a 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_60%)]" />
          <span className={`relative z-10 drop-shadow ${server.customEmoji ? 'text-2xl leading-none' : ''}`}>
            {server.customEmoji || server.shortCode}
          </span>
        </div>
      );
  }
};

export const getNameplateArtworkUrl = (nameplate: NameplateId): string | null => {
  switch (nameplate) {
    case 'rama':
    case 'sakura':
      return GENERATED_ASSETS.shopRamaEnFlor;
    case 'condenacion':
      return GENERATED_ASSETS.shopCondenacionEterna;
    case 'almas':
      return GENERATED_ASSETS.shopTrappedSouls;
    case 'observador':
      return GENERATED_ASSETS.shopObserverEyes;
    case 'acechador':
      return GENERATED_ASSETS.shopWaterStalkerArt;
    case 'diablo-jersey':
      return GENERATED_ASSETS.shopJerseyDevilArt;
    case 'fuegos-fatuos':
    case 'jardin-secreto':
      return GENERATED_ASSETS.shopBannerSecretGarden;
    case 'polilla':
      return GENERATED_ASSETS.shopMothmanArt;
    case 'flores-luna':
    case 'jackalope':
      return GENERATED_ASSETS.shopMoonflowersArt;
    case 'marcas-aranazos':
    case 'dbd':
      return GENERATED_ASSETS.dbdBanner;
    case 'luna-oscura':
      return GENERATED_ASSETS.shopLoboLuna;
    case 'red-sangre':
      return GENERATED_ASSETS.shopDbdBloodwebArt;
    case 'conejito-fresero':
      return GENERATED_ASSETS.shopStrawberryBunnyArt;
    case 'el-mismo-pato':
      return GENERATED_ASSETS.shopPatoArt;
    case 'marea-lluvia':
      return GENERATED_ASSETS.shopCondenacionEterna;
    case 'vader':
      return GENERATED_ASSETS.shopVaderArt;
    case 'gojo':
      return GENERATED_ASSETS.shopGojoArt;
    case 'sukuna':
      return GENERATED_ASSETS.shopSukunaArt;
    case 'yuji':
      return GENERATED_ASSETS.shopYujiArt;
    case 'cerbero':
      return GENERATED_ASSETS.shopCerberoArt;
    case 'lobo':
      return GENERATED_ASSETS.shopLoboLuna;
    case 'miyabi':
      return GENERATED_ASSETS.shopMiyabiArt;
    case 'deadpool':
    case 'wolverine':
      return GENERATED_ASSETS.deadpoolBanner;
    case 'vice-city':
      return GENERATED_ASSETS.viceCityBanner;
    default:
      return null;
  }
};

/* Full seamless painted background strip for Discord Nameplates (used in Shop cards, Modals, Profile, and Member Lists) */
export const NameplateStripBackground: React.FC<{
  nameplate: NameplateId;
  accentColor?: string;
}> = ({ nameplate, accentColor }) => {
  if (nameplate === 'none') return null;
  const artUrl = getNameplateArtworkUrl(nameplate);

  if (artUrl) {
    const isCoralCondenacion = nameplate === 'condenacion' && accentColor === '#fb7185';
    const isCyanScratch = nameplate === 'marcas-aranazos' && accentColor === '#38bdf8';
    const isMagentaScratch = nameplate === 'marcas-aranazos' && accentColor === '#d946ef';
    const isCrimsonMoon = nameplate === 'luna-oscura' && accentColor === '#ef4444';
    const isLightWash = nameplate === 'rama' || nameplate === 'sakura';
    const isVader = nameplate === 'vader';

    const filterStyle = isCoralCondenacion
      ? 'hue-rotate(155deg) saturate(1.3) contrast(1.06)'
      : isCyanScratch
      ? 'hue-rotate(185deg) saturate(1.4) contrast(1.08)'
      : isMagentaScratch
      ? 'hue-rotate(285deg) saturate(1.45) contrast(1.08)'
      : isCrimsonMoon
      ? 'hue-rotate(95deg) saturate(1.5) contrast(1.1)'
      : 'saturate(1.12) contrast(1.04)';

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={artUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute right-0 inset-y-0 w-full h-full object-cover object-center transition-all duration-300"
          style={{
            filter: filterStyle,
            WebkitMaskImage: isLightWash
              ? 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.88) 42%, black 75%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.68) 38%, black 70%)',
            maskImage: isLightWash
              ? 'linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.88) 42%, black 75%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.68) 38%, black 70%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isLightWash
              ? 'linear-gradient(90deg, rgba(252,235,238,0.72) 0%, rgba(252,235,238,0.28) 42%, transparent 78%)'
              : isVader
              ? 'linear-gradient(90deg, rgba(28,8,12,0.88) 0%, rgba(69,10,10,0.35) 45%, transparent 82%)'
              : 'linear-gradient(90deg, rgba(14,15,20,0.85) 0%, rgba(14,15,20,0.42) 44%, transparent 85%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="w-full h-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(16,18,27,0.92) 0%, rgba(88,101,242,0.34) 55%, rgba(236,72,153,0.28) 100%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-white/25" />
    </div>
  );
};

export const NameplateRowDecor: React.FC<{ nameplate: NameplateId }> = ({ nameplate }) => {
  if (nameplate === 'none') return null;

  if (nameplate === 'miyabi') {
    return (
      <div className="flex items-center justify-end shrink-0 z-10">
        <svg viewBox="0 0 80 48" className="w-16 h-10 shrink-0 overflow-visible">
          <path d="M5 42 Q25 10 60 18 Q42 36 18 46 Z" fill="#22d3ee" opacity="0.55" className="anim-flame" />
          <g className="anim-float">
            <circle cx="52" cy="24" r="13" fill="#18181b" stroke="#38bdf8" strokeWidth="2" />
            <g className="anim-eye-blink">
              <ellipse cx="52" cy="25" rx="7" ry="4" fill="#ef4444" />
              <circle cx="52" cy="25" r="2" fill="#000" />
            </g>
          </g>
        </svg>
      </div>
    );
  }

  /* Custom SVG Emblem Crests for every Nameplate (zero raw emoji fallbacks) */
  if (nameplate === 'deadpool' || nameplate === 'wolverine') {
    const isWolv = nameplate === 'wolverine';
    return (
      <svg viewBox="0 0 40 32" className="w-9 h-7 shrink-0 z-10 anim-float">
        {isWolv ? (
          <>
            <path d="M10 26 L18 5 M19 27 L25 4 M28 26 L33 6" stroke="#facc15" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M10 26 L18 5 M19 27 L25 4 M28 26 L33 6" stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" />
          </>
        ) : (
          <>
            <line x1="8" y1="5" x2="32" y2="27" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="5" x2="8" y2="27" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="20" cy="16" r="7" fill="#dc2626" stroke="#09090b" strokeWidth="1.5" />
            <ellipse cx="17.5" cy="15.5" rx="1.6" ry="2.2" fill="#ffffff" />
            <ellipse cx="22.5" cy="15.5" rx="1.6" ry="2.2" fill="#ffffff" />
          </>
        )}
      </svg>
    );
  }

  if (nameplate === 'dbd' || nameplate === 'marcas-aranazos' || nameplate === 'red-sangre') {
    const tone = nameplate === 'red-sangre' ? '#ef4444' : '#f97316';
    return (
      <svg viewBox="0 0 40 32" className="w-9 h-7 shrink-0 z-10 anim-ember">
        <path d="M8 25 Q18 14 34 6" stroke={tone} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M12 28 Q21 18 35 12" stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M18 29 Q25 22 36 18" stroke={tone} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (nameplate === 'conejito-fresero') {
    return (
      <svg viewBox="0 0 36 32" className="w-8 h-7 shrink-0 z-10 anim-float">
        <ellipse cx="14" cy="10" rx="3.2" ry="7.5" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.3" transform="rotate(-10 14 10)" />
        <ellipse cx="22" cy="10" rx="3.2" ry="7.5" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.3" transform="rotate(10 22 10)" />
        <circle cx="18" cy="20" r="8" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.4" />
        <circle cx="15" cy="19" r="1.3" fill="#be185d" />
        <circle cx="21" cy="19" r="1.3" fill="#be185d" />
        <path d="M16.5 22 Q18 23.8 19.5 22" stroke="#f43f5e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (nameplate === 'el-mismo-pato') {
    return (
      <svg viewBox="0 0 36 32" className="w-8 h-7 shrink-0 z-10 anim-float">
        <circle cx="18" cy="16" r="9" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.4" />
        <path d="M24 16 Q32 16 31 19 Q27 21 23 19 Z" fill="#fb923c" />
        <circle cx="21" cy="14" r="1.4" fill="#0f172a" />
      </svg>
    );
  }

  if (nameplate === 'gojo' || nameplate === 'sukuna' || nameplate === 'yuji') {
    const c1 = nameplate === 'gojo' ? '#38bdf8' : nameplate === 'sukuna' ? '#ef4444' : '#fb7185';
    const c2 = nameplate === 'gojo' ? '#a855f7' : '#f97316';
    return (
      <svg viewBox="0 0 36 32" className="w-8 h-7 shrink-0 z-10 anim-holo-glow">
        <circle cx="14" cy="16" r="7" fill="none" stroke={c1} strokeWidth="2.4" />
        <circle cx="22" cy="16" r="7" fill="none" stroke={c2} strokeWidth="2.4" />
        <circle cx="18" cy="16" r="2.2" fill="#ffffff" />
      </svg>
    );
  }

  if (nameplate === 'observador' || nameplate === 'almas' || nameplate === 'luna-oscura' || nameplate === 'lobo') {
    return (
      <svg viewBox="0 0 36 32" className="w-8 h-7 shrink-0 z-10 anim-ghost">
        <path d="M22 6 A10 10 0 1 0 28 24 A8 8 0 1 1 22 6 Z" fill="#f4f4f5" />
        <circle cx="25" cy="12" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  if (nameplate === 'rama' || nameplate === 'sakura' || nameplate === 'flores-luna' || nameplate === 'jardin-secreto') {
    const petal = nameplate === 'flores-luna' ? '#fef08a' : nameplate === 'jardin-secreto' ? '#4ade80' : '#f9a8d4';
    return (
      <svg viewBox="0 0 36 32" className="w-8 h-7 shrink-0 z-10 anim-sway">
        <circle cx="18" cy="11" r="4" fill={petal} />
        <circle cx="13" cy="16" r="4" fill={petal} />
        <circle cx="23" cy="16" r="4" fill={petal} />
        <circle cx="16" cy="21" r="4" fill={petal} />
        <circle cx="20" cy="21" r="4" fill={petal} />
        <circle cx="18" cy="16" r="2.6" fill="#fde047" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 shrink-0 z-10 anim-twinkle">
      <path d="M16 4 L18.5 12.5 L27 15 L18.5 17.5 L16 26 L13.5 17.5 L5 15 L13.5 12.5 Z" fill="#ffffff" opacity="0.88" />
    </svg>
  );
};

export const PROFILE_EFFECT_META: Record<
  Exclude<ProfileEffectId, 'none'>,
  {
    title: string;
    primary: string;
    secondary: string;
    artUrl?: string;
    particles: 'sparks' | 'slashes' | 'embers' | 'petals' | 'lightning' | 'horror' | 'cyber';
  }
> = {
  gojo: {
    title: 'VACÍO PÚRPURA',
    primary: '#38bdf8',
    secondary: '#a855f7',
    artUrl: GENERATED_ASSETS.shopGojoArt,
    particles: 'lightning',
  },
  sukuna: {
    title: 'SANTUARIO MALÉVOLO',
    primary: '#f97316',
    secondary: '#ef4444',
    artUrl: GENERATED_ASSETS.shopSukunaArt,
    particles: 'slashes',
  },
  yuji: {
    title: 'DESTELLO NEGRO',
    primary: '#fb7185',
    secondary: '#dc2626',
    artUrl: GENERATED_ASSETS.shopYujiArt,
    particles: 'lightning',
  },
  cerbero: {
    title: 'CERBERO',
    primary: '#ec4899',
    secondary: '#a855f7',
    artUrl: GENERATED_ASSETS.shopCerberoArt,
    particles: 'embers',
  },
  pesadilla: {
    title: 'HORA DE PESADILLA',
    primary: '#e4e4e7',
    secondary: '#52525b',
    artUrl: GENERATED_ASSETS.shopPesadillaArt,
    particles: 'horror',
  },
  jugar: {
    title: 'VAMOS A JUGAR',
    primary: '#f4f4f5',
    secondary: '#71717a',
    artUrl: GENERATED_ASSETS.shopVamosAJugar,
    particles: 'horror',
  },
  observador: {
    title: 'OBSERVADOR',
    primary: '#ffffff',
    secondary: '#52525b',
    artUrl: GENERATED_ASSETS.shopObserverEyes,
    particles: 'horror',
  },
  almas: {
    title: 'ALMAS ATRAPADAS',
    primary: '#e4e4e7',
    secondary: '#71717a',
    artUrl: GENERATED_ASSETS.shopTrappedSouls,
    particles: 'horror',
  },
  'hombre-polilla': {
    title: 'HOMBRE POLILLA',
    primary: '#ef4444',
    secondary: '#94a3b8',
    artUrl: GENERATED_ASSETS.shopMothmanArt,
    particles: 'horror',
  },
  'flores-luna': {
    title: 'FLORES DE LUNA',
    primary: '#fef08a',
    secondary: '#4ade80',
    artUrl: GENERATED_ASSETS.shopMoonflowersArt,
    particles: 'petals',
  },
  'diablo-jersey': {
    title: 'DIABLO DE JERSEY',
    primary: '#94a3b8',
    secondary: '#38bdf8',
    artUrl: GENERATED_ASSETS.shopJerseyDevilArt,
    particles: 'horror',
  },
  llorona: {
    title: 'LA LLORONA',
    primary: '#2dd4bf',
    secondary: '#99f6e4',
    artUrl: GENERATED_ASSETS.shopLloronaArt,
    particles: 'sparks',
  },
  jackalope: {
    title: 'JACKALOPE',
    primary: '#bef264',
    secondary: '#fde047',
    artUrl: GENERATED_ASSETS.shopMoonflowersArt,
    particles: 'petals',
  },
  gancho: {
    title: 'GANCHO DEL ENTE',
    primary: '#f97316',
    secondary: '#dc2626',
    artUrl: GENERATED_ASSETS.shopDbdHookArt,
    particles: 'embers',
  },
  'cuervos-luna': {
    title: 'CUERVOS DE LUNA OSCURA',
    primary: '#e2e8f0',
    secondary: '#475569',
    artUrl: GENERATED_ASSETS.shopLoboLuna,
    particles: 'horror',
  },
  'red-sangre': {
    title: 'RED DE SANGRE',
    primary: '#ef4444',
    secondary: '#991b1b',
    artUrl: GENERATED_ASSETS.shopDbdBloodwebArt,
    particles: 'embers',
  },
  'el-ente': {
    title: 'EL ENTE',
    primary: '#fb923c',
    secondary: '#dc2626',
    artUrl: GENERATED_ASSETS.shopDbdHookArt,
    particles: 'embers',
  },
  boveda: {
    title: 'MÁS ALLÁ DE LA CÁMARA',
    primary: '#f97316',
    secondary: '#38bdf8',
    artUrl: GENERATED_ASSETS.shopBannerBorderlands,
    particles: 'lightning',
  },
  saqueo: {
    title: 'SAQUEO ARCOÍRIS',
    primary: '#facc15',
    secondary: '#ec4899',
    artUrl: GENERATED_ASSETS.shopCromaArt,
    particles: 'sparks',
  },
  trebol: {
    title: 'TRÉBOL DE LA SUERTE',
    primary: '#4ade80',
    secondary: '#fde047',
    artUrl: GENERATED_ASSETS.shopLofiPlants,
    particles: 'petals',
  },
  'jardin-secreto': {
    title: 'JARDÍN SECRETO',
    primary: '#2dd4bf',
    secondary: '#86efac',
    artUrl: GENERATED_ASSETS.shopBannerSecretGarden,
    particles: 'petals',
  },
  'luna-mistica': {
    title: 'LUNA MÍSTICA',
    primary: '#60a5fa',
    secondary: '#c084fc',
    artUrl: GENERATED_ASSETS.shopCelestialMoonArt,
    particles: 'sparks',
  },
  adorable: {
    title: 'ADORABLE',
    primary: '#f472b6',
    secondary: '#c084fc',
    artUrl: GENERATED_ASSETS.shopBannerRawrXd,
    particles: 'sparks',
  },
  'scene-xd': {
    title: 'SCENE RAWR XD',
    primary: '#a3e635',
    secondary: '#ec4899',
    artUrl: GENERATED_ASSETS.shopRawrSceneArt,
    particles: 'lightning',
  },
  grabado: {
    title: 'GRABADO JAPONÉS',
    primary: '#f472b6',
    secondary: '#dc2626',
    artUrl: GENERATED_ASSETS.shopGrabadoJapones,
    particles: 'petals',
  },
  lobo: {
    title: 'LOBO Y LUNA',
    primary: '#c084fc',
    secondary: '#fef08a',
    artUrl: GENERATED_ASSETS.shopLoboLuna,
    particles: 'sparks',
  },
  miyabi: {
    title: 'HOSHIMI MIYABI',
    primary: '#38bdf8',
    secondary: '#ef4444',
    artUrl: GENERATED_ASSETS.shopMiyabiArt,
    particles: 'slashes',
  },
  ellen: {
    title: 'ELLEN JOE',
    primary: '#38bdf8',
    secondary: '#f43f5e',
    artUrl: GENERATED_ASSETS.shopEllenArt,
    particles: 'slashes',
  },
  burnice: {
    title: 'BURNICE',
    primary: '#fb923c',
    secondary: '#fde047',
    artUrl: GENERATED_ASSETS.shopBurniceArt,
    particles: 'embers',
  },
  deadpool: {
    title: 'DEADPOOL & WOLVERINE',
    primary: '#ef4444',
    secondary: '#facc15',
    artUrl: GENERATED_ASSETS.deadpoolBanner,
    particles: 'slashes',
  },
  dbd: {
    title: 'LA ENTIDAD',
    primary: '#dc2626',
    secondary: '#f97316',
    artUrl: GENERATED_ASSETS.dbdBanner,
    particles: 'embers',
  },
  sparks: {
    title: 'CHISPAS NEÓN',
    primary: '#38bdf8',
    secondary: '#fde047',
    particles: 'sparks',
  },
  cyber: {
    title: 'LLUVIA CIBERNÉTICA',
    primary: '#22d3ee',
    secondary: '#818cf8',
    particles: 'cyber',
  },
  crimson: {
    title: 'AURA CARMESÍ',
    primary: '#ef4444',
    secondary: '#fb7185',
    particles: 'embers',
  },
};

export const ProfileEffectAnimationOverlay: React.FC<{
  effect?: ProfileEffectId;
  playKey?: number | string;
  className?: string;
}> = ({ effect, playKey = 0, className = '' }) => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!effect || effect === 'none') {
      setPlaying(false);
      return;
    }
    setPlaying(true);
    const timer = setTimeout(() => {
      setPlaying(false);
    }, 3550);
    return () => clearTimeout(timer);
  }, [effect, playKey]);

  if (!effect || effect === 'none') return null;
  const meta = PROFILE_EFFECT_META[effect];
  if (!meta) return null;

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key={`${effect}-${playKey}`}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.96, 1, 1.01, 1.04],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 3.45,
            times: [0, 0.13, 0.74, 1],
            ease: 'easeInOut',
          }}
          className={`absolute inset-0 pointer-events-none overflow-hidden z-20 ${className}`}
        >
          {/* Ambient theme radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 76% 24%, ${meta.primary}48 0%, ${meta.secondary}26 42%, transparent 78%)`,
            }}
          />

          {/* Studio artwork entrance sweep */}
          {meta.artUrl && (
            <motion.img
              src={meta.artUrl}
              alt=""
              referrerPolicy="no-referrer"
              initial={{ x: 26, scale: 1.08, opacity: 0 }}
              animate={{ x: [26, 0, -6], scale: [1.08, 1.02, 1.06], opacity: [0, 0.88, 0.78] }}
              transition={{ duration: 2.6, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-cover object-center mix-blend-screen"
              style={{
                maskImage:
                  'radial-gradient(ellipse 80% 85% at 78% 35%, black 22%, rgba(0,0,0,0.45) 58%, transparent 88%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse 80% 85% at 78% 35%, black 22%, rgba(0,0,0,0.45) 58%, transparent 88%)',
              }}
            />
          )}

          {/* Diagonal energy slash / beam flash on entry */}
          <motion.div
            initial={{ x: '-120%', opacity: 0 }}
            animate={{ x: ['-120%', '135%'], opacity: [0, 0.85, 0] }}
            transition={{ duration: 1.15, ease: 'easeOut' }}
            className="absolute inset-y-0 w-1/2 -skew-x-12"
            style={{
              background: `linear-gradient(90deg, transparent, ${meta.primary}55, #ffffff70, ${meta.secondary}45, transparent)`,
            }}
          />

          {/* Kinetic particle system matching effect style */}
          {meta.particles === 'slashes' && (
            <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full">
              <motion.path
                d="M 40 210 Q 190 105 390 25"
                fill="none"
                stroke={meta.primary}
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, times: [0, 0.35, 1] }}
              />
              <motion.path
                d="M 85 240 Q 245 140 395 75"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.95, 0] }}
                transition={{ duration: 1.5, delay: 0.14, times: [0, 0.35, 1] }}
              />
              <motion.path
                d="M 10 130 Q 180 45 360 12"
                fill="none"
                stroke={meta.secondary}
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.9, 0] }}
                transition={{ duration: 1.4, delay: 0.25, times: [0, 0.35, 1] }}
              />
            </svg>
          )}

          {meta.particles === 'lightning' && (
            <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full">
              <motion.path
                d="M 290 8 L 255 72 L 288 86 L 235 162"
                fill="none"
                stroke={meta.primary}
                strokeWidth="4.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: 1, repeatDelay: 0.25 }}
              />
              <motion.path
                d="M 340 32 L 308 92 L 336 105 L 286 184"
                fill="none"
                stroke={meta.secondary}
                strokeWidth="3.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.95, 0] }}
                transition={{ duration: 1.15, delay: 0.2, repeat: 1, repeatDelay: 0.25 }}
              />
              <motion.circle
                cx="315"
                cy="70"
                r="26"
                fill={meta.primary}
                initial={{ scale: 0.4, opacity: 0.7 }}
                animate={{ scale: [0.4, 1.5, 2.2], opacity: [0.7, 0.35, 0] }}
                transition={{ duration: 1.4, repeat: 1 }}
              />
            </svg>
          )}

          {(meta.particles === 'embers' ||
            meta.particles === 'sparks' ||
            meta.particles === 'petals' ||
            meta.particles === 'cyber' ||
            meta.particles === 'horror') && (
            <div className="absolute inset-0 pointer-events-none">
              {[
                { left: '62%', top: '18%', size: 13, delay: 0, rot: 14 },
                { left: '78%', top: '34%', size: 15, delay: 0.15, rot: -22 },
                { left: '88%', top: '22%', size: 11, delay: 0.3, rot: 35 },
                { left: '54%', top: '44%', size: 12, delay: 0.45, rot: -15 },
                { left: '72%', top: '56%', size: 14, delay: 0.2, rot: 28 },
                { left: '91%', top: '48%', size: 11, delay: 0.5, rot: -30 },
                { left: '44%', top: '24%', size: 10, delay: 0.35, rot: 10 },
              ].map((dot, idx) => {
                const tone = idx % 2 === 0 ? meta.primary : meta.secondary;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 16, scale: 0.4, rotate: dot.rot }}
                    animate={{
                      opacity: [0, 1, 0.9, 0],
                      y: meta.particles === 'petals' ? [0, 28, 56] : [18, -14, -40],
                      x: meta.particles === 'petals' ? [0, -14, -28] : [0, 6, -4],
                      scale: [0.4, 1.15, 0.72],
                      rotate: meta.particles === 'petals' ? [dot.rot, dot.rot + 45, dot.rot + 95] : [0, 15, 0],
                    }}
                    transition={{ duration: 2.35, delay: dot.delay, ease: 'easeOut' }}
                    className="absolute"
                    style={{
                      left: dot.left,
                      top: dot.top,
                      filter: `drop-shadow(0 0 8px ${tone})`,
                    }}
                  >
                    {meta.particles === 'petals' ? (
                      <svg width={dot.size} height={dot.size} viewBox="0 0 20 20">
                        <path d="M10 1 C15 5 17 13 10 19 C3 13 5 5 10 1 Z" fill={tone} />
                      </svg>
                    ) : meta.particles === 'sparks' ? (
                      <svg width={dot.size} height={dot.size} viewBox="0 0 20 20">
                        <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill={tone} />
                      </svg>
                    ) : meta.particles === 'horror' ? (
                      <svg width={dot.size + 4} height={dot.size} viewBox="0 0 24 16">
                        <ellipse cx="12" cy="8" rx="10" ry="5" fill="#ffffff" stroke="#09090b" strokeWidth="1.2" />
                        <circle cx="12" cy="8" r="2.8" fill="#09090b" />
                      </svg>
                    ) : meta.particles === 'cyber' ? (
                      <span
                        className="block rounded-full"
                        style={{
                          width: 2.5,
                          height: dot.size * 1.8,
                          background: `linear-gradient(180deg, #ffffff, ${tone}, transparent)`,
                        }}
                      />
                    ) : (
                      <svg width={dot.size} height={dot.size + 4} viewBox="0 0 16 20">
                        <path d="M8 1 Q14 9 8 19 Q2 9 8 1 Z" fill={tone} />
                        <circle cx="8" cy="12" r="2.2" fill="#ffffff" />
                      </svg>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stylized Effect Title Signature */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: [0, 0.95, 0.9, 0], x: [18, 0, -4, -10] }}
            transition={{ duration: 2.8, times: [0, 0.16, 0.72, 1], ease: 'easeOut' }}
            className="absolute top-3.5 right-4 z-10 text-right"
          >
            <span
              className="inline-block font-display font-black text-base sm:text-xl tracking-wider uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
              style={{
                color: '#ffffff',
                textShadow: `0 0 16px ${meta.primary}, 0 2px 8px rgba(0,0,0,0.95)`,
              }}
            >
              {meta.title}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const WumpusNitroFly: React.FC = () => (
  <svg viewBox="0 0 140 120" className="w-28 h-24 shrink-0 anim-float" aria-hidden="true">
    <path d="M12 36 Q26 24 44 34 Q58 24 70 36 Z" fill="#a855f7" opacity="0.35" />
    <path d="M62 85 Q76 74 96 84 Q108 75 120 86 Z" fill="#a855f7" opacity="0.3" />
    <path d="M84 44 L126 16 L112 44 L132 48 L96 62 Z" fill="#e2e8f0" />
    <path d="M84 48 L118 28 L108 46 Z" fill="#cbd5e1" />
    <ellipse cx="66" cy="64" rx="22" ry="26" fill="#7c93e6" />
    <path d="M46 46 Q66 26 86 46 L86 58 Q66 64 46 58 Z" fill="#ffffff" />
    <rect x="44" y="42" width="32" height="16" rx="8" fill="#1e293b" />
    <circle cx="54" cy="50" r="2.5" fill="#38bdf8" />
    <circle cx="67" cy="50" r="2.5" fill="#38bdf8" />
    <ellipse cx="52" cy="62" rx="11" ry="8" fill="#a5b4fc" />
    <circle cx="48" cy="62" r="2" fill="#4338ca" />
    <circle cx="55" cy="62" r="2" fill="#4338ca" />
    <path d="M84 68 L108 82 L88 86 Z" fill="#fb923c" />
  </svg>
);

export const WumpusScooter: React.FC = () => (
  <svg viewBox="0 0 140 120" className="w-28 h-24 shrink-0 anim-float" aria-hidden="true">
    <path d="M18 32 Q36 22 52 34 Z" fill="#1d4ed8" opacity="0.35" />
    <circle cx="48" cy="94" r="14" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" />
    <circle cx="94" cy="94" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="4" />
    <path d="M44 74 Q68 68 88 88 L46 88 Z" fill="#f97316" />
    <line x1="56" y1="42" x2="48" y2="80" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="76" cy="58" rx="18" ry="20" fill="#7c93e6" />
    <path d="M58 44 Q76 24 94 44 Z" fill="#f8fafc" />
    <ellipse cx="64" cy="52" rx="10" ry="7" fill="#a5b4fc" />
    <circle cx="60" cy="52" r="1.8" fill="#4338ca" />
    <circle cx="67" cy="52" r="1.8" fill="#4338ca" />
    <line x1="102" y1="62" x2="102" y2="88" stroke="#e2e8f0" strokeWidth="2.5" />
    <polygon points="102,62 120,68 102,74" fill="#fb923c" />
  </svg>
);
