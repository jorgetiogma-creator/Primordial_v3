import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Flame,
  Gift,
  Heart,
  Image as ImageIcon,
  Layers,
  Menu,
  RotateCcw,
  Search,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import {
  DirectMessageThread,
  NameplateId,
  ProfileFrameId,
  ShopBundle,
  ShopCollectionId,
  UserProfile,
} from '../types/discord';
import {
  AvatarArtwork,
  AvatarDecorationRing,
  DiscordLogo,
  GENERATED_ASSETS,
  NameplateRowDecor,
  NameplateStripBackground,
  OrbsCrystalIcon,
  ProfileEffectAnimationOverlay,
  ProfileFrameArtwork,
  SafeImage,
  UserAvatar,
} from './DiscordArt';

interface ShopViewProps {
  user: UserProfile;
  bundles: ShopBundle[];
  dms: DirectMessageThread[];
  wishlistIds: string[];
  ownedBundleIds: string[];
  selectedBundle: ShopBundle | null;
  onSelectBundle: (bundle: ShopBundle | null) => void;
  onToggleWishlist: (bundleId: string) => void;
  onBuyBundle: (bundle: ShopBundle, useOrbs: boolean) => void;
  onEquipBundle: (bundle: ShopBundle) => void;
  onGiftBundle: (bundle: ShopBundle, recipientId: string, recipientName: string) => void;
  onBack: () => void;
}

const getBundleArtUrl = (variant: ShopBundle['artVariant']): string | null => {
  switch (variant) {
    case 'miyabi':
      return GENERATED_ASSETS.shopMiyabiArt;
    case 'ellen':
      return GENERATED_ASSETS.shopEllenArt;
    case 'burnice':
      return GENERATED_ASSETS.shopBurniceArt;
    case 'deadpool':
    case 'wolverine':
      return GENERATED_ASSETS.deadpoolBanner;
    case 'dbd':
    case 'marcas-aranazos':
      return GENERATED_ASSETS.dbdBanner;
    case 'plantas':
    case 'trebol':
      return GENERATED_ASSETS.shopLofiPlants;
    case 'gato':
      return GENERATED_ASSETS.shopCozyCat;
    case 'almas':
      return GENERATED_ASSETS.shopTrappedSouls;
    case 'observador':
    case 'observador-marco':
      return GENERATED_ASSETS.shopObserverEyes;
    case 'pesadilla':
    case 'tentempie':
      return GENERATED_ASSETS.shopPesadillaArt;
    case 'acechador':
      return GENERATED_ASSETS.shopWaterStalkerArt;
    case 'pato':
      return GENERATED_ASSETS.shopPatoArt;
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
    case 'llama':
      return GENERATED_ASSETS.shopLlamaInfernal;
    case 'rama':
      return GENERATED_ASSETS.shopRamaEnFlor;
    case 'condenacion':
    case 'marea-lluvia':
      return GENERATED_ASSETS.shopCondenacionEterna;
    case 'jugar':
      return GENERATED_ASSETS.shopVamosAJugar;
    case 'espectro':
    case 'espectro-marco':
    case 'ramas-desnudas':
      return GENERATED_ASSETS.shopEspectroArt;
    case 'grabado':
      return GENERATED_ASSETS.shopGrabadoJapones;
    case 'lobo':
    case 'luna-oscura':
    case 'luna-oscura-marco':
    case 'cuervos-luna':
      return GENERATED_ASSETS.shopLoboLuna;
    case 'vice-city':
      return GENERATED_ASSETS.viceCityBanner;
    case 'dune':
      return GENERATED_ASSETS.duneBanner;
    case 'croma':
    case 'saqueo-arcoiris':
      return GENERATED_ASSETS.shopCromaArt;
    case 'orejas':
      return GENERATED_ASSETS.shopOrejasGato;
    case 'hombre-polilla':
    case 'polilla':
      return GENERATED_ASSETS.shopMothmanArt;
    case 'flores-luna':
    case 'flores-luna-marco':
    case 'jackalope':
      return GENERATED_ASSETS.shopMoonflowersArt;
    case 'cuernos':
    case 'diablo-jersey':
    case 'diablo-jersey-marco':
      return GENERATED_ASSETS.shopJerseyDevilArt;
    case 'fuegos-fatuos':
    case 'llorona':
      return GENERATED_ASSETS.shopLloronaArt;
    case 'el-ente':
    case 'el-ente-marco':
    case 'gancho':
    case 'calabazas':
      return GENERATED_ASSETS.shopDbdHookArt;
    case 'red-sangre':
      return GENERATED_ASSETS.shopDbdBloodwebArt;
    case 'hazlo-brillante':
    case 'luces-camara':
      return GENERATED_ASSETS.shopCerberoArt;
    case 'onda-cosmica':
      return GENERATED_ASSETS.shopLloronaArt;
    case 'conejito-fresero':
      return GENERATED_ASSETS.shopStrawberryBunnyArt;
    case 'mas-alla-boveda':
    case 'claptrap':
      return GENERATED_ASSETS.shopBannerBorderlands;
    case 'luna-mistica':
    case 'estrella-nocturna':
    case 'flores-lunares':
      return GENERATED_ASSETS.shopCelestialMoonArt;
    case 'jardin-secreto':
    case 'lirio':
      return GENERATED_ASSETS.shopBannerSecretGarden;
    case 'adorable':
      return GENERATED_ASSETS.shopBannerRawrXd;
    case 'random-xd':
    case 'scene-xd':
      return GENERATED_ASSETS.shopRawrSceneArt;
    /* 18 Naruto Shinobi & Dōjutsu Collectibles */
    case 'naruto-sabio':
    case 'naruto-barion':
    case 'kurama':
      return GENERATED_ASSETS.narutoKuramaArt;
    case 'sasuke':
    case 'sasuke-rinnegan':
    case 'boruto-karma':
      return GENERATED_ASSETS.narutoSasukeBorutoArt;
    case 'obito-tobi':
    case 'obito-juubi':
    case 'madara-edo':
    case 'madara-rikudo':
      return GENERATED_ASSETS.narutoMadaraObitoArt;
    case 'rinnegan-deva':
    case 'rinne-sharingan':
    case 'sharingan-3tomoe':
    case 'sharingan-itachi':
    case 'sharingan-kamui':
    case 'sharingan-shisui':
    case 'ems-sasuke':
    case 'ems-madara':
      return GENERATED_ASSETS.narutoDoujutsuArt;
    default:
      return null;
  }
};

interface BundleThemeMeta {
  gradient: string;
  glow: string;
  stageBg: string;
}

const getBundleTheme = (variant: ShopBundle['artVariant']): BundleThemeMeta => {
  switch (variant) {
    case 'naruto-sabio':
    case 'naruto-barion':
    case 'kurama':
      return {
        gradient: 'from-[#291005] via-[#170905] to-[#080505]',
        glow: 'rgba(249, 115, 22, 0.45)',
        stageBg: '#120704',
      };
    case 'sasuke':
    case 'boruto-karma':
      return {
        gradient: 'from-[#061829] via-[#0c1026] to-[#060710]',
        glow: 'rgba(56, 189, 248, 0.44)',
        stageBg: '#060c18',
      };
    case 'sasuke-rinnegan':
    case 'rinnegan-deva':
      return {
        gradient: 'from-[#1a0a2e] via-[#100921] to-[#07060d]',
        glow: 'rgba(168, 85, 247, 0.45)',
        stageBg: '#0d0618',
      };
    case 'obito-tobi':
    case 'obito-juubi':
    case 'madara-edo':
    case 'madara-rikudo':
    case 'rinne-sharingan':
    case 'sharingan-3tomoe':
    case 'sharingan-itachi':
    case 'sharingan-kamui':
    case 'sharingan-shisui':
    case 'ems-sasuke':
    case 'ems-madara':
      return {
        gradient: 'from-[#2b060a] via-[#140709] to-[#060506]',
        glow: 'rgba(220, 38, 38, 0.45)',
        stageBg: '#110406',
      };
    case 'miyabi':
      return {
        gradient: 'from-[#071a24] via-[#0c111b] to-[#1a0a12]',
        glow: 'rgba(34, 211, 238, 0.36)',
        stageBg: '#070c12',
      };
    case 'ellen':
      return {
        gradient: 'from-[#161822] via-[#11131a] to-[#260b14]',
        glow: 'rgba(244, 63, 94, 0.34)',
        stageBg: '#0c0d12',
      };
    case 'burnice':
      return {
        gradient: 'from-[#241307] via-[#170e09] to-[#290b08]',
        glow: 'rgba(249, 115, 22, 0.38)',
        stageBg: '#110a07',
      };
    case 'plantas':
    case 'trebol':
    case 'jardin-secreto':
    case 'lirio':
      return {
        gradient: 'from-[#0b1f15] via-[#0a1714] to-[#121310]',
        glow: 'rgba(74, 222, 128, 0.34)',
        stageBg: '#09110d',
      };
    case 'croma':
    case 'saqueo-arcoiris':
      return {
        gradient: 'from-[#160b24] via-[#0d1024] to-[#081b24]',
        glow: 'rgba(192, 132, 252, 0.42)',
        stageBg: '#090a12',
      };
    case 'gato':
      return {
        gradient: 'from-[#231409] via-[#17100b] to-[#0e0c0a]',
        glow: 'rgba(251, 146, 60, 0.34)',
        stageBg: '#100c08',
      };
    case 'almas':
    case 'pesadilla':
    case 'espectro':
    case 'espectro-marco':
    case 'jugar':
    case 'observador':
    case 'observador-marco':
    case 'tentempie':
    case 'acechador':
      return {
        gradient: 'from-[#151519] via-[#0c0c10] to-[#050507]',
        glow: 'rgba(228, 228, 231, 0.24)',
        stageBg: '#08080b',
      };
    case 'hombre-polilla':
    case 'polilla':
    case 'ramas-desnudas':
      return {
        gradient: 'from-[#17191f] via-[#0f1116] to-[#07080a]',
        glow: 'rgba(239, 68, 68, 0.28)',
        stageBg: '#0a0b0e',
      };
    case 'flores-luna':
    case 'flores-luna-marco':
    case 'jackalope':
      return {
        gradient: 'from-[#111e14] via-[#0c140e] to-[#070a08]',
        glow: 'rgba(163, 230, 53, 0.34)',
        stageBg: '#09100b',
      };
    case 'cuernos':
    case 'diablo-jersey':
    case 'diablo-jersey-marco':
      return {
        gradient: 'from-[#161c24] via-[#0d1218] to-[#07090d]',
        glow: 'rgba(148, 163, 184, 0.32)',
        stageBg: '#090c10',
      };
    case 'fuegos-fatuos':
    case 'llorona':
    case 'onda-cosmica':
      return {
        gradient: 'from-[#082220] via-[#0a1617] to-[#06090b]',
        glow: 'rgba(45, 212, 191, 0.42)',
        stageBg: '#071111',
      };
    case 'el-ente':
    case 'el-ente-marco':
    case 'gancho':
    case 'calabazas':
    case 'dbd':
      return {
        gradient: 'from-[#281107] via-[#150b07] to-[#080504]',
        glow: 'rgba(249, 115, 22, 0.42)',
        stageBg: '#120805',
      };
    case 'red-sangre':
    case 'marcas-aranazos':
      return {
        gradient: 'from-[#2a080c] via-[#170609] to-[#070305]',
        glow: 'rgba(239, 68, 68, 0.45)',
        stageBg: '#110406',
      };
    case 'hazlo-brillante':
    case 'luces-camara':
    case 'mas-alla-boveda':
    case 'claptrap':
      return {
        gradient: 'from-[#261607] via-[#170f0b] to-[#0b080e]',
        glow: 'rgba(251, 191, 36, 0.42)',
        stageBg: '#110b08',
      };
    case 'conejito-fresero':
      return {
        gradient: 'from-[#2c101d] via-[#180c14] to-[#0b070b]',
        glow: 'rgba(244, 114, 182, 0.42)',
        stageBg: '#140810',
      };
    case 'luna-mistica':
    case 'estrella-nocturna':
    case 'flores-lunares':
      return {
        gradient: 'from-[#121633] via-[#18102c] to-[#080914]',
        glow: 'rgba(139, 92, 246, 0.42)',
        stageBg: '#090b1a',
      };
    case 'adorable':
    case 'random-xd':
    case 'scene-xd':
      return {
        gradient: 'from-[#250a28] via-[#150c20] to-[#09120b]',
        glow: 'rgba(236, 72, 153, 0.42)',
        stageBg: '#120816',
      };
    case 'gojo':
      return {
        gradient: 'from-[#07192b] via-[#110e29] to-[#090b14]',
        glow: 'rgba(56, 189, 248, 0.42)',
        stageBg: '#070b14',
      };
    case 'sukuna':
      return {
        gradient: 'from-[#2a0909] via-[#1a0a07] to-[#090506]',
        glow: 'rgba(239, 68, 68, 0.42)',
        stageBg: '#100606',
      };
    case 'yuji':
      return {
        gradient: 'from-[#260912] via-[#19080f] to-[#090507]',
        glow: 'rgba(251, 113, 133, 0.38)',
        stageBg: '#10060a',
      };
    case 'cerbero':
    case 'llama':
      return {
        gradient: 'from-[#1f0729] via-[#13071c] to-[#08040c]',
        glow: 'rgba(236, 72, 153, 0.42)',
        stageBg: '#0e0614',
      };
    case 'lobo':
    case 'luna-oscura':
    case 'luna-oscura-marco':
    case 'cuervos-luna':
      return {
        gradient: 'from-[#1a0e2e] via-[#110d26] to-[#090b16]',
        glow: 'rgba(192, 132, 252, 0.38)',
        stageBg: '#0b0916',
      };
    case 'grabado':
      return {
        gradient: 'from-[#1e1d1b] via-[#131312] to-[#090909]',
        glow: 'rgba(244, 114, 182, 0.25)',
        stageBg: '#0e0e0e',
      };
    case 'pato':
      return {
        gradient: 'from-[#0284c7] via-[#0ea5e9] to-[#0369a1]',
        glow: 'rgba(56, 189, 248, 0.45)',
        stageBg: '#0c4a6e',
      };
    case 'vader':
      return {
        gradient: 'from-[#24080a] via-[#120a0d] to-[#08080a]',
        glow: 'rgba(220, 38, 38, 0.36)',
        stageBg: '#0d0708',
      };
    case 'rama':
      return {
        gradient: 'from-[#241216] via-[#160f12] to-[#0b090b]',
        glow: 'rgba(251, 113, 133, 0.3)',
        stageBg: '#110b0e',
      };
    case 'condenacion':
    case 'marea-lluvia':
      return {
        gradient: 'from-[#081d24] via-[#0a131a] to-[#06090d]',
        glow: 'rgba(34, 211, 238, 0.36)',
        stageBg: '#060c10',
      };
    case 'orejas':
      return {
        gradient: 'from-[#1a1624] via-[#12111a] to-[#09090e]',
        glow: 'rgba(249, 168, 212, 0.32)',
        stageBg: '#0d0c13',
      };
    case 'vice-city':
      return {
        gradient: 'from-[#2b0b29] via-[#1c0c2e] to-[#26160a]',
        glow: 'rgba(232, 121, 249, 0.38)',
        stageBg: '#14091e',
      };
    case 'dune':
      return {
        gradient: 'from-[#26180a] via-[#16110d] to-[#0b0a09]',
        glow: 'rgba(245, 158, 11, 0.32)',
        stageBg: '#120d08',
      };
    default:
      return {
        gradient: 'from-slate-900 to-zinc-950',
        glow: 'rgba(88, 101, 242, 0.28)',
        stageBg: '#0c0d12',
      };
  }
};

const getCategoryLabel = (category: ShopBundle['category']): string => {
  switch (category) {
    case 'naruto':
      return 'Naruto · Shinobi';
    case 'anime':
      return 'Anime';
    case 'horror':
      return 'Night Terrors';
    case 'folklore':
      return 'Dark Folklore';
    case 'fantasia':
      return 'Fantasía';
    case 'lofi':
      return 'Lofi';
    case 'estilo':
      return 'Estilo';
    case 'zzz':
      return 'Zenless Zone Zero';
    case 'marvel':
      return 'Marvel';
    case 'dbd':
      return 'Dead by Daylight';
    case 'bonanza':
      return 'Nameplate Bonanza';
    case 'borderlands':
      return 'Borderlands 4';
    case 'celestial':
      return 'Celestial';
    case 'garden':
      return 'Secret Garden';
    case 'rawr':
      return 'Rawr xD';
    case 'banners':
      return 'Banner';
    default:
      return 'Colección';
  }
};

interface CollectionMeta {
  id: ShopCollectionId;
  title: string;
  subtitle: string;
  backdropUrl: string;
  accentGradient: string;
  titleStyleClass: string;
}

const COLLECTION_META: Record<ShopCollectionId, CollectionMeta> = {
  naruto: {
    id: 'naruto',
    title: 'NARUTO · SHINOBI & DŌJUTSU',
    subtitle: '18 coleccionables oficiales: Sharingan, Mangekyō Eterno, Rinnegan, Kurama, Naruto, Sasuke, Óbito, Madara y Boruto',
    backdropUrl: GENERATED_ASSETS.narutoHeroArt,
    accentGradient: 'from-[#240608]/95 via-[#14080a]/82 to-[#060608]/96',
    titleStyleClass: 'font-sakura font-extrabold tracking-[0.06em] uppercase text-white drop-shadow-[0_2px_16px_rgba(239,68,68,0.55)]',
  },
  'night-terrors': {
    id: 'night-terrors',
    title: 'NIGHT TERRORS',
    subtitle: 'Pesadillas en blanco y negro, ojos abisales y marcos espectrales',
    backdropUrl: GENERATED_ASSETS.shopObserverEyes,
    accentGradient: 'from-zinc-950/95 via-zinc-900/75 to-black/95',
    titleStyleClass: 'font-display font-black italic tracking-tighter uppercase text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]',
  },
  'dark-folklore': {
    id: 'dark-folklore',
    title: 'DARK FOLKLORE',
    subtitle: 'Leyendas del bosque nocturno, flores de luna y criaturas crípticas',
    backdropUrl: GENERATED_ASSETS.shopMoonflowersArt,
    accentGradient: 'from-[#0d1c17]/95 via-[#0a1312]/80 to-[#060908]/95',
    titleStyleClass: 'font-display font-extrabold tracking-[0.14em] uppercase text-emerald-100 drop-shadow-[0_2px_12px_rgba(110,231,183,0.35)]',
  },
  dbd: {
    id: 'dbd',
    title: 'DEAD BY DAYLIGHT',
    subtitle: 'Colección oficial de El Ente, Red de sangre y Luna oscura',
    backdropUrl: GENERATED_ASSETS.dbdBanner,
    accentGradient: 'from-[#280b07]/95 via-[#180a08]/80 to-[#090505]/95',
    titleStyleClass: 'font-display font-black tracking-tight uppercase text-orange-100 drop-shadow-[0_2px_14px_rgba(249,115,22,0.45)]',
  },
  stardust: {
    id: 'stardust',
    title: 'Stardust',
    subtitle: 'Aros de polvo estelar dorado, neón esmeralda y destellos cósmicos',
    backdropUrl: GENERATED_ASSETS.shopCerberoArt,
    accentGradient: 'from-[#231407]/95 via-[#0f1713]/80 to-[#08090d]/95',
    titleStyleClass: 'font-display font-black italic tracking-wide text-amber-200 drop-shadow-[0_2px_12px_rgba(251,191,36,0.45)]',
  },
  'nameplate-bonanza': {
    id: 'nameplate-bonanza',
    title: 'NAMEPLATE BONANZA!',
    subtitle: 'Placas vibrantes animadas para destacar en cualquier servidor',
    backdropUrl: GENERATED_ASSETS.shopBannerBonanza,
    accentGradient: 'from-fuchsia-950/90 via-purple-950/80 to-[#0b0814]/95',
    titleStyleClass: 'font-display font-black italic tracking-tight uppercase text-fuchsia-200 drop-shadow-[0_2px_14px_rgba(217,70,239,0.55)]',
  },
  borderlands: {
    id: 'borderlands',
    title: 'BORDERLANDS 4',
    subtitle: 'Saqueo legendario, portales de la Cámara y Claptrap en acción',
    backdropUrl: GENERATED_ASSETS.shopBannerBorderlands,
    accentGradient: 'from-[#261408]/90 via-[#151125]/80 to-[#08090f]/95',
    titleStyleClass: 'font-display font-black italic tracking-tight uppercase text-yellow-300 drop-shadow-[0_2px_12px_rgba(250,204,21,0.45)]',
  },
  celestial: {
    id: 'celestial',
    title: 'Celestial & Nocturno',
    subtitle: 'Constelaciones violetas, lunas místicas y flores nocturnas',
    backdropUrl: GENERATED_ASSETS.shopCelestialMoonArt,
    accentGradient: 'from-[#161233]/95 via-[#130f26]/80 to-[#070812]/95',
    titleStyleClass: 'font-display font-black tracking-wide text-indigo-100 drop-shadow-[0_2px_12px_rgba(129,140,248,0.45)]',
  },
  'secret-garden': {
    id: 'secret-garden',
    title: 'Secret Garden',
    subtitle: 'Estanques tranquilos, lirios del valle y tréboles de la suerte',
    backdropUrl: GENERATED_ASSETS.shopBannerSecretGarden,
    accentGradient: 'from-[#0d2219]/95 via-[#091815]/80 to-[#060c0a]/95',
    titleStyleClass: 'font-display font-extrabold tracking-tight text-lime-200 drop-shadow-[0_2px_12px_rgba(163,230,53,0.38)]',
  },
  'rawr-xd': {
    id: 'rawr-xd',
    title: 'Rawr xD',
    subtitle: 'Estética scene, neón fucsia, calaveras punk y nostalgia 2008',
    backdropUrl: GENERATED_ASSETS.shopBannerRawrXd,
    accentGradient: 'from-[#2a0b2c]/90 via-[#140e1c]/80 to-[#08120a]/95',
    titleStyleClass: 'font-display font-black italic tracking-tight text-pink-200 drop-shadow-[0_2px_14px_rgba(244,114,182,0.5)]',
  },
  anime: {
    id: 'anime',
    title: 'Anime & Shonen',
    subtitle: 'Jujutsu Kaisen, grabado sumi-e y técnicas malditas',
    backdropUrl: GENERATED_ASSETS.shopGojoArt,
    accentGradient: 'from-[#0a182d]/95 via-[#1c0c18]/80 to-[#07080d]/95',
    titleStyleClass: 'font-display font-black tracking-tight uppercase text-sky-200',
  },
  lofi: {
    id: 'lofi',
    title: 'Vibras lofi',
    subtitle: 'Plantas de invernadero, gatitos cómodos, pato zen y ondas cromáticas',
    backdropUrl: GENERATED_ASSETS.shopLofiPlants,
    accentGradient: 'from-[#0d2116]/95 via-[#131116]/80 to-[#090a0d]/95',
    titleStyleClass: 'font-display font-bold tracking-tight text-emerald-100',
  },
  zzz: {
    id: 'zzz',
    title: 'Zenless Zone Zero',
    subtitle: 'Agentes de New Eridu: Hoshimi Miyabi, Ellen Joe y Burnice White',
    backdropUrl: GENERATED_ASSETS.zzzEllenBanner,
    accentGradient: 'from-[#081d24]/95 via-[#180d14]/80 to-[#08090d]/95',
    titleStyleClass: 'font-display font-black tracking-tight uppercase text-teal-200',
  },
  marvel: {
    id: 'marvel',
    title: 'Marvel Studios',
    subtitle: 'Colección especial Deadpool & Wolverine',
    backdropUrl: GENERATED_ASSETS.deadpoolBanner,
    accentGradient: 'from-[#2b090b]/95 via-[#1b1408]/80 to-[#09090b]/95',
    titleStyleClass: 'font-display font-black italic uppercase text-red-200',
  },
  banners: {
    id: 'banners',
    title: 'Banners de perfil',
    subtitle: 'Fondos panorámicos de alta definición para la cabecera de tu perfil',
    backdropUrl: GENERATED_ASSETS.viceCityBanner,
    accentGradient: 'from-[#1f0a22]/95 via-[#17100b]/80 to-[#08090d]/95',
    titleStyleClass: 'font-display font-black tracking-tight text-white',
  },
};

const ThematicBundleArtwork: React.FC<{
  variant: ShopBundle['artVariant'];
  accentHex?: string;
}> = ({ variant, accentHex }) => {
  const artUrl = getBundleArtUrl(variant);
  const theme = getBundleTheme(variant);
  if (artUrl) {
    return (
      <SafeImage
        src={artUrl}
        alt=""
        fallbackGradient={theme.gradient}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${theme.gradient}`}
      style={accentHex ? { backgroundColor: accentHex } : undefined}
    />
  );
};

/* Museum-Grade Collectible Stage Renderer for Shop Cards (4:3 uniform aspect) */
const CollectibleCardStage: React.FC<{
  bundle: ShopBundle;
  activeSwatch?: string;
}> = ({ bundle, activeSwatch }) => {
  const artUrl = getBundleArtUrl(bundle.artVariant);
  const theme = getBundleTheme(bundle.artVariant);
  const firstDeco = bundle.items.find((i) => i.decorationId)?.decorationId;
  const nameplateItem = bundle.items.find((i) => i.nameplateId);
  const frameItem = bundle.items.find((i) => i.profileFrameId);
  const effectItem = bundle.items.find((i) => i.profileEffectId);
  const glowColor = activeSwatch ? `${activeSwatch}66` : theme.glow;

  /* 1. Standalone Profile Banner Stage */
  if (bundle.category === 'banners' && artUrl) {
    return (
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#08090d]">
        <img
          src={artUrl}
          alt={bundle.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c11] via-black/20 to-black/15" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-full bg-[#0c0d12] p-0.5 border border-white/25 shrink-0 relative">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#5865F2] to-[#3b47c9] flex items-center justify-center">
              <DiscordLogo className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#0c0d12]" />
          </div>
          <div className="min-w-0">
            <div className="h-2 w-18 rounded-full bg-white/85" />
            <div className="h-1.5 w-11 rounded-full bg-white/45 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  /* 2. Signature Full-Scene Pond Stage for Avatar Deco "el mismo pato" */
  if (bundle.id === 'bundle-pato') {
    return (
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#0c4a6e]">
        <SafeImage
          src={GENERATED_ASSETS.shopPatoArt}
          alt={bundle.title}
          fallbackGradient={theme.gradient}
          className="absolute inset-0 w-full h-full object-cover object-right transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(14,116,144,0.85) 0%, rgba(56,189,248,0.28) 45%, transparent 75%)',
          }}
        />
        <div className="absolute left-4 bottom-4 z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <div className="w-[68px] h-[68px] rounded-full bg-sky-900/60 border border-white/45 flex items-center justify-center shadow-xl">
            <DiscordLogo className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    );
  }

  /* 3. Standalone Profile Frame ("Marco de perfil") Stage */
  if (bundle.items.length === 1 && frameItem?.profileFrameId) {
    return (
      <div
        className={`relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br ${theme.gradient} flex items-end justify-center px-4 pt-6 pb-3`}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-85"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${glowColor} 0%, rgba(10,11,16,0.75) 58%, rgba(6,7,10,0.97) 100%)`,
          }}
        />
        <div className="relative w-[76%] h-[82%] rounded-xl bg-gradient-to-b from-[#1a1c25] to-[#111218] border border-white/15 shadow-2xl transition-transform duration-300 group-hover:scale-[1.03]">
          <div className="h-[40%] w-full rounded-t-xl bg-gradient-to-r from-[#272a36] to-[#1f222d] border-b border-white/10" />
          <div className="px-2.5 -mt-4 relative z-10 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#363945] border-2 border-[#16171e] flex items-center justify-center relative">
              <DiscordLogo className="w-4 h-4 text-zinc-200" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#16171e]" />
            </div>
          </div>
          <div className="px-2.5 pt-1.5 space-y-1.5">
            <div className="h-2 w-14 rounded-full bg-white/25" />
            <div className="h-1.5 w-20 rounded-full bg-white/12" />
          </div>
          <ProfileFrameArtwork frame={frameItem.profileFrameId} accentColor={activeSwatch} />
        </div>
      </div>
    );
  }

  /* 4. Authentic Member-List Nameplate Stage */
  if (bundle.items.length === 1 && nameplateItem?.nameplateId) {
    const plateId: NameplateId = nameplateItem.nameplateId;
    const isLightPlate = plateId === 'rama';
    return (
      <div
        className="relative w-full aspect-[4/3] overflow-hidden p-3.5 flex flex-col justify-center gap-2.5 bg-[#0e0f15]"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-70"
          style={{
            background: `radial-gradient(circle at 60% 50%, ${glowColor}, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex items-center gap-2 opacity-30 px-2">
          <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0" />
          <span className="h-2 w-16 rounded-full bg-white/30" />
        </div>

        <div className="relative z-10 h-13.5 rounded-xl overflow-hidden border border-white/20 shadow-xl flex items-center justify-between px-2.5 bg-[#171822] anim-shimmer group-hover:scale-[1.02] transition-transform duration-300">
          <NameplateStripBackground nameplate={plateId} accentColor={activeSwatch} />
          <div className="relative z-10 flex items-center gap-2 min-w-0">
            <span className="w-6.5 h-6.5 rounded-full bg-black/55 border border-white/40 flex items-center justify-center shrink-0 relative">
              <DiscordLogo className="w-3.5 h-3.5 text-white/95" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#23a55a] border border-black" />
            </span>
            <span
              className={`h-2 w-14 rounded-full ${
                isLightPlate ? 'bg-zinc-900/60' : 'bg-white/65'
              }`}
            />
          </div>
          <NameplateRowDecor nameplate={plateId} />
        </div>

        <div className="relative z-10 flex items-center gap-2 opacity-30 px-2">
          <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0" />
          <span className="h-2 w-12 rounded-full bg-white/25" />
        </div>
      </div>
    );
  }

  /* 5. Centered Studio Avatar Decoration Pedestal Stage */
  if (bundle.items.length === 1 && firstDeco) {
    return (
      <div
        className={`relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 46%, ${glowColor} 0%, rgba(10,11,16,0.72) 56%, rgba(5,5,8,0.98) 100%)`,
          }}
        />
        <div className="absolute w-32 h-32 rounded-full border border-white/[0.06] pointer-events-none transition-transform duration-500 group-hover:scale-110" />
        <div
          className="absolute w-32 h-32 rounded-full blur-2xl opacity-45 transition-all duration-300 group-hover:opacity-70 pointer-events-none"
          style={{ backgroundColor: activeSwatch || theme.glow }}
        />

        <div className="relative z-10 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-108">
          <div
            className="w-[72px] h-[72px] rounded-full border border-white/20 flex items-center justify-center shadow-[0_14px_34px_rgba(0,0,0,0.9)] overflow-hidden relative"
            style={{
              backgroundColor: activeSwatch ? `${activeSwatch}22` : '#1f212b',
            }}
          >
            <DiscordLogo className="w-8.5 h-8.5 text-white/75 relative z-10" />
          </div>
          <AvatarDecorationRing decoration={firstDeco} accentColor={activeSwatch} />
        </div>
      </div>
    );
  }

  /* 6. Single Profile Effect Showcase Stage */
  if (bundle.items.length === 1 && effectItem) {
    const isCrimsonMoon =
      effectItem.profileEffectId === 'cuervos-luna' && activeSwatch === '#ef4444';
    const isGreenMoonflowers =
      effectItem.profileEffectId === 'flores-luna' && activeSwatch === '#4ade80';

    return (
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#0a0a0e]">
        <div
          className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105"
          style={{
            filter: isCrimsonMoon
              ? 'hue-rotate(105deg) saturate(1.5)'
              : isGreenMoonflowers
              ? 'hue-rotate(30deg) saturate(1.3)'
              : undefined,
          }}
        >
          <ThematicBundleArtwork variant={bundle.artVariant} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-black/25 to-black/15" />
        <div className="absolute inset-x-3 bottom-3 top-7 rounded-xl border border-white/15 bg-black/30 backdrop-blur-[1.5px] pointer-events-none flex flex-col justify-end p-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1e1f27]/90 border border-white/30 flex items-center justify-center mb-1.5 relative">
            <DiscordLogo className="w-4 h-4 text-white/75" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-[#1e1f27]" />
          </div>
          <div className="h-1.5 w-16 rounded-full bg-white/35" />
          <div className="h-1 w-22 rounded-full bg-white/18 mt-1" />
        </div>
      </div>
    );
  }

  /* 7. Multi-Item Collector Bundle Collage (Tilted Profile Card + Nameplate Strip + Floating Hero Deco) */
  return (
    <div
      className={`relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br ${theme.gradient}`}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 26% 32%, ${glowColor} 0%, transparent 58%), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
        }}
      />

      {/* Right Tilted Profile Card with Artwork & Frame */}
      <div className="absolute right-2.5 top-3 bottom-2.5 w-[57%] rounded-xl border border-white/20 shadow-[0_16px_32px_-6px_rgba(0,0,0,0.92)] transform rotate-2 group-hover:rotate-0 transition-transform duration-300 ease-out bg-[#121319]">
        <div className="w-full h-full rounded-xl overflow-hidden relative">
          <ThematicBundleArtwork variant={bundle.artVariant} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/15" />
          <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-[#1d1e27]/90 border border-white/30 flex items-center justify-center">
            <DiscordLogo className="w-3.5 h-3.5 text-white/85" />
          </div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-white/80" />
            <div className="h-1 w-18 rounded-full bg-white/40" />
          </div>
        </div>
        {frameItem?.profileFrameId && (
          <ProfileFrameArtwork frame={frameItem.profileFrameId} accentColor={activeSwatch} />
        )}
      </div>

      {/* Slanted Bottom-Left Nameplate Strip */}
      {nameplateItem ? (
        <div className="absolute left-2 bottom-3 w-[62%] h-7.5 rounded-lg bg-[#14151c] border border-white/25 shadow-[0_10px_22px_rgba(0,0,0,0.82)] transform -rotate-4 group-hover:-rotate-2 transition-transform duration-300 flex items-center justify-between px-2 z-10 overflow-hidden">
          <NameplateStripBackground nameplate={nameplateItem.nameplateId || 'none'} accentColor={activeSwatch} />
          <span className="relative z-10 w-4.5 h-4.5 rounded-full bg-black/55 border border-white/40 flex items-center justify-center shrink-0">
            <DiscordLogo className="w-2.5 h-2.5 text-white/90" />
          </span>
          <NameplateRowDecor nameplate={nameplateItem.nameplateId || 'none'} />
        </div>
      ) : (
        <div className="absolute left-2.5 bottom-3 w-[52%] h-7 rounded-lg bg-[#14151c]/95 border border-white/20 shadow-lg transform -rotate-3 group-hover:-rotate-1 transition-transform duration-300 flex items-center gap-2 px-2 z-10">
          <span className="w-4 h-4 rounded-full overflow-hidden border border-white/30 shrink-0">
            <AvatarArtwork avatar="madara" />
          </span>
          <span className="h-1.5 w-14 rounded-full bg-white/45" />
        </div>
      )}

      {/* Floating Top-Left Hero Avatar Decoration */}
      {firstDeco && (
        <div className="absolute top-3.5 left-3.5 z-20 w-14 h-14 flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110">
          <div className="w-11 h-11 rounded-full bg-[#1e2029] border border-white/25 flex items-center justify-center shadow-[0_12px_26px_rgba(0,0,0,0.92)]">
            <DiscordLogo className="w-5 h-5 text-white/90" />
          </div>
          <AvatarDecorationRing decoration={firstDeco} accentColor={activeSwatch} />
        </div>
      )}
    </div>
  );
};

const ProfileFrameShowcase: React.FC<{
  frameId: ProfileFrameId;
  bundle: ShopBundle;
  user: UserProfile;
  accentColor?: string;
}> = ({ frameId, bundle, user, accentColor }) => {
  const theme = getBundleTheme(bundle.artVariant);
  return (
    <div className="my-4 mx-auto w-[304px] rounded-2xl border border-white/20 bg-gradient-to-b from-[#13151d] to-[#0b0c11] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.9)] relative">
      <div
        className="absolute -inset-3 rounded-3xl blur-2xl opacity-35 pointer-events-none"
        style={{ backgroundColor: accentColor || theme.glow }}
      />
      <div className="h-24 w-full rounded-t-2xl overflow-hidden relative z-10" style={{ backgroundColor: user.bannerColor }}>
        {user.bannerImage ? (
          <img
            src={user.bannerImage}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#232530] via-[#161820] to-[#0e0f14]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="px-4 pb-5 -mt-10 relative z-10">
        <div className="inline-block p-1 rounded-full bg-[#0e0f14] shadow-lg">
          <UserAvatar
            avatar={user.avatar}
            customAvatarUrl={user.customAvatarUrl}
            decoration={bundle.items.find((i) => i.decorationId)?.decorationId || user.decoration}
            size="lg"
            showStatus={false}
          />
        </div>
        <p className="font-display font-extrabold text-lg text-white mt-1">
          {user.displayName}
        </p>
        <p className="text-xs text-zinc-400">{user.username}</p>
        <p className="text-[11px] text-[#959eff] font-semibold mt-2.5">
          Marco de perfil exclusivo · Sobresale de la tarjeta
        </p>
      </div>

      <ProfileFrameArtwork frame={frameId} accentColor={accentColor} />
    </div>
  );
};

const ProfileEffectShowcase: React.FC<{
  bundle: ShopBundle;
  user: UserProfile;
  playKey: number;
  showFullBundle?: boolean;
}> = ({ bundle, user, playKey, showFullBundle = false }) => {
  const effectId = bundle.items.find((i) => i.profileEffectId)?.profileEffectId;
  const decoId = bundle.items.find((i) => i.decorationId)?.decorationId || (showFullBundle ? user.decoration : 'none');
  const nameplateId = bundle.items.find((i) => i.nameplateId)?.nameplateId || 'none';
  const frameId = showFullBundle ? bundle.items.find((i) => i.profileFrameId)?.profileFrameId : undefined;
  const theme = getBundleTheme(bundle.artVariant);

  return (
    <div className="my-3 mx-auto w-[304px] rounded-2xl border border-white/20 bg-gradient-to-b from-[#13151d] to-[#0b0c11] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.9)] relative">
      <div
        className="absolute -inset-3 rounded-3xl blur-2xl opacity-35 pointer-events-none"
        style={{ backgroundColor: theme.glow }}
      />
      <div className="overflow-hidden rounded-2xl relative z-10">
        <div className="h-24 w-full relative overflow-hidden" style={{ backgroundColor: user.bannerColor }}>
          {user.bannerImage && (
            <img
              src={user.bannerImage}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-4 pb-5 -mt-10 relative z-10">
          <div className="inline-block p-1 rounded-full bg-[#0e0f14] shadow-lg">
            <UserAvatar
              avatar={user.avatar}
              customAvatarUrl={user.customAvatarUrl}
              decoration={decoId}
              size="lg"
              showStatus={false}
            />
          </div>
          <p className="font-display font-extrabold text-lg text-white mt-1">
            {user.displayName}
          </p>
          <p className="text-xs text-zinc-400">{user.username}</p>

          {nameplateId !== 'none' && (
            <div className="mt-2.5 h-9 rounded-xl overflow-hidden border border-white/20 relative flex items-center px-2.5 bg-[#15161e] shadow-md">
              <NameplateStripBackground nameplate={nameplateId} />
              <span className="relative z-10 text-xs font-display font-bold text-white drop-shadow">
                {user.displayName}
              </span>
            </div>
          )}

          <p className="text-[11px] text-zinc-400 mt-3 tabular-nums">
            Miembro desde · {user.memberSince}
          </p>
        </div>

        <ProfileEffectAnimationOverlay effect={effectId} playKey={playKey} />
      </div>
      {frameId && <ProfileFrameArtwork frame={frameId} />}
    </div>
  );
};

const BannerProfilePreview: React.FC<{
  bannerUrl: string;
  bundle: ShopBundle;
  user: UserProfile;
  showFullBundle?: boolean;
}> = ({ bannerUrl, bundle, user, showFullBundle = false }) => {
  const deco = showFullBundle
    ? bundle.items.find((i) => i.decorationId)?.decorationId || user.decoration
    : user.decoration;
  const effectId = showFullBundle
    ? bundle.items.find((i) => i.profileEffectId)?.profileEffectId
    : undefined;
  const frameId = showFullBundle
    ? bundle.items.find((i) => i.profileFrameId)?.profileFrameId
    : undefined;
  const theme = getBundleTheme(bundle.artVariant);

  return (
    <div className="my-3 mx-auto w-[304px] rounded-2xl border border-white/20 bg-gradient-to-b from-[#13151d] to-[#0b0c11] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.9)] relative">
      <div
        className="absolute -inset-3 rounded-3xl blur-2xl opacity-35 pointer-events-none"
        style={{ backgroundColor: theme.glow }}
      />
      <div className="overflow-hidden rounded-2xl relative z-10">
        <div className="h-28 w-full relative overflow-hidden anim-shimmer">
          <img
            src={bannerUrl}
            alt={bundle.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        </div>
        <div className="px-4 pb-4 -mt-10 relative z-10">
          <div className="inline-block p-1 rounded-full bg-[#0e0f14] shadow-lg">
            <UserAvatar
              avatar={user.avatar}
              customAvatarUrl={user.customAvatarUrl}
              decoration={deco}
              size="lg"
              showStatus={false}
            />
          </div>
          <p className="font-display font-extrabold text-lg text-white mt-1">
            {user.displayName}
          </p>
          <p className="text-xs text-zinc-400">{user.username}</p>
          <p className="text-[11px] text-[#959eff] font-semibold mt-2">
            {showFullBundle
              ? 'Vista previa completa del lote equipado'
              : 'Así lucirá este banner en tu perfil'}
          </p>
        </div>
        {effectId && <ProfileEffectAnimationOverlay effect={effectId} playKey={bundle.id} />}
      </div>
      {frameId && <ProfileFrameArtwork frame={frameId} />}
    </div>
  );
};

/* Clean Luxury Collector Card — Zero Pill Noise, Focused 4:3 Visual Stage + Editorial Footer */
const BundleCard: React.FC<{
  bundle: ShopBundle;
  wishlisted: boolean;
  owned: boolean;
  onSelect: (activeSwatch?: string) => void;
  onToggleWishlist: (e: React.MouseEvent) => void;
}> = ({ bundle, wishlisted, owned, onSelect, onToggleWishlist }) => {
  const [selectedSwatch, setSelectedSwatch] = useState<string | undefined>(
    bundle.colorSwatches?.[0]
  );

  const singleKindLabel =
    bundle.items.length === 1
      ? bundle.items[0]?.kind === 'Decoración de avatar'
        ? 'Decoración'
        : bundle.items[0]?.kind === 'Placa de identificación'
        ? 'Placa'
        : bundle.items[0]?.kind === 'Efecto de perfil'
        ? 'Efecto'
        : bundle.items[0]?.kind === 'Marco de perfil'
        ? 'Marco de perfil'
        : 'Banner'
      : `${bundle.items.length} piezas · ${getCategoryLabel(bundle.category)}`;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      onClick={() => onSelect(selectedSwatch)}
      className="group rounded-2xl bg-[#0c0d12] border border-white/[0.08] hover:border-white/[0.24] overflow-hidden relative cursor-pointer transition-all shadow-[0_12px_30px_-14px_rgba(0,0,0,0.85)] hover:shadow-[0_18px_38px_-12px_rgba(0,0,0,0.95)] flex flex-col"
    >
      <button
        type="button"
        onClick={onToggleWishlist}
        aria-label="Añadir a lista de deseos"
        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 backdrop-blur-xs flex items-center justify-center z-20 cursor-pointer transition-transform active:scale-90"
      >
        <Heart
          className={`w-4 h-4 transition-transform ${
            wishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-white/85'
          }`}
        />
      </button>

      <CollectibleCardStage bundle={bundle} activeSwatch={selectedSwatch} />

      <div className="px-3.5 py-3 flex-1 flex flex-col justify-between gap-2.5 bg-[#0c0d12] border-t border-white/[0.06]">
        <div>
          <p className="text-[11px] font-medium text-zinc-400 truncate">
            {singleKindLabel}
          </p>
          <h3 className="font-display font-bold text-[14px] sm:text-[15px] text-white truncate leading-snug mt-0.5">
            {bundle.shortTitle || bundle.title}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          {owned ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-400 tabular-nums">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>En propiedad</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white tabular-nums">
              <OrbsCrystalIcon className="w-3.5 h-3.5 text-[#818cf8] shrink-0" />
              <span>{bundle.priceOrbs.toLocaleString('es-ES')}</span>
            </span>
          )}

          {bundle.colorSwatches && bundle.colorSwatches.length > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 shrink-0"
            >
              {bundle.colorSwatches.slice(0, 4).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setSelectedSwatch(hex)}
                  aria-label={`Color ${hex}`}
                  style={{ backgroundColor: hex }}
                  className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${
                    selectedSwatch === hex
                      ? 'border-white scale-120 shadow'
                      : 'border-black/70 opacity-75 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
              {bundle.priceUsd}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* Clickable Collection Banner Card */
const CollectionPromoBanner: React.FC<{
  title: string;
  subtitle?: string;
  metaText?: string;
  imageUrl: string;
  titleClass?: string;
  gradientClass?: string;
  onClick: () => void;
}> = ({
  title,
  subtitle,
  metaText,
  imageUrl,
  titleClass = 'font-display font-black text-2xl text-white',
  gradientClass = 'from-black/90 via-black/50 to-black/15',
  onClick,
}) => (
  <motion.button
    type="button"
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="w-full h-28 sm:h-32 rounded-2xl overflow-hidden relative text-left border border-white/12 hover:border-white/25 px-5 py-4 flex items-center justify-between gap-4 cursor-pointer group shadow-[0_14px_34px_-12px_rgba(0,0,0,0.85)] anim-shimmer transition-colors"
  >
    <img
      src={imageUrl}
      alt={title}
      referrerPolicy="no-referrer"
      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
    />
    <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass}`} />

    <div className="relative z-10 min-w-0">
      {metaText && (
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-300/90 mb-1">
          {metaText}
        </span>
      )}
      <div className={`${titleClass} truncate leading-tight`}>{title}</div>
      {subtitle && (
        <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1">{subtitle}</p>
      )}
    </div>

    <div className="relative z-10 w-10 h-10 rounded-full bg-black/60 group-hover:bg-black/85 border border-white/25 backdrop-blur-xs flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5">
      <ChevronRight className="w-5 h-5 text-white" />
    </div>
  </motion.button>
);

const CATEGORIES = [
  { id: 'all', label: 'Todo' },
  { id: 'naruto', label: 'Naruto (18)' },
  { id: 'horror', label: 'Night Terrors' },
  { id: 'folklore', label: 'Dark Folklore' },
  { id: 'dbd', label: 'Dead by Daylight' },
  { id: 'bonanza', label: 'Nameplate Bonanza' },
  { id: 'borderlands', label: 'Borderlands 4' },
  { id: 'celestial', label: 'Celestial' },
  { id: 'garden', label: 'Secret Garden' },
  { id: 'rawr', label: 'Rawr xD' },
  { id: 'lofi', label: 'Vibras lofi' },
  { id: 'anime', label: 'Anime y Shonen' },
  { id: 'zzz', label: 'Zenless Zone Zero' },
  { id: 'marvel', label: 'Marvel' },
  { id: 'banners', label: 'Banners' },
];

export const ShopView: React.FC<ShopViewProps> = ({
  user,
  bundles,
  dms,
  wishlistIds,
  ownedBundleIds,
  selectedBundle,
  onSelectBundle,
  onToggleWishlist,
  onBuyBundle,
  onEquipBundle,
  onGiftBundle,
  onBack,
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [modalSwatch, setModalSwatch] = useState<string | undefined>(undefined);
  const [filterWishlistOnly, setFilterWishlistOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeCollection, setActiveCollection] = useState<ShopCollectionId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [giftSentToast, setGiftSentToast] = useState<string | null>(null);
  const [justBoughtId, setJustBoughtId] = useState<string | null>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [previewKey, setPreviewKey] = useState(1);
  const [fullPreviewMode, setFullPreviewMode] = useState(false);
  const boughtTimerRef = useRef<number | null>(null);
  const giftTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (boughtTimerRef.current !== null) window.clearTimeout(boughtTimerRef.current);
      if (giftTimerRef.current !== null) window.clearTimeout(giftTimerRef.current);
    };
  }, []);

  const openBundleModal = (bundle: ShopBundle, swatch?: string) => {
    setSelectedItemIndex(0);
    setModalSwatch(swatch ?? bundle.colorSwatches?.[0]);
    setFullPreviewMode(false);
    setPreviewKey((k) => k + 1);
    onSelectBundle(bundle);
  };

  const openCollectionPage = (collectionId: ShopCollectionId) => {
    setActiveCollection(collectionId);
    setFilterWishlistOnly(false);
  };

  const visibleBundles = bundles.filter((b) => {
    if (filterWishlistOnly && !wishlistIds.includes(b.id)) return false;
    if (activeCategory !== 'all' && b.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !b.title.toLowerCase().includes(q) &&
        !b.shortTitle.toLowerCase().includes(q) &&
        !getCategoryLabel(b.category).toLowerCase().includes(q) &&
        !b.items.some((i) => i.name.toLowerCase().includes(q))
      ) {
        return false;
      }
    }
    return true;
  });

  // Collection Groups for Structured Storefront
  const narutoBundles = bundles.filter((b) => b.collectionId === 'naruto');
  const nightTerrorsBundles = bundles.filter((b) => b.collectionId === 'night-terrors');
  const darkFolkloreBundles = bundles.filter((b) => b.collectionId === 'dark-folklore');
  const dbdBundles = bundles.filter((b) => b.collectionId === 'dbd');
  const stardustBundles = bundles.filter((b) => b.collectionId === 'stardust');
  const bonanzaBundles = bundles.filter((b) => b.collectionId === 'nameplate-bonanza');
  const borderlandsBundles = bundles.filter((b) => b.collectionId === 'borderlands');
  const celestialBundles = bundles.filter((b) => b.collectionId === 'celestial');
  const gardenBundles = bundles.filter((b) => b.collectionId === 'secret-garden');
  const rawrBundles = bundles.filter((b) => b.collectionId === 'rawr-xd');
  const lofiBundles = bundles.filter((b) => b.category === 'lofi');
  const zzzBundles = bundles.filter((b) => b.category === 'zzz');
  const animeFantasyBundles = bundles.filter(
    (b) =>
      b.category === 'anime' ||
      b.category === 'fantasia' ||
      b.id === 'bundle-grabado' ||
      b.id === 'bundle-vader' ||
      b.id === 'bundle-condenacion'
  );
  const bannerBundles = bundles.filter((b) => b.category === 'banners');
  const deadpoolBundle = bundles.find((b) => b.id === 'bundle-deadpool');

  const activeCollectionMeta = activeCollection ? COLLECTION_META[activeCollection] : null;
  const collectionItems = activeCollection
    ? bundles.filter((b) => b.collectionId === activeCollection)
    : [];

  // Group collection items neatly by section inside Collection Sub-Pages
  const colMultiBundles = collectionItems.filter((b) => b.items.length > 1);
  const colDecos = collectionItems.filter(
    (b) => b.items.length === 1 && b.items[0]?.kind === 'Decoración de avatar'
  );
  const colPlates = collectionItems.filter(
    (b) => b.items.length === 1 && b.items[0]?.kind === 'Placa de identificación'
  );
  const colEffects = collectionItems.filter(
    (b) => b.items.length === 1 && b.items[0]?.kind === 'Efecto de perfil'
  );
  const colFrames = collectionItems.filter(
    (b) => b.items.length === 1 && b.items[0]?.kind === 'Marco de perfil'
  );
  const colBanners = collectionItems.filter(
    (b) => b.items.length === 1 && b.items[0]?.kind === 'Banner de perfil'
  );

  const activeModalItem = selectedBundle
    ? selectedBundle.items[selectedItemIndex] || selectedBundle.items[0]
    : null;
  const isSelectedOwned = selectedBundle ? ownedBundleIds.includes(selectedBundle.id) : false;
  const isSelectedWishlisted = selectedBundle ? wishlistIds.includes(selectedBundle.id) : false;
  const modalTheme = selectedBundle ? getBundleTheme(selectedBundle.artVariant) : null;
  const modalBannerUrl = selectedBundle
    ? selectedBundle.items.find((i) => i.bannerUrl)?.bannerUrl ||
      getBundleArtUrl(selectedBundle.artVariant)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07070a] text-[var(--dc-text-primary)] relative overflow-hidden">
      {/* Dedicated Collection Sub-Page */}
      {activeCollection && activeCollectionMeta ? (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          <img
            src={activeCollectionMeta.backdropUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35 pointer-events-none"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-b ${activeCollectionMeta.accentGradient} pointer-events-none`}
          />

          <header className="relative z-20 h-14 px-3 md:px-6 flex items-center justify-between gap-2 bg-black/50 backdrop-blur-md border-b border-white/10 shrink-0">
            <button
              onClick={() => setActiveCollection(null)}
              aria-label="Volver a tienda"
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className={`${activeCollectionMeta.titleStyleClass} text-base sm:text-xl truncate text-center px-2`}>
              {activeCollectionMeta.title}
            </h1>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/55 border border-white/15 text-white text-xs font-bold tabular-nums shrink-0">
              <OrbsCrystalIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.orbs.toLocaleString('es-ES')}</span>
            </div>
          </header>

          <div className="relative z-10 flex-1 overflow-y-auto pb-16">
            <div className="max-w-5xl mx-auto px-4 pt-5 space-y-6">
              <p className="text-center text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
                {activeCollectionMeta.subtitle}
              </p>

              {[
                { label: 'Lotes y coleccionables', items: colMultiBundles },
                { label: 'Decoraciones de avatar', items: colDecos },
                { label: 'Placas de identificación', items: colPlates },
                { label: 'Efectos de perfil', items: colEffects },
                { label: 'Marcos de perfil', items: colFrames },
                { label: 'Banners de perfil', items: colBanners },
              ]
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <section key={group.label} className="space-y-3">
                    <div className="flex items-center justify-between px-0.5">
                      <h2 className="font-display font-bold text-xs uppercase tracking-[0.12em] text-zinc-300 tabular-nums">
                        {group.label} ({group.items.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {group.items.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Luxury Editorial Header */}
          <header className="h-14 px-3 md:px-6 flex items-center justify-between gap-2 bg-[#0a0a0e]/95 backdrop-blur-md border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                aria-label="Cerrar tienda"
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <Store className="w-5 h-5 text-white ml-0.5" />
              <h1 className="font-display font-bold text-[19px] text-white tracking-tight">Tienda</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#13141b] border border-white/12 text-white text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap">
                <OrbsCrystalIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{user.orbs.toLocaleString('es-ES')}</span>
              </div>

              <button
                onClick={() => setFilterWishlistOnly((w) => !w)}
                aria-label="Lista de deseos"
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  filterWishlistOnly ? 'dc-btn-danger' : 'hover:bg-white/10 text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${filterWishlistOnly ? 'fill-white text-white' : ''}`} />
              </button>

              <button
                onClick={() => setShowMenuSheet(true)}
                aria-label="Buscar y explorar categorías"
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowMenuSheet(true)}
                aria-label="Categorías de tienda"
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Horizontal Category Filter Bar */}
          <div className="px-3 md:px-6 py-2.5 border-b border-white/[0.06] bg-[#09090d] shrink-0">
            <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat.id && !filterWishlistOnly;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setFilterWishlistOnly(false);
                    }}
                    className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                      active
                        ? cat.id === 'naruto'
                          ? 'bg-red-600 text-white shadow-[0_4px_16px_-4px_rgba(220,38,38,0.65)]'
                          : 'bg-[#5865F2] text-white shadow'
                        : 'bg-[#14151c] hover:bg-[#1c1e27] text-zinc-300 border border-white/[0.07]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Storefront Scroll */}
          <div className="flex-1 overflow-y-auto pb-16">
            <div className="max-w-5xl mx-auto">
              {filterWishlistOnly || activeCategory !== 'all' || searchQuery.trim() ? (
                <div className="px-4 pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-bold text-lg text-white tabular-nums">
                      {filterWishlistOnly
                        ? `Tu lista de deseos (${visibleBundles.length})`
                        : `${
                            CATEGORIES.find((c) => c.id === activeCategory)?.label || 'Resultados'
                          } (${visibleBundles.length})`}
                    </h2>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#7b85ff] font-semibold cursor-pointer"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>

                  {visibleBundles.length === 0 ? (
                    <div className="text-center py-16 px-4 rounded-2xl bg-[#0d0e13] border border-white/10">
                      <Heart className="w-10 h-10 text-zinc-500 mx-auto mb-2" />
                      <p className="text-white font-semibold">No se encontraron artículos</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {visibleBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4 pt-5 space-y-9">
                  {/* FEATURED DROP: NARUTO · SHINOBI & DŌJUTSU (18 ITEMS) */}
                  <section className="space-y-4">
                    <div className="relative rounded-3xl overflow-hidden border border-red-500/25 bg-[#0c080a] shadow-[0_24px_60px_-16px_rgba(220,38,38,0.3)]">
                      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                        <div className="md:col-span-7 relative min-h-[210px] sm:min-h-[260px] overflow-hidden">
                          <img
                            src={GENERATED_ASSETS.narutoHeroArt}
                            alt="Colección Naruto Shinobi y Dōjutsu"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover object-center"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-[#0c080a]/25 to-[#0c080a]" />
                        </div>

                        <div className="md:col-span-5 p-6 sm:p-7 flex flex-col justify-center gap-3 relative z-10 bg-gradient-to-b md:bg-gradient-to-l from-[#0c080a] via-[#0c080a] to-[#0c080a]/90">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-400">
                            <Flame className="w-3.5 h-3.5" />
                            <span>Colección Estelar · {narutoBundles.length} Artículos</span>
                          </div>
                          <h2 className="font-sakura font-extrabold text-2xl sm:text-[28px] text-white leading-tight">
                            Naruto · Shinobi &amp; Dōjutsu
                          </h2>
                          <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed">
                            Naruto Sabio y Modo Barión, Kurama, Sasuke, Óbito, Madara Susanoo, Boruto Karma, Rinnegan, Rinne-Sharingan y cada Mangekyō Sharingan.
                          </p>
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => openCollectionPage('naruto')}
                              className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-500 text-white font-display font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer transition-all shadow-[0_8px_24px_-6px_rgba(220,38,38,0.65)]"
                            >
                              <span>Ver los 18 coleccionables</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-0.5">
                      <h3 className="font-display font-bold text-base sm:text-lg text-white">
                        Destacados de Naruto &amp; Sharingan
                      </h3>
                      <button
                        type="button"
                        onClick={() => openCollectionPage('naruto')}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver todos ({narutoBundles.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {narutoBundles.slice(0, 8).map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 1. NIGHT TERRORS SECTION */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="NIGHT TERRORS"
                      subtitle="Lotes, placas, efectos y marcos de perfil abisales"
                      metaText={`${nightTerrorsBundles.length} artículos`}
                      imageUrl={GENERATED_ASSETS.shopObserverEyes}
                      titleClass="font-display font-black italic text-2xl tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]"
                      gradientClass="from-black/90 via-black/55 to-transparent"
                      onClick={() => openCollectionPage('night-terrors')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {nightTerrorsBundles.slice(0, 4).map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 2. DARK FOLKLORE SECTION */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="DARK FOLKLORE"
                      subtitle="Hombre polilla, Jackalope, Diablo de Jersey y La Llorona"
                      metaText={`${darkFolkloreBundles.length} artículos · Incluye Marcos`}
                      imageUrl={GENERATED_ASSETS.shopMoonflowersArt}
                      titleClass="font-display font-extrabold text-xl sm:text-2xl tracking-[0.14em] text-emerald-100"
                      gradientClass="from-[#0a140f]/95 via-[#0b1511]/60 to-transparent"
                      onClick={() => openCollectionPage('dark-folklore')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {darkFolkloreBundles.slice(0, 4).map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 3. DEAD BY DAYLIGHT SECTION */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="DEAD BY DAYLIGHT"
                      subtitle="El Ente, Luna oscura, Red de sangre y Calabazas del Vacío"
                      metaText={`Behaviour Interactive · ${dbdBundles.length} artículos`}
                      imageUrl={GENERATED_ASSETS.dbdBanner}
                      titleClass="font-display font-black text-xl sm:text-2xl tracking-tight text-orange-100"
                      gradientClass="from-[#230905]/95 via-[#180a07]/55 to-transparent"
                      onClick={() => openCollectionPage('dbd')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {dbdBundles.slice(0, 4).map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 4. STARDUST SECTION */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="Stardust"
                      subtitle="Aros cósmicos brillantes en oro solar y esmeralda"
                      imageUrl={GENERATED_ASSETS.shopCerberoArt}
                      titleClass="font-display font-black italic text-2xl text-amber-200"
                      gradientClass="from-[#241506]/90 via-[#0e1b13]/60 to-transparent"
                      onClick={() => openCollectionPage('stardust')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {stardustBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 5. NAMEPLATE BONANZA! */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="NAMEPLATE BONANZA!"
                      subtitle="Conejito fresero, El mismo pato y Marea de lluvia"
                      imageUrl={GENERATED_ASSETS.shopBannerBonanza}
                      titleClass="font-display font-black italic text-xl sm:text-2xl text-white drop-shadow-[0_2px_10px_rgba(217,70,239,0.8)]"
                      gradientClass="from-fuchsia-950/70 via-purple-950/35 to-transparent"
                      onClick={() => openCollectionPage('nameplate-bonanza')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {bonanzaBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 6. BORDERLANDS 4 */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="BORDERLANDS 4"
                      subtitle="Más allá de la Cámara, Saqueo arcoíris y Claptrap"
                      imageUrl={GENERATED_ASSETS.shopBannerBorderlands}
                      titleClass="font-display font-black italic text-xl sm:text-2xl text-yellow-300"
                      gradientClass="from-[#1e1007]/85 via-[#130f24]/45 to-transparent"
                      onClick={() => openCollectionPage('borderlands')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {borderlandsBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 7. CELESTIAL */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="Celestial"
                      subtitle="Luna mística, Estrella nocturna y Flores lunares"
                      imageUrl={GENERATED_ASSETS.shopCelestialMoonArt}
                      titleClass="font-display font-black text-2xl text-indigo-100"
                      gradientClass="from-[#12102c]/90 via-[#150e2b]/50 to-transparent"
                      onClick={() => openCollectionPage('celestial')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {celestialBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 8. SECRET GARDEN */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="Secret Garden"
                      subtitle="Trébol de la suerte, Jardín secreto y Lirio del valle"
                      imageUrl={GENERATED_ASSETS.shopBannerSecretGarden}
                      titleClass="font-display font-extrabold text-2xl text-lime-200"
                      gradientClass="from-[#0a1d15]/85 via-[#0b1814]/45 to-transparent"
                      onClick={() => openCollectionPage('secret-garden')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {gardenBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 9. RAWR XD */}
                  <section className="space-y-3.5">
                    <CollectionPromoBanner
                      title="Rawr xD"
                      subtitle="Lote Adorable, jeje qué random y Lote Scene"
                      imageUrl={GENERATED_ASSETS.shopBannerRawrXd}
                      titleClass="font-display font-black italic text-2xl text-pink-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                      gradientClass="from-[#29092c]/80 via-[#150c1d]/45 to-transparent"
                      onClick={() => openCollectionPage('rawr-xd')}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {rawrBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 10. MARVEL & ZENLESS ZONE ZERO */}
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-[18px] text-white">
                        Marvel &amp; Zenless Zone Zero
                      </h2>
                      <button
                        onClick={() => setActiveCategory('zzz')}
                        className="px-3.5 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Mostrar todos
                      </button>
                    </div>

                    {deadpoolBundle && (
                      <CollectionPromoBanner
                        title="DEADPOOL / WOLVERINE"
                        subtitle={`Marvel · ${deadpoolBundle.items.length} artículos · ◈ ${deadpoolBundle.priceOrbs} Orbs`}
                        imageUrl={GENERATED_ASSETS.deadpoolBanner}
                        titleClass="font-display font-black italic text-xl text-white"
                        gradientClass="from-black/90 via-black/45 to-transparent"
                        onClick={() => openBundleModal(deadpoolBundle)}
                      />
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                      {zzzBundles.map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 11. ANIME, FANTASÍA & VIBRAS LOFI */}
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-display font-bold text-[18px] text-white">
                          Anime, Fantasía &amp; Vibras Lofi
                        </h2>
                        <p className="text-xs text-zinc-400">
                          Satoru Gojo, Sukuna, Cerbero, Orejas de gato y el mismo pato
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveCategory('anime')}
                        className="px-3.5 py-1.5 rounded-full dc-btn-primary text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Ver anime
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {[...animeFantasyBundles, ...lofiBundles].map((b) => (
                        <BundleCard
                          key={b.id}
                          bundle={b}
                          wishlisted={wishlistIds.includes(b.id)}
                          owned={ownedBundleIds.includes(b.id)}
                          onSelect={(swatch) => openBundleModal(b, swatch)}
                          onToggleWishlist={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(b.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 12. BANNERS DE PERFIL */}
                  {bannerBundles.length > 0 && (
                    <section className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display font-bold text-[18px] text-white flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-[#5865F2]" />
                          <span>Banners de perfil</span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 gap-3.5">
                        {bannerBundles.map((b) => (
                          <BundleCard
                            key={b.id}
                            bundle={b}
                            wishlisted={wishlistIds.includes(b.id)}
                            owned={ownedBundleIds.includes(b.id)}
                            onSelect={(swatch) => openBundleModal(b, swatch)}
                            onToggleWishlist={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(b.id);
                            }}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Gift Toast Notification */}
      <AnimatePresence>
        {giftSentToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-full bg-[#23a55a] text-white text-xs font-bold shadow-2xl border border-white/20 whitespace-nowrap"
          >
            {giftSentToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category & Search Sheet Modal */}
      {showMenuSheet && (
        <div
          onClick={() => setShowMenuSheet(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0e0f14] rounded-t-3xl md:rounded-3xl border border-white/10 p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white">Explorar tienda</h3>
              <button
                onClick={() => setShowMenuSheet(false)}
                className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveCollection(null);
                }}
                placeholder="Buscar Sharingan, Madara, Naruto, Óbito, Rinnegan..."
                className="w-full h-11 rounded-xl bg-[#07080a] border border-white/10 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setActiveCollection(null);
                    setFilterWishlistOnly(false);
                    setShowMenuSheet(false);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left cursor-pointer border ${
                    activeCategory === cat.id
                      ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                      : 'bg-[#14151b] border-white/10 text-zinc-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bundle Inspection & Live Try-On Modal */}
      <AnimatePresence>
        {selectedBundle && activeModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => onSelectBundle(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center"
          >
            <motion.div
              initial={{ y: 48, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 36, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0e0f14] rounded-t-3xl md:rounded-3xl border border-white/12 p-5 pb-6 shadow-2xl max-h-[92vh] overflow-y-auto flex flex-col"
            >
              <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-3 shrink-0" />

              <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
                <span className="text-xs font-semibold text-zinc-400">
                  {isSelectedOwned ? 'En tu inventario de perfil' : 'Probador en vivo'}
                </span>
                <div className="flex items-center gap-2">
                  {selectedBundle.items.length > 1 && (
                    <button
                      onClick={() => {
                        setFullPreviewMode((v) => !v);
                        setPreviewKey((k) => k + 1);
                      }}
                      title="Probar todo el lote combinado"
                      className={`h-8 px-2.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        fullPreviewMode ? 'dc-btn-primary' : 'dc-btn-secondary'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Conjunto</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isSelectedOwned && !fullPreviewMode) {
                        onEquipBundle(selectedBundle);
                      } else {
                        setPreviewKey((k) => k + 1);
                      }
                    }}
                    title="Repetir animación de vista previa"
                    className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
                  >
                    {isSelectedOwned ? <Eye className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => onToggleWishlist(selectedBundle.id)}
                    aria-label="Favorito"
                    className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isSelectedWishlisted ? 'text-red-500 fill-red-500' : 'text-white'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {fullPreviewMode ? (
                  modalBannerUrl && selectedBundle.items.some((i) => i.bannerUrl) ? (
                    <motion.div
                      key={`full-banner-${selectedBundle.id}-${previewKey}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <BannerProfilePreview
                        bannerUrl={modalBannerUrl}
                        bundle={selectedBundle}
                        user={user}
                        showFullBundle
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`full-effect-${selectedBundle.id}-${previewKey}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <ProfileEffectShowcase
                        bundle={selectedBundle}
                        user={user}
                        playKey={previewKey}
                        showFullBundle
                      />
                    </motion.div>
                  )
                ) : activeModalItem.kind === 'Marco de perfil' && activeModalItem.profileFrameId ? (
                  <motion.div
                    key={`frame-${selectedBundle.id}-${activeModalItem.id}-${previewKey}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                  >
                    <ProfileFrameShowcase
                      frameId={activeModalItem.profileFrameId}
                      bundle={selectedBundle}
                      user={user}
                      accentColor={modalSwatch}
                    />
                  </motion.div>
                ) : activeModalItem.kind === 'Banner de perfil' && activeModalItem.bannerUrl ? (
                  <motion.div
                    key={`banner-${selectedBundle.id}-${activeModalItem.id}-${previewKey}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <BannerProfilePreview
                      bannerUrl={activeModalItem.bannerUrl}
                      bundle={selectedBundle}
                      user={user}
                    />
                  </motion.div>
                ) : activeModalItem.kind === 'Placa de identificación' ? (
                  <motion.div
                    key={`plate-${selectedBundle.id}-${previewKey}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="my-2 space-y-2"
                  >
                    <p className="text-xs font-semibold text-zinc-400 px-1">
                      Vista previa en lista de miembros
                    </p>
                    <div className="rounded-2xl bg-[#13141a] border border-white/10 overflow-hidden divide-y divide-white/[0.06]">
                      <div className="px-3 py-2 flex items-center gap-3 opacity-55">
                        <UserAvatar avatar="phibi" size="md" showStatus={false} />
                        <span className="text-sm font-semibold text-white">Phibi</span>
                      </div>

                      <div className="px-3 py-2.5 flex items-center justify-between relative overflow-hidden anim-shimmer bg-[#16171f]">
                        <NameplateStripBackground
                          nameplate={activeModalItem.nameplateId || 'miyabi'}
                          accentColor={modalSwatch}
                        />
                        <div className="flex items-center gap-3 z-10">
                          <UserAvatar
                            avatar={user.avatar}
                            customAvatarUrl={user.customAvatarUrl}
                            decoration={selectedBundle.items[0]?.decorationId || 'none'}
                            decorationAccent={modalSwatch}
                            size="md"
                            showStatus={false}
                          />
                          <span
                            className={`font-display font-extrabold text-[15px] drop-shadow ${
                              activeModalItem.nameplateId === 'rama'
                                ? 'text-zinc-900'
                                : 'text-white'
                            }`}
                          >
                            {user.displayName}
                          </span>
                        </div>
                        <NameplateRowDecor
                          nameplate={activeModalItem.nameplateId || 'miyabi'}
                        />
                      </div>

                      <div className="px-3 py-2 flex items-center gap-3 opacity-55">
                        <UserAvatar avatar="locke" size="md" showStatus={false} />
                        <span className="text-sm font-semibold text-white">Locke</span>
                      </div>
                    </div>
                  </motion.div>
                ) : activeModalItem.kind === 'Efecto de perfil' ? (
                  <motion.div
                    key={`effect-${selectedBundle.id}-${previewKey}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                  >
                    <ProfileEffectShowcase
                      bundle={selectedBundle}
                      user={user}
                      playKey={previewKey}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`deco-${selectedBundle.id}-${activeModalItem.id}-${previewKey}`}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    className={`my-2 h-52 rounded-2xl overflow-hidden relative flex items-center justify-center bg-gradient-to-br ${
                      modalTheme?.gradient || 'from-slate-900 to-zinc-950'
                    } border border-white/15`}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${
                          modalSwatch ? `${modalSwatch}55` : modalTheme?.glow || 'rgba(88,101,242,0.35)'
                        } 0%, rgba(8,9,13,0.85) 75%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <UserAvatar
                        avatar={user.avatar}
                        customAvatarUrl={user.customAvatarUrl}
                        decoration={activeModalItem.decorationId || 'none'}
                        decorationAccent={modalSwatch}
                        size="2xl"
                        showStatus={false}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display font-bold text-[21px] text-white leading-tight">
                      {selectedBundle.title}
                    </h2>
                    <p className="text-[13px] text-zinc-400 mt-0.5">
                      {fullPreviewMode
                        ? `${selectedBundle.items.length} artículos combinados · ${getCategoryLabel(
                            selectedBundle.category
                          )}`
                        : `${activeModalItem.name} · ${activeModalItem.kind}`}
                    </p>
                  </div>
                  {selectedBundle.colorSwatches && selectedBundle.colorSwatches.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {selectedBundle.colorSwatches.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setModalSwatch(hex)}
                          aria-label={`Color ${hex}`}
                          style={{ backgroundColor: hex }}
                          className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                            modalSwatch === hex
                              ? 'border-white scale-115 shadow-lg'
                              : 'border-black/60 opacity-75 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto no-scrollbar py-0.5">
                  {selectedBundle.items.map((item, idx) => {
                    const selected = !fullPreviewMode && idx === selectedItemIndex;
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          setFullPreviewMode(false);
                          setSelectedItemIndex(idx);
                          setPreviewKey((k) => k + 1);
                        }}
                        className={`w-16 h-16 shrink-0 rounded-2xl bg-[#14151b] border flex items-center justify-center relative overflow-hidden cursor-pointer transition-all ${
                          selected
                            ? 'ring-2 ring-[#5865F2] border-transparent shadow-md'
                            : 'border-white/10 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {item.kind === 'Decoración de avatar' && item.decorationId ? (
                          <div className="w-10 h-10 relative flex items-center justify-center">
                            <DiscordLogo className="w-6 h-6 text-zinc-400" />
                            <AvatarDecorationRing
                              decoration={item.decorationId}
                              accentColor={modalSwatch}
                            />
                          </div>
                        ) : item.kind === 'Marco de perfil' && item.profileFrameId ? (
                          <div className="w-10 h-11 rounded-lg bg-[#22242e] border border-white/25 relative flex items-center justify-center">
                            <ProfileFrameArtwork
                              frame={item.profileFrameId}
                              accentColor={modalSwatch}
                            />
                            <span className="relative z-10 text-[9px] font-bold text-white bg-black/75 px-1 py-0.5 rounded">
                              Marco
                            </span>
                          </div>
                        ) : item.kind === 'Banner de perfil' && item.bannerUrl ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                            <img
                              src={item.bannerUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <span className="relative z-10 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                              Banner
                            </span>
                          </div>
                        ) : item.kind === 'Placa de identificación' && item.nameplateId ? (
                          <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                            <NameplateStripBackground
                              nameplate={item.nameplateId}
                              accentColor={modalSwatch}
                            />
                            <span className="relative z-10 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                              Placa
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full relative flex items-center justify-center bg-zinc-900">
                            <div className="absolute inset-0 opacity-85">
                              <ThematicBundleArtwork variant={selectedBundle.artVariant} />
                            </div>
                            <span className="relative z-10 text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.5 rounded">
                              Efecto
                            </span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-3.5 px-3.5 py-2.5 rounded-xl bg-[#14151b] border border-white/10 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Precio del lote</span>
                  <span className="text-sm font-bold text-white tabular-nums">
                    ◈ {selectedBundle.priceOrbs.toLocaleString('es-ES')} Orbs · {selectedBundle.priceUsd}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  {isSelectedOwned ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onEquipBundle(selectedBundle);
                        onSelectBundle(null);
                      }}
                      className="flex-1 h-12 rounded-full dc-btn-success font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>Equipar en tu perfil</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        onBuyBundle(selectedBundle, user.orbs >= selectedBundle.priceOrbs);
                        setJustBoughtId(selectedBundle.id);
                        if (boughtTimerRef.current !== null) window.clearTimeout(boughtTimerRef.current);
                        boughtTimerRef.current = window.setTimeout(() => setJustBoughtId(null), 1600);
                      }}
                      className="flex-1 h-12 rounded-full dc-btn-primary font-bold text-[15px] cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      {justBoughtId === selectedBundle.id && (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      )}
                      <span>
                        {user.orbs >= selectedBundle.priceOrbs
                          ? `Comprar lote (◈ ${selectedBundle.priceOrbs.toLocaleString('es-ES')})`
                          : `Comprar lote (${selectedBundle.priceUsd})`}
                      </span>
                    </motion.button>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setShowGiftModal(true)}
                    aria-label="Regalar lote"
                    title="Enviar regalo (desbloquea insignia Hacer regalos)"
                    className="w-12 h-12 rounded-2xl dc-btn-primary flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Gift className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Recipient Modal */}
      <AnimatePresence>
        {showGiftModal && selectedBundle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGiftModal(false)}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0e0f14] rounded-t-3xl md:rounded-3xl border border-white/10 p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-[#5865F2]" />
                  <h3 className="font-display font-bold text-base text-white">Enviar regalo</h3>
                </div>
                <button
                  onClick={() => setShowGiftModal(false)}
                  className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Elige a un amigo para regalarle <strong className="text-white">{selectedBundle.title}</strong> (◈{' '}
                {selectedBundle.priceOrbs} Orbs). ¡Desbloquearás o subirás la insignia{' '}
                <strong className="text-white">Hacer regalos</strong>!
              </p>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {(() => {
                  const giftableFriends = dms.filter((d) => !d.isGroup && !d.isBot);
                  if (giftableFriends.length === 0) {
                    return (
                      <div className="p-4 rounded-2xl bg-[#14151b] border border-white/10 text-center text-xs text-zinc-400">
                        No hay amigos disponibles en tus mensajes directos para enviar este regalo.
                      </div>
                    );
                  }
                  return giftableFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => {
                        onGiftBundle(selectedBundle, friend.id, friend.name);
                        setShowGiftModal(false);
                        setGiftSentToast(`¡Regalo enviado a ${friend.name}! 🎁`);
                        if (giftTimerRef.current !== null) window.clearTimeout(giftTimerRef.current);
                        giftTimerRef.current = window.setTimeout(() => setGiftSentToast(null), 2800);
                      }}
                      className="w-full p-2.5 rounded-2xl bg-[#14151b] hover:bg-[#1c1e26] border border-white/10 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          avatar={friend.avatar}
                          status={friend.status}
                          size="sm"
                          borderColor="#14151b"
                        />
                        <span className="text-sm font-bold text-white truncate">
                          {friend.name}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full dc-btn-primary text-xs font-bold shrink-0">
                        Regalar
                      </span>
                    </button>
                  ));
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
