import {
  BadgeDefinition,
  ChatMessage,
  DirectMessageThread,
  DropInVoiceRoom,
  FriendActivity,
  NotificationItem,
  PublicUserProfile,
  Quest,
  Server,
  ShopBundle,
  ThemeMode,
  UserProfile,
} from '../types/discord';

export const INITIAL_USER: UserProfile = {
  id: 'guest',
  displayName: 'Usuario',
  username: 'usuario',
  pronouns: '',
  displayNameStyle: 'default',
  status: 'online',
  customStatus: '',
  bio: 'Miembro de Primordial.',
  bannerColor: '#5865F2',
  avatar: 'madara',
  decoration: 'none',
  profileEffect: 'none',
  profileFrame: 'none',
  nameplate: 'none',
  orbs: 1200,
  memberSince: 'Noviembre 2026',
  note: '',
  nitroTier: 'none',
  serverTag: '',
  unlockedBadgeIds: ['hypesquad', 'beta'],
  equippedBadgeIds: ['hypesquad'],
  boostsGiven: 0,
  boostStreakMonths: 0,
  giftsSent: 0,
  streamHours: 0,
  gamesPlayedCount: 0,
  accountYears: 0,
  betaTestsCount: 0,
  perServerProfiles: {},
};

export const INITIAL_ACTIVITIES: FriendActivity[] = [];

export const INITIAL_DMS: DirectMessageThread[] = [];

export const INITIAL_SERVERS: Server[] = [];

export interface DiscoverableCommunity {
  name: string;
  category: string;
  members: string;
  online: string;
  desc: string;
  thumb: string;
}

export const DISCOVERABLE_COMMUNITIES: DiscoverableCommunity[] = [];

export interface SearchableFriendEntry {
  id: string;
  displayName: string;
  username: string;
  avatar: PublicUserProfile['avatar'];
  status: PublicUserProfile['status'];
  bio: string;
  customStatus?: string;
}

export const FRIEND_DIRECTORY: SearchableFriendEntry[] = [];

export const PRIMORDIAL_BOT_DM_ID = 'dm-primordial-bot';

export const EPHEMERAL_STATUS_PRESETS: {
  id: string;
  emoji: string;
  label: string;
  text: string;
}[] = [
  { id: 'playing', emoji: '🎮', label: 'Jugando', text: '🎮 Jugando con el squad' },
  { id: 'music', emoji: '🎧', label: 'Escuchando música', text: '🎧 Escuchando música lo-fi' },
  { id: 'chill', emoji: '☕', label: 'Chill', text: '☕ De chill, escribe para hablar' },
  { id: 'available', emoji: '💬', label: 'Disponible', text: '💬 Disponible para chatear' },
  { id: 'study', emoji: '⚡', label: 'En foco', text: '⚡ En modo estudio / proyecto' },
];

export const INITIAL_DROPIN_ROOMS: DropInVoiceRoom[] = [
  {
    id: 'dropin-cafe',
    name: 'Café Primordial',
    topic: 'Entra y sal libremente para charlar un rato',
    category: 'Social',
    accentColor: '#8b5cf6',
    emoji: '☕',
    participants: [
      { id: 'bot-host-1', name: 'Primordial Bot', avatar: 'primordial-bot', speaking: false, muted: false },
    ],
  },
  {
    id: 'dropin-gaming',
    name: 'Gaming Drop-in',
    topic: 'Arma partida rápida sin llamada formal',
    category: 'Gaming',
    accentColor: '#22c55e',
    emoji: '🎮',
    participants: [],
  },
  {
    id: 'dropin-lofi',
    name: 'Música & Focus',
    topic: 'Sala abierta para escuchar beats o estudiar',
    category: 'Música',
    accentColor: '#06b6d4',
    emoji: '🎧',
    participants: [],
  },
];

export const CURATED_PUBLIC_SERVERS: Server[] = [
  {
    id: 'srv-public-lounge',
    name: 'Primordial Lounge',
    shortCode: 'PL',
    iconStyle: 'custom',
    customEmoji: '✨',
    accentColor: '#8b5cf6',
    bannerColor: '#3b1d7a',
    description: 'Sala principal de bienvenida, presentaciones y charlas rápidas con la comunidad.',
    memberCount: 1420,
    memberCountDisplay: '1.4k',
    onlineCount: 184,
    boostLevel: 2,
    boostCount: 7,
    isDiscoverable: true,
    communityEnabled: true,
    activeServerTag: 'PL',
    channels: [
      {
        id: 'ch-lounge-general',
        name: 'general',
        type: 'text',
        category: 'BIENVENIDA',
        topic: 'Preséntate, comparte tu nota rápida o conversa con la comunidad.',
        messages: [
          {
            id: 'msg-pub-lounge-1',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content:
              '¡Bienvenido a **Primordial Lounge**! Puedes saludar aquí, probar salas Drop-in de voz o ganar Orbs gratis con cada mensaje.',
            reactions: [
              { emoji: '👋', count: 18, reacted: false },
              { emoji: '💜', count: 12, reacted: false },
            ],
          },
        ],
      },
      {
        id: 'ch-lounge-presentaciones',
        name: 'presentaciones',
        type: 'text',
        category: 'BIENVENIDA',
        topic: 'Cuenta qué te gusta hacer y encuentra gente con gustos similares.',
        messages: [
          {
            id: 'msg-pub-lounge-2',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content: '¿Qué juegas o escuchas últimamente? Deja tu saludo para romper el hielo.',
            reactions: [{ emoji: '🔥', count: 7, reacted: false }],
          },
        ],
      },
      {
        id: 'ch-lounge-voz',
        name: 'Café Drop-in',
        type: 'voice',
        category: 'VOZ ABIERTA',
        topic: 'Entrada rápida sin llamada formal',
        voiceParticipants: [],
        messages: [],
      },
    ],
  },
  {
    id: 'srv-public-gaming',
    name: 'Gaming & Squads',
    shortCode: 'GS',
    iconStyle: 'custom',
    customEmoji: '🎮',
    accentColor: '#22c55e',
    bannerColor: '#0f3d26',
    description: 'Encuentra dúo o squad para Valorant, Minecraft, Fortnite, ZZZ y juegos cooperativos.',
    memberCount: 2850,
    memberCountDisplay: '2.8k',
    onlineCount: 312,
    boostLevel: 3,
    boostCount: 14,
    isDiscoverable: true,
    communityEnabled: true,
    activeServerTag: 'GG',
    channels: [
      {
        id: 'ch-gaming-lfg',
        name: 'buscar-equipo',
        type: 'text',
        category: 'SQUADS',
        topic: 'Di tu juego y región para armar partida al instante.',
        messages: [
          {
            id: 'msg-pub-gaming-1',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content: '¿Buscas equipo? Escribe el juego y únete directo al canal **Voz Squad**.',
            reactions: [{ emoji: '🎮', count: 21, reacted: false }],
          },
        ],
      },
      {
        id: 'ch-gaming-clips',
        name: 'clips-y-logros',
        type: 'text',
        category: 'SQUADS',
        topic: 'Comparte capturas y mejores momentos.',
        messages: [],
      },
      {
        id: 'ch-gaming-voz',
        name: 'Voz Squad Drop-in',
        type: 'voice',
        category: 'VOZ ABIERTA',
        topic: 'Salta directo a jugar',
        voiceParticipants: [],
        messages: [],
      },
    ],
  },
  {
    id: 'srv-public-music',
    name: 'Música & Lo-Fi',
    shortCode: 'ML',
    iconStyle: 'custom',
    customEmoji: '🎧',
    accentColor: '#06b6d4',
    bannerColor: '#0d3647',
    description: 'Playlists compartidas, sesiones lo-fi, recomendaciones musicales y salas de escucha.',
    memberCount: 980,
    memberCountDisplay: '980',
    onlineCount: 95,
    boostLevel: 1,
    boostCount: 4,
    isDiscoverable: true,
    communityEnabled: true,
    activeServerTag: 'FM',
    channels: [
      {
        id: 'ch-music-now',
        name: 'que-escuchas',
        type: 'text',
        category: 'SONIDO',
        topic: 'Comparte el tema que tienes en bucle hoy.',
        messages: [
          {
            id: 'msg-pub-music-1',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content: 'Deja aquí tu canción del día o entra a **Radio Lo-Fi** mientras chateas.',
            reactions: [{ emoji: '🎵', count: 14, reacted: false }],
          },
        ],
      },
      {
        id: 'ch-music-voz',
        name: 'Radio Lo-Fi Drop-in',
        type: 'voice',
        category: 'VOZ ABIERTA',
        topic: 'Sala relajada de audio abierto',
        voiceParticipants: [],
        messages: [],
      },
    ],
  },
  {
    id: 'srv-public-art',
    name: 'Arte, Diseño & Tech',
    shortCode: 'AT',
    iconStyle: 'custom',
    customEmoji: '🎨',
    accentColor: '#ec4899',
    bannerColor: '#4c1138',
    description: 'Espacio para ilustradores, desarrolladores, editores y creadores digitales.',
    memberCount: 1140,
    memberCountDisplay: '1.1k',
    onlineCount: 118,
    boostLevel: 2,
    boostCount: 6,
    isDiscoverable: true,
    communityEnabled: true,
    activeServerTag: 'ART',
    channels: [
      {
        id: 'ch-art-showcase',
        name: 'galeria-y-proyectos',
        type: 'text',
        category: 'ESTUDIO',
        topic: 'Muestra diseños, avatares, código o ideas en progreso.',
        messages: [
          {
            id: 'msg-pub-art-1',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content: 'Comparte tu último proyecto o pide feedback de diseño y desarrollo.',
            reactions: [{ emoji: '✨', count: 15, reacted: false }],
          },
        ],
      },
      {
        id: 'ch-art-voz',
        name: 'Mesa Creativa',
        type: 'voice',
        category: 'VOZ ABIERTA',
        topic: 'Charla abierta mientras creas',
        voiceParticipants: [],
        messages: [],
      },
    ],
  },
  {
    id: 'srv-public-anime',
    name: 'Anime & Cultura',
    shortCode: 'AC',
    iconStyle: 'custom',
    customEmoji: '🌙',
    accentColor: '#f59e0b',
    bannerColor: '#4a260a',
    description: 'Debates de estrenos, manga, bandas sonoras y recomendaciones sin spoilers.',
    memberCount: 1760,
    memberCountDisplay: '1.7k',
    onlineCount: 204,
    boostLevel: 2,
    boostCount: 9,
    isDiscoverable: true,
    communityEnabled: true,
    activeServerTag: 'ANI',
    channels: [
      {
        id: 'ch-anime-general',
        name: 'estrenos-y-manga',
        type: 'text',
        category: 'CULTURA',
        topic: 'Habla de tus series favoritas y pide recomendaciones.',
        messages: [
          {
            id: 'msg-pub-anime-1',
            authorId: 'primordial-bot',
            authorName: 'Primordial Bot',
            authorAvatar: 'primordial-bot',
            authorIsBot: true,
            authorTag: 'APP',
            timestamp: 'Hoy',
            content: '¿Qué serie o manga recomiendas para ver este fin de semana?',
            reactions: [{ emoji: '🍿', count: 19, reacted: false }],
          },
        ],
      },
      {
        id: 'ch-anime-voz',
        name: 'Watchparty Drop-in',
        type: 'voice',
        category: 'VOZ ABIERTA',
        topic: 'Sala rápida de comentarios',
        voiceParticipants: [],
        messages: [],
      },
    ],
  },
];

export function createWelcomeBotThread(displayName?: string): DirectMessageThread {
  const safeName = displayName && displayName !== 'Usuario' ? displayName : 'viajero';
  return {
    id: PRIMORDIAL_BOT_DM_ID,
    name: 'Primordial Bot',
    username: 'primordial.bot',
    avatar: 'primordial-bot',
    isBot: true,
    pinned: true,
    favorite: true,
    status: 'online',
    serverTag: 'APP',
    lastMessagePreview: '👋 ¡Bienvenido! Prueba /ayuda o personaliza tu perfil.',
    lastTimestamp: 'Fijado',
    messages: [
      {
        id: 'bot-welcome-1',
        authorId: 'primordial-bot',
        authorName: 'Primordial Bot',
        authorAvatar: 'primordial-bot',
        authorIsBot: true,
        authorTag: 'APP',
        timestamp: 'Hoy',
        pinned: true,
        content:
          `¡Hola **${safeName}**! Soy **Primordial Bot**, tu guía interactivo.\n\nDesde aquí puedes configurar tu perfil, probar comandos como **/ayuda**, **/orbs**, **/tema**, **/voz** o descubrir comunidades activas con un clic.`,
        reactions: [{ emoji: '💜', count: 1, reacted: true }],
        quickReplies: [
          { id: 'qr-help', label: '⚡ Probar /ayuda', command: '/ayuda' },
          { id: 'qr-orbs', label: '💎 ¿Cómo gano Orbs?', command: '/orbs' },
          { id: 'qr-profile', label: '🎨 Configurar perfil', navigateTo: 'tu' },
          { id: 'qr-discover', label: '🧭 Explorar servidores', navigateTo: 'discover' },
          { id: 'qr-shop', label: '🛍️ Ir a Tienda', navigateTo: 'tienda' },
        ],
      },
    ],
  };
}

export function generateBotReply(
  rawInput: string,
  user: UserProfile,
  currentTheme: ThemeMode
): ChatMessage {
  const clean = rawInput.trim().toLowerCase();
  let content = '';
  let quickReplies: ChatMessage['quickReplies'] = [
    { id: 'qr-cmd-ayuda', label: '📜 Ver comandos', command: '/ayuda' },
    { id: 'qr-cmd-orbs', label: '💎 Ver mis Orbs', command: '/orbs' },
    { id: 'qr-nav-tienda', label: '🛍️ Tienda', navigateTo: 'tienda' },
  ];

  if (clean.startsWith('/ayuda') || clean === 'ayuda' || clean === 'help') {
    content =
      '✨ **Comandos disponibles de Primordial Bot**\n' +
      '• **/perfil** — Revisa tu perfil, insignia y personalización\n' +
      '• **/orbs** — Consulta tu saldo y cómo ganar Orbs gratis\n' +
      '• **/tema** — Opciones de temas de interfaz de la Tienda\n' +
      '• **/voz** — Salas Drop-in y efectos de entrada de voz\n' +
      '• **/estado** — Cómo publicar notas rápidas efímeras\n' +
      '• **/amigos** — Genera tu enlace directo para invitar amigos';
    quickReplies = [
      { id: 'qr-1', label: '💎 /orbs', command: '/orbs' },
      { id: 'qr-2', label: '🎨 /perfil', command: '/perfil' },
      { id: 'qr-3', label: '🎙️ /voz', command: '/voz' },
      { id: 'qr-4', label: '🔗 /amigos', command: '/amigos' },
    ];
  } else if (clean.startsWith('/orbs') || clean.includes('orb')) {
    content =
      `💎 Tienes **${user.orbs.toLocaleString('es-ES')} Orbs** en tu cuenta.\n\n` +
      'Ganas **Orbs gratis por tu actividad**:\n' +
      '• **+15 Orbs** al enviar mensajes en chats y servidores\n' +
      '• **+25 Orbs** al publicar una nota o estado rápido\n' +
      '• **+30 Orbs** al entrar a una sala de voz Drop-in o comunidad\n' +
      '• **+100 Orbs** al compartir o abrir un enlace de invitación';
    quickReplies = [
      { id: 'qr-shop-orbs', label: '🛍️ Canjear en Tienda', navigateTo: 'tienda' },
      { id: 'qr-quests-orbs', label: '🏆 Ver Misiones', navigateTo: 'misiones' },
      { id: 'qr-voice-orbs', label: '🎙️ Probar sala Drop-in', navigateTo: 'voice' },
    ];
  } else if (clean.startsWith('/perfil')) {
    content =
      `🪪 **Resumen de tu perfil**: **${user.displayName}** (@${user.username})\n` +
      `• Marco activo: **${user.profileFrame || 'none'}**\n` +
      `• Insignias equipadas: **${user.equippedBadgeIds.length}**\n\n` +
      'Toca el botón de abajo para editar tu biografía, foto, color del nombre o marco.';
    quickReplies = [
      { id: 'qr-edit-prof', label: '✏️ Abrir Mi Perfil', navigateTo: 'tu' },
      { id: 'qr-shop-prof', label: '✨ Marcos y Temas', navigateTo: 'tienda' },
    ];
  } else if (clean.startsWith('/tema')) {
    content =
      `🎨 Tu tema actual de interfaz es **${currentTheme}**.\n` +
      'En la **Tienda** puedes desbloquear los temas **Cyber Neón**, **Esmeralda** y **Carmesí Nocturno** usando tus Orbs ganados por actividad.';
    quickReplies = [
      { id: 'qr-open-shop-theme', label: '🎨 Ver Temas en Tienda', navigateTo: 'tienda' },
    ];
  } else if (clean.startsWith('/voz')) {
    content =
      '🎙️ Las **Salas Drop-in** te permiten entrar y salir de voz con un toque, sin llamadas formales.\n' +
      `Tu efecto de entrada actual es: **${user.voiceEntryEffect || 'Estándar'}**. ¡Consigue sonidos Arcade, Cyber Warp o Aurora en la Tienda!`;
    quickReplies = [
      { id: 'qr-join-dropin', label: '🔊 Entrar a Café Primordial', navigateTo: 'voice' },
      { id: 'qr-shop-voice', label: '🎵 Ver Efectos de Voz', navigateTo: 'tienda' },
    ];
  } else if (clean.startsWith('/estado') || clean.startsWith('/nota')) {
    content =
      '📝 En la parte superior de **Mensajes**, toca **"+ Tu nota"** para compartir qué estás jugando, escuchando música o si estás disponible. ¡Además te da **+25 Orbs**!';
    quickReplies = [
      { id: 'qr-friends-note', label: '👥 Invitar amigos', command: '/amigos' },
    ];
  } else if (clean.startsWith('/amigos') || clean.startsWith('/invitar')) {
    content =
      '🔗 Desde **Añadir amigo** puedes copiar tu **enlace de invitación directo** o enviarlo por **WhatsApp** con un clic para sumar amigos externos y ganar **+100 Orbs**.';
    quickReplies = [
      { id: 'qr-open-friends', label: '🔗 Abrir Invitaciones', navigateTo: 'amigos' },
    ];
  } else if (clean.startsWith('/tienda')) {
    content =
      '🛍️ En la **Tienda** encontrarás marcos desde **60 Orbs**, temas completos para la app, efectos de entrada en salas de voz e insignias exclusivas.';
    quickReplies = [{ id: 'qr-go-tienda', label: '🛍️ Ir a Tienda ahora', navigateTo: 'tienda' }];
  } else {
    content =
      `¡Recibido, **${user.displayName}**! 😊 Puedes escribir **/ayuda** para ver todos mis comandos o elegir una acción rápida debajo:`;
    quickReplies = [
      { id: 'qr-f-1', label: '⚡ /ayuda', command: '/ayuda' },
      { id: 'qr-f-2', label: '🧭 Descubrir comunidades', navigateTo: 'discover' },
      { id: 'qr-f-3', label: '🎙️ Sala Drop-in', navigateTo: 'voice' },
      { id: 'qr-f-4', label: '🔗 Invitar amigos', navigateTo: 'amigos' },
    ];
  }

  return {
    id: `bot-reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    authorId: 'primordial-bot',
    authorName: 'Primordial Bot',
    authorAvatar: 'primordial-bot',
    authorIsBot: true,
    authorTag: 'APP',
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    createdAtMs: Date.now(),
    content,
    reactions: [],
    quickReplies,
  };
}

export const INITIAL_QUESTS: Quest[] = [
  {
    id: 'q-dune',
    title: 'MISIÓN DUNE: PART THREE',
    sponsor: 'Warner Bros. Pictures',
    endsAt: 'Acaba el 27/11',
    rewardOrbs: 200,
    nitroMultiplier: 'Desbloquea x1,2',
    description: '¡Ve el vídeo para ganar 200 Orbs!',
    ctaLabel: 'Ver 3 min',
    secondaryLabel: 'Unirse al servid...',
    durationSeconds: 180,
    artVariant: 'dune',
    claimed: false,
  },
  {
    id: 'q-badges',
    title: 'MISIÓN BADGES 2.0',
    sponsor: 'Discord',
    endsAt: 'Acaba el 30/11',
    rewardOrbs: 200,
    nitroMultiplier: 'Desbloquea x1,2',
    description: '¡Ve el vídeo para ganar 200 Orbs!',
    ctaLabel: 'Ver 50 s',
    secondaryLabel: 'Más información',
    durationSeconds: 50,
    artVariant: 'badges',
    claimed: false,
  },
  {
    id: 'q-exterminauts',
    title: 'MISIÓN EXTERMINAUTS TRAILER',
    sponsor: 'Level Infinite',
    endsAt: 'Acaba el 16/12',
    rewardOrbs: 200,
    nitroMultiplier: 'Desbloquea x1,2',
    description: '¡Ve el vídeo para ganar 200 Orbs!',
    ctaLabel: 'Ver 1 min',
    secondaryLabel: 'Más información',
    durationSeconds: 60,
    artVariant: 'exterminauts',
    claimed: false,
  },
  {
    id: 'q-dec4-01',
    title: 'ANUNCIO CYBERPUNK 2077: PHANTOM LIBERTY',
    sponsor: 'CD PROJEKT RED',
    endsAt: 'Acaba el 4/12',
    rewardOrbs: 250,
    nitroMultiplier: 'Máx. 300 Orbs',
    description: 'Ve el anuncio de Dogtown para conseguir 250 Orbs.',
    ctaLabel: 'Ver 30 s',
    secondaryLabel: 'Detalles',
    durationSeconds: 30,
    artVariant: 'ad',
    isLimitedTime: true,
    category: 'Videojuego',
    adBrand: 'CYBERPUNK 2077',
    adTagline: 'Edición Definitiva · Dogtown te espera',
    bannerGradient: ['#b91c1c', '#18181b', '#eab308'],
    claimed: false,
  },
  {
    id: 'q-dec4-02',
    title: 'ANUNCIO VALORANT: ACTO INVIERNO',
    sponsor: 'Riot Games',
    endsAt: 'Acaba el 4/12',
    rewardOrbs: 300,
    nitroMultiplier: 'Máx. 300 Orbs',
    description: 'Mira el tráiler del nuevo pase de batalla por 300 Orbs.',
    ctaLabel: 'Ver 45 s',
    secondaryLabel: 'Detalles',
    durationSeconds: 45,
    artVariant: 'ad',
    isLimitedTime: true,
    category: 'Esports',
    adBrand: 'VALORANT',
    adTagline: 'Nuevo mapa y colección Nocturnum',
    bannerGradient: ['#e11d48', '#0f172a', '#38bdf8'],
    claimed: false,
  },
  {
    id: 'q-dec4-03',
    title: 'ANUNCIO SPOTIFY WRAPPED EN DIRECTO',
    sponsor: 'Spotify',
    endsAt: 'Acaba el 4/12',
    rewardOrbs: 200,
    nitroMultiplier: 'Máx. 300 Orbs',
    description: 'Descubre el anuncio musical del año y gana 200 Orbs.',
    ctaLabel: 'Ver 20 s',
    secondaryLabel: 'Detalles',
    durationSeconds: 20,
    artVariant: 'ad',
    isLimitedTime: true,
    category: 'Música',
    adBrand: 'SPOTIFY',
    adTagline: 'Tu banda sonora de todo el año',
    bannerGradient: ['#16a34a', '#052e16', '#18181b'],
    claimed: false,
  },
  {
    id: 'q-dec4-04',
    title: 'ANUNCIO MONSTER HUNTER WILDS',
    sponsor: 'Capcom',
    endsAt: 'Acaba el 4/12',
    rewardOrbs: 280,
    nitroMultiplier: 'Máx. 300 Orbs',
    description: 'Explora las Tierras Prohibidas en este anuncio por 280 Orbs.',
    ctaLabel: 'Ver 40 s',
    secondaryLabel: 'Detalles',
    durationSeconds: 40,
    artVariant: 'ad',
    isLimitedTime: true,
    category: 'Videojuego',
    adBrand: 'MONSTER HUNTER',
    adTagline: 'Caza cooperativa de nueva generación',
    bannerGradient: ['#b45309', '#1c1917', '#dc2626'],
    claimed: false,
  },
  {
    id: 'q-dec4-05',
    title: 'ANUNCIO NVIDIA GEFORCE RTX SERIE 50',
    sponsor: 'NVIDIA GeForce',
    endsAt: 'Acaba el 4/12',
    rewardOrbs: 300,
    nitroMultiplier: 'Máx. 300 Orbs',
    description: 'Ve la presentación de DLSS Ray Reconstruction y gana 300 Orbs.',
    ctaLabel: 'Ver 45 s',
    secondaryLabel: 'Detalles',
    durationSeconds: 45,
    artVariant: 'ad',
    isLimitedTime: true,
    category: 'Hardware',
    adBrand: 'NVIDIA RTX',
    adTagline: 'Trazado de rayos completo e IA local',
    bannerGradient: ['#65a30d', '#09090b', '#1e293b'],
    claimed: false,
  },
];

const BASE_SHOP_BUNDLES: ShopBundle[] = [
  {
    id: 'bundle-miyabi',
    title: 'Lote de Hoshimi Miyabi',
    shortTitle: 'Hoshimi Miyabi',
    collectionId: 'zzz',
    category: 'zzz',
    priceOrbs: 650,
    priceUsd: '7,99 US$',
    artVariant: 'miyabi',
    items: [
      {
        id: 'miyabi-deco',
        name: 'Hoshimi Miyabi',
        kind: 'Decoración de avatar',
        decorationId: 'miyabi',
      },
      {
        id: 'miyabi-plate',
        name: 'Hoshimi Miyabi',
        kind: 'Placa de identificación',
        nameplateId: 'miyabi',
      },
      {
        id: 'miyabi-fx',
        name: 'Hoshimi Miyabi',
        kind: 'Efecto de perfil',
        profileEffectId: 'miyabi',
      },
      {
        id: 'miyabi-banner',
        name: 'Corte Glacial · Miyabi',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_miyabi_art_1795281106262.jpg',
      },
    ],
  },
  {
    id: 'bundle-ellen',
    title: 'Lote de Ellen Joe',
    shortTitle: 'Ellen Joe',
    collectionId: 'zzz',
    category: 'zzz',
    priceOrbs: 650,
    priceUsd: '7,99 US$',
    artVariant: 'ellen',
    items: [
      {
        id: 'ellen-deco',
        name: 'Ellen Joe',
        kind: 'Decoración de avatar',
        decorationId: 'ellen',
      },
      {
        id: 'ellen-plate',
        name: 'Victoria Tiburón',
        kind: 'Placa de identificación',
      },
      {
        id: 'ellen-fx',
        name: 'Mordida Glacial',
        kind: 'Efecto de perfil',
        profileEffectId: 'ellen',
      },
      {
        id: 'ellen-banner',
        name: 'Victoria Housekeeping · Ellen',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_ellen_art_1795281108333.jpg',
      },
    ],
  },
  {
    id: 'bundle-burnice',
    title: 'Lote de Burnice White',
    shortTitle: 'Burnice White',
    collectionId: 'zzz',
    category: 'zzz',
    priceOrbs: 550,
    priceUsd: '6,99 US$',
    artVariant: 'burnice',
    items: [
      {
        id: 'burnice-deco',
        name: 'Burnice White',
        kind: 'Decoración de avatar',
        decorationId: 'burnice',
      },
      {
        id: 'burnice-plate',
        name: 'Nitro Fuel',
        kind: 'Placa de identificación',
      },
      {
        id: 'burnice-fx',
        name: 'Chispas de Fuego',
        kind: 'Efecto de perfil',
        profileEffectId: 'burnice',
      },
      {
        id: 'burnice-banner',
        name: 'Nitro Fuel · Burnice',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_burnice_art_1795281108082.jpg',
      },
    ],
  },
  {
    id: 'bundle-deadpool',
    title: 'Lote de Deadpool & Wolverine',
    shortTitle: 'Deadpool & Wolverine',
    collectionId: 'marvel',
    category: 'marvel',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'deadpool',
    items: [
      {
        id: 'dp-deco',
        name: 'Deadpool Katanas',
        kind: 'Decoración de avatar',
        decorationId: 'deadpool',
      },
      {
        id: 'dp-plate',
        name: 'Corazón Deadpool',
        kind: 'Placa de identificación',
        nameplateId: 'deadpool',
      },
      {
        id: 'wv-plate',
        name: 'Garras de Wolverine',
        kind: 'Efecto de perfil',
        profileEffectId: 'deadpool',
      },
      {
        id: 'dp-banner',
        name: 'Dúo Marvel',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/banner_deadpool_duo_1795280758288.jpg',
      },
    ],
  },
  {
    id: 'bundle-dbd',
    title: 'Lote de Dead by Daylight',
    shortTitle: 'Dead by Daylight',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 700,
    priceUsd: '8,49 US$',
    artVariant: 'dbd',
    items: [
      {
        id: 'dbd-deco',
        name: 'La Entidad',
        kind: 'Decoración de avatar',
        decorationId: 'dbd',
      },
      {
        id: 'dbd-plate',
        name: 'Gancho Sangriento',
        kind: 'Placa de identificación',
        nameplateId: 'dbd',
      },
      {
        id: 'dbd-fx',
        name: 'Niebla Carmesí',
        kind: 'Efecto de perfil',
        profileEffectId: 'dbd',
      },
      {
        id: 'dbd-banner',
        name: 'Niebla de La Entidad',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/banner_dbd_1795280075129.jpg',
      },
    ],
  },
  {
    id: 'bundle-plantas',
    title: 'Lote de Plantas',
    shortTitle: 'Lote de Plantas',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 450,
    priceUsd: '5,99 US$',
    artVariant: 'plantas',
    items: [
      {
        id: 'pl-deco',
        name: 'Hiedra Colgante',
        kind: 'Decoración de avatar',
        decorationId: 'plantas',
      },
      {
        id: 'pl-banner',
        name: 'Invernadero Lofi',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_lofi_plants_1795281107687.jpg',
      },
    ],
  },
  {
    id: 'bundle-croma',
    title: 'Onda cromática',
    shortTitle: 'Onda cromática',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 350,
    priceUsd: '4,99 US$',
    artVariant: 'croma',
    items: [
      {
        id: 'croma-deco',
        name: 'Onda cromática',
        kind: 'Decoración de avatar',
        decorationId: 'croma',
      },
    ],
  },
  {
    id: 'bundle-gato',
    title: 'Gato cómodo',
    shortTitle: 'Gato cómodo',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'gato',
    items: [
      {
        id: 'gato-deco',
        name: 'Gato cómodo',
        kind: 'Decoración de avatar',
        decorationId: 'gato',
      },
      {
        id: 'gato-banner',
        name: 'Siesta Lofi',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_cozy_cat_1795281108030.jpg',
      },
    ],
  },

  /* ===================================================================== */
  /* NIGHT TERRORS COLLECTION                                              */
  /* ===================================================================== */
  {
    id: 'bundle-pesadilla',
    title: 'Lote de Hora de pesadilla',
    shortTitle: 'Lote de Hora de pesadilla',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'pesadilla',
    items: [
      {
        id: 'pesadilla-deco',
        name: 'Hora de pesadilla',
        kind: 'Decoración de avatar',
        decorationId: 'pesadilla',
      },
      {
        id: 'pesadilla-plate',
        name: 'Observador',
        kind: 'Placa de identificación',
        nameplateId: 'observador',
      },
      {
        id: 'pesadilla-fx',
        name: 'Hora de pesadilla',
        kind: 'Efecto de perfil',
        profileEffectId: 'pesadilla',
      },
    ],
  },
  {
    id: 'bundle-acechador',
    title: 'Lote de Acechador acuático',
    shortTitle: 'Lote de Acechador acuático',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'acechador',
    items: [
      {
        id: 'acechador-deco',
        name: 'Espectro',
        kind: 'Decoración de avatar',
        decorationId: 'espectro',
      },
      {
        id: 'acechador-plate',
        name: 'Acechador acuático',
        kind: 'Placa de identificación',
        nameplateId: 'acechador',
      },
      {
        id: 'acechador-fx',
        name: 'Vamos a jugar',
        kind: 'Efecto de perfil',
        profileEffectId: 'jugar',
      },
    ],
  },
  {
    id: 'bundle-almas-lote',
    title: 'Lote de Almas atrapadas',
    shortTitle: 'Lote de Almas atrapadas',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'almas',
    items: [
      {
        id: 'almas-lote-deco',
        name: 'Almas atrapadas',
        kind: 'Decoración de avatar',
        decorationId: 'almas',
      },
      {
        id: 'almas-lote-plate',
        name: 'Almas atrapadas',
        kind: 'Placa de identificación',
        nameplateId: 'almas',
      },
      {
        id: 'almas-lote-fx',
        name: 'Almas atrapadas',
        kind: 'Efecto de perfil',
        profileEffectId: 'almas',
      },
    ],
  },
  {
    id: 'bundle-tentempie',
    title: 'Hora del tentempié',
    shortTitle: 'Hora del tentempié',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'tentempie',
    items: [
      {
        id: 'tentempie-deco',
        name: 'Hora del tentempié',
        kind: 'Decoración de avatar',
        decorationId: 'tentempie',
      },
    ],
  },
  {
    id: 'bundle-espectro',
    title: 'Espectro',
    shortTitle: 'Espectro',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'espectro',
    items: [
      {
        id: 'espectro-deco',
        name: 'Espectro',
        kind: 'Decoración de avatar',
        decorationId: 'espectro',
      },
    ],
  },
  {
    id: 'bundle-almas',
    title: 'Almas atrapadas',
    shortTitle: 'Almas atrapadas',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 450,
    priceUsd: '5,49 US$',
    artVariant: 'almas',
    items: [
      {
        id: 'almas-deco',
        name: 'Almas atrapadas',
        kind: 'Decoración de avatar',
        decorationId: 'almas',
      },
    ],
  },
  {
    id: 'bundle-observador',
    title: 'Observador',
    shortTitle: 'Observador',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'observador',
    items: [
      {
        id: 'obs-plate',
        name: 'Observador',
        kind: 'Placa de identificación',
        nameplateId: 'observador',
      },
    ],
  },
  {
    id: 'bundle-plate-acechador',
    title: 'Acechador acuático',
    shortTitle: 'Acechador acuático',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'acechador',
    items: [
      {
        id: 'acechador-solo-plate',
        name: 'Acechador acuático',
        kind: 'Placa de identificación',
        nameplateId: 'acechador',
      },
    ],
  },
  {
    id: 'bundle-plate-almas',
    title: 'Almas atrapadas (Placa)',
    shortTitle: 'Almas atrapadas',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'almas',
    items: [
      {
        id: 'almas-solo-plate',
        name: 'Almas atrapadas',
        kind: 'Placa de identificación',
        nameplateId: 'almas',
      },
    ],
  },
  {
    id: 'bundle-fx-observador',
    title: 'Observador (Efecto)',
    shortTitle: 'Observador',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 500,
    priceUsd: '5,99 US$',
    artVariant: 'observador',
    items: [
      {
        id: 'obs-solo-fx',
        name: 'Observador',
        kind: 'Efecto de perfil',
        profileEffectId: 'observador',
      },
    ],
  },
  {
    id: 'bundle-jugar',
    title: 'Vamos a jugar',
    shortTitle: 'Vamos a jugar',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 500,
    priceUsd: '5,99 US$',
    artVariant: 'jugar',
    items: [
      {
        id: 'jugar-fx',
        name: 'Vamos a jugar',
        kind: 'Efecto de perfil',
        profileEffectId: 'jugar',
      },
    ],
  },
  {
    id: 'bundle-fx-almas',
    title: 'Almas atrapadas (Efecto)',
    shortTitle: 'Almas atrapadas',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 500,
    priceUsd: '5,99 US$',
    artVariant: 'almas',
    items: [
      {
        id: 'almas-solo-fx',
        name: 'Almas atrapadas',
        kind: 'Efecto de perfil',
        profileEffectId: 'almas',
      },
    ],
  },
  {
    id: 'bundle-marco-espectro',
    title: 'Marco Espectro',
    shortTitle: 'Espectro',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'espectro-marco',
    items: [
      {
        id: 'espectro-frame',
        name: 'Espectro',
        kind: 'Marco de perfil',
        profileFrameId: 'espectro',
      },
    ],
  },
  {
    id: 'bundle-marco-observador',
    title: 'Marco Observador',
    shortTitle: 'Observador',
    collectionId: 'night-terrors',
    category: 'horror',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'observador-marco',
    items: [
      {
        id: 'observador-frame',
        name: 'Observador',
        kind: 'Marco de perfil',
        profileFrameId: 'observador',
      },
    ],
  },

  /* ===================================================================== */
  /* DARK FOLKLORE COLLECTION                                              */
  /* ===================================================================== */
  {
    id: 'bundle-hombre-polilla',
    title: 'Lote de Hombre polilla',
    shortTitle: 'Lote de Hombre polilla',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'hombre-polilla',
    items: [
      {
        id: 'mp-deco',
        name: 'Polilla fantasma',
        kind: 'Decoración de avatar',
        decorationId: 'polilla',
      },
      {
        id: 'mp-frame',
        name: 'Ramas desnudas',
        kind: 'Marco de perfil',
        profileFrameId: 'ramas-desnudas',
      },
      {
        id: 'mp-fx',
        name: 'Hombre polilla',
        kind: 'Efecto de perfil',
        profileEffectId: 'hombre-polilla',
      },
      {
        id: 'mp-plate',
        name: 'Polilla fantasma',
        kind: 'Placa de identificación',
        nameplateId: 'polilla',
      },
    ],
  },
  {
    id: 'bundle-jackalope',
    title: 'Lote de Jackalope',
    shortTitle: 'Lote de Jackalope',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'jackalope',
    items: [
      {
        id: 'jk-deco',
        name: 'Flores de luna',
        kind: 'Decoración de avatar',
        decorationId: 'flores-luna',
      },
      {
        id: 'jk-frame',
        name: 'Flores de luna',
        kind: 'Marco de perfil',
        profileFrameId: 'flores-luna',
      },
      {
        id: 'jk-fx',
        name: 'Jackalope',
        kind: 'Efecto de perfil',
        profileEffectId: 'jackalope',
      },
      {
        id: 'jk-plate',
        name: 'Flores de luna',
        kind: 'Placa de identificación',
        nameplateId: 'flores-luna',
      },
    ],
  },
  {
    id: 'bundle-diablo-jersey-lote',
    title: 'Lote de Diablo de Jersey',
    shortTitle: 'Lote de Diablo de Jersey',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'diablo-jersey',
    items: [
      {
        id: 'dj-deco',
        name: 'Cuernos de demonio',
        kind: 'Decoración de avatar',
        decorationId: 'cuernos',
      },
      {
        id: 'dj-frame',
        name: 'Diablo de Jersey',
        kind: 'Marco de perfil',
        profileFrameId: 'diablo-jersey',
      },
      {
        id: 'dj-fx',
        name: 'Diablo de Jersey',
        kind: 'Efecto de perfil',
        profileEffectId: 'diablo-jersey',
      },
      {
        id: 'dj-plate',
        name: 'Diablo de Jersey',
        kind: 'Placa de identificación',
        nameplateId: 'diablo-jersey',
      },
    ],
  },
  {
    id: 'bundle-llorona-lote',
    title: 'Lote de La Llorona',
    shortTitle: 'Lote de La Llorona',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'llorona',
    items: [
      {
        id: 'll-deco',
        name: 'Fuegos fatuos',
        kind: 'Decoración de avatar',
        decorationId: 'fuegos-fatuos',
      },
      {
        id: 'll-plate',
        name: 'Fuegos fatuos',
        kind: 'Placa de identificación',
        nameplateId: 'fuegos-fatuos',
      },
      {
        id: 'll-fx',
        name: 'La Llorona',
        kind: 'Efecto de perfil',
        profileEffectId: 'llorona',
      },
    ],
  },
  {
    id: 'bundle-polilla',
    title: 'Polilla fantasma',
    shortTitle: 'Polilla fantasma',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'polilla',
    items: [
      {
        id: 'polilla-solo-deco',
        name: 'Polilla fantasma',
        kind: 'Decoración de avatar',
        decorationId: 'polilla',
      },
    ],
  },
  {
    id: 'bundle-flores-luna-deco',
    title: 'Flores de luna',
    shortTitle: 'Flores de luna',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 450,
    priceUsd: '5,49 US$',
    artVariant: 'flores-luna',
    items: [
      {
        id: 'fl-solo-deco',
        name: 'Flores de luna',
        kind: 'Decoración de avatar',
        decorationId: 'flores-luna',
      },
    ],
  },
  {
    id: 'bundle-cuernos-demonio',
    title: 'Cuernos de demonio',
    shortTitle: 'Cuernos de demonio',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    artVariant: 'cuernos',
    items: [
      {
        id: 'cuernos-solo-deco',
        name: 'Cuernos de demonio',
        kind: 'Decoración de avatar',
        decorationId: 'cuernos',
      },
    ],
  },
  {
    id: 'bundle-fuegos-fatuos-deco',
    title: 'Fuegos fatuos',
    shortTitle: 'Fuegos fatuos',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    artVariant: 'fuegos-fatuos',
    items: [
      {
        id: 'ff-solo-deco',
        name: 'Fuegos fatuos',
        kind: 'Decoración de avatar',
        decorationId: 'fuegos-fatuos',
      },
    ],
  },
  {
    id: 'bundle-plate-polilla',
    title: 'Polilla fantasma (Placa)',
    shortTitle: 'Polilla fantasma',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'polilla',
    items: [
      {
        id: 'polilla-solo-plate',
        name: 'Polilla fantasma',
        kind: 'Placa de identificación',
        nameplateId: 'polilla',
      },
    ],
  },
  {
    id: 'bundle-plate-flores-luna',
    title: 'Flores de luna (Placa)',
    shortTitle: 'Flores de luna',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'flores-luna',
    items: [
      {
        id: 'fl-solo-plate',
        name: 'Flores de luna',
        kind: 'Placa de identificación',
        nameplateId: 'flores-luna',
      },
    ],
  },
  {
    id: 'bundle-plate-diablo-jersey',
    title: 'Diablo de Jersey (Placa)',
    shortTitle: 'Diablo de Jersey',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'diablo-jersey',
    items: [
      {
        id: 'dj-solo-plate',
        name: 'Diablo de Jersey',
        kind: 'Placa de identificación',
        nameplateId: 'diablo-jersey',
      },
    ],
  },
  {
    id: 'bundle-plate-fuegos-fatuos',
    title: 'Fuegos fatuos (Placa)',
    shortTitle: 'Fuegos fatuos',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'fuegos-fatuos',
    items: [
      {
        id: 'ff-solo-plate',
        name: 'Fuegos fatuos',
        kind: 'Placa de identificación',
        nameplateId: 'fuegos-fatuos',
      },
    ],
  },
  {
    id: 'bundle-fx-hombre-polilla',
    title: 'Hombre polilla (Efecto)',
    shortTitle: 'Hombre polilla',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    artVariant: 'hombre-polilla',
    items: [
      {
        id: 'mp-solo-fx',
        name: 'Hombre polilla',
        kind: 'Efecto de perfil',
        profileEffectId: 'hombre-polilla',
      },
    ],
  },
  {
    id: 'bundle-fx-flores-luna',
    title: 'Flores de luna (Efecto)',
    shortTitle: 'Flores de luna',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    colorSwatches: ['#fef9c3', '#4ade80'],
    artVariant: 'flores-luna',
    items: [
      {
        id: 'fl-solo-fx',
        name: 'Flores de luna',
        kind: 'Efecto de perfil',
        profileEffectId: 'flores-luna',
      },
    ],
  },
  {
    id: 'bundle-fx-diablo-jersey',
    title: 'Diablo de Jersey (Efecto)',
    shortTitle: 'Diablo de Jersey',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    artVariant: 'diablo-jersey',
    items: [
      {
        id: 'dj-solo-fx',
        name: 'Diablo de Jersey',
        kind: 'Efecto de perfil',
        profileEffectId: 'diablo-jersey',
      },
    ],
  },
  {
    id: 'bundle-fx-llorona',
    title: 'La Llorona (Efecto)',
    shortTitle: 'La Llorona',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    artVariant: 'llorona',
    items: [
      {
        id: 'll-solo-fx',
        name: 'La Llorona',
        kind: 'Efecto de perfil',
        profileEffectId: 'llorona',
      },
    ],
  },
  {
    id: 'bundle-marco-ramas-desnudas',
    title: 'Marco Ramas desnudas',
    shortTitle: 'Ramas desnudas',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'ramas-desnudas',
    items: [
      {
        id: 'ramas-solo-frame',
        name: 'Ramas desnudas',
        kind: 'Marco de perfil',
        profileFrameId: 'ramas-desnudas',
      },
    ],
  },
  {
    id: 'bundle-marco-flores-luna',
    title: 'Marco Flores de luna',
    shortTitle: 'Flores de luna',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'flores-luna-marco',
    items: [
      {
        id: 'fl-solo-frame',
        name: 'Flores de luna',
        kind: 'Marco de perfil',
        profileFrameId: 'flores-luna',
      },
    ],
  },
  {
    id: 'bundle-marco-diablo-jersey',
    title: 'Marco Diablo de Jersey',
    shortTitle: 'Diablo de Jersey',
    collectionId: 'dark-folklore',
    category: 'folklore',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'diablo-jersey-marco',
    items: [
      {
        id: 'dj-solo-frame',
        name: 'Diablo de Jersey',
        kind: 'Marco de perfil',
        profileFrameId: 'diablo-jersey',
      },
    ],
  },

  /* ===================================================================== */
  /* DEAD BY DAYLIGHT EXPANDED COLLECTION                                  */
  /* ===================================================================== */
  {
    id: 'bundle-dbd-el-ente-lote',
    title: 'Lote de El Ente',
    shortTitle: 'Lote de El Ente',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'el-ente',
    items: [
      {
        id: 'ente-lote-deco',
        name: 'El Ente',
        kind: 'Decoración de avatar',
        decorationId: 'el-ente',
      },
      {
        id: 'ente-lote-frame',
        name: 'El Ente',
        kind: 'Marco de perfil',
        profileFrameId: 'el-ente',
      },
      {
        id: 'ente-lote-fx',
        name: 'Gancho',
        kind: 'Efecto de perfil',
        profileEffectId: 'gancho',
      },
      {
        id: 'ente-lote-plate',
        name: 'Marcas de arañazos',
        kind: 'Placa de identificación',
        nameplateId: 'marcas-aranazos',
      },
    ],
  },
  {
    id: 'bundle-dbd-luna-oscura-lote',
    title: 'Lote de Luna oscura',
    shortTitle: 'Lote de Luna oscura',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    colorSwatches: ['#e2e8f0', '#ef4444'],
    artVariant: 'luna-oscura',
    items: [
      {
        id: 'lo-lote-deco',
        name: 'Luna oscura',
        kind: 'Decoración de avatar',
        decorationId: 'luna-oscura',
      },
      {
        id: 'lo-lote-frame',
        name: 'Luna oscura',
        kind: 'Marco de perfil',
        profileFrameId: 'luna-oscura',
      },
      {
        id: 'lo-lote-fx',
        name: 'Cuervos de luna oscura',
        kind: 'Efecto de perfil',
        profileEffectId: 'cuervos-luna',
      },
      {
        id: 'lo-lote-plate',
        name: 'Luna oscura',
        kind: 'Placa de identificación',
        nameplateId: 'luna-oscura',
      },
    ],
  },
  {
    id: 'bundle-dbd-red-sangre-lote',
    title: 'Lote de Red de sangre',
    shortTitle: 'Lote de Red de sangre',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'red-sangre',
    items: [
      {
        id: 'rs-lote-deco',
        name: 'Red de sangre',
        kind: 'Decoración de avatar',
        decorationId: 'red-sangre',
      },
      {
        id: 'rs-lote-plate',
        name: 'Red de sangre',
        kind: 'Placa de identificación',
        nameplateId: 'red-sangre',
      },
      {
        id: 'rs-lote-fx',
        name: 'Red de sangre',
        kind: 'Efecto de perfil',
        profileEffectId: 'red-sangre',
      },
    ],
  },
  {
    id: 'bundle-dbd-el-ente',
    title: 'El Ente',
    shortTitle: 'El Ente',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    artVariant: 'el-ente',
    items: [
      {
        id: 'ente-solo-deco',
        name: 'El Ente',
        kind: 'Decoración de avatar',
        decorationId: 'el-ente',
      },
    ],
  },
  {
    id: 'bundle-dbd-luna-oscura',
    title: 'Luna oscura',
    shortTitle: 'Luna oscura',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    colorSwatches: ['#e2e8f0', '#ef4444'],
    artVariant: 'luna-oscura',
    items: [
      {
        id: 'lo-solo-deco',
        name: 'Luna oscura',
        kind: 'Decoración de avatar',
        decorationId: 'luna-oscura',
      },
    ],
  },
  {
    id: 'bundle-dbd-red-sangre',
    title: 'Red de sangre',
    shortTitle: 'Red de sangre',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    artVariant: 'red-sangre',
    items: [
      {
        id: 'rs-solo-deco',
        name: 'Red de sangre',
        kind: 'Decoración de avatar',
        decorationId: 'red-sangre',
      },
    ],
  },
  {
    id: 'bundle-dbd-calabazas',
    title: 'Calabazas del Vacío',
    shortTitle: 'Calabazas del Vacío',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 450,
    priceUsd: '5,49 US$',
    artVariant: 'calabazas',
    items: [
      {
        id: 'calabazas-solo-deco',
        name: 'Calabazas del Vacío',
        kind: 'Decoración de avatar',
        decorationId: 'calabazas',
      },
    ],
  },
  {
    id: 'bundle-dbd-marcas-aranazos',
    title: 'Marcas de arañazos',
    shortTitle: 'Marcas de arañazos',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    colorSwatches: ['#ef4444', '#38bdf8', '#d946ef'],
    artVariant: 'marcas-aranazos',
    items: [
      {
        id: 'ma-solo-plate',
        name: 'Marcas de arañazos',
        kind: 'Placa de identificación',
        nameplateId: 'marcas-aranazos',
      },
    ],
  },
  {
    id: 'bundle-dbd-plate-luna-oscura',
    title: 'Luna oscura (Placa)',
    shortTitle: 'Luna oscura',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    colorSwatches: ['#e2e8f0', '#ef4444'],
    artVariant: 'luna-oscura',
    items: [
      {
        id: 'lo-solo-plate',
        name: 'Luna oscura',
        kind: 'Placa de identificación',
        nameplateId: 'luna-oscura',
      },
    ],
  },
  {
    id: 'bundle-dbd-plate-red-sangre',
    title: 'Red de sangre (Placa)',
    shortTitle: 'Red de sangre',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'red-sangre',
    items: [
      {
        id: 'rs-solo-plate',
        name: 'Red de sangre',
        kind: 'Placa de identificación',
        nameplateId: 'red-sangre',
      },
    ],
  },
  {
    id: 'bundle-dbd-fx-gancho',
    title: 'Gancho',
    shortTitle: 'Gancho',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    artVariant: 'gancho',
    items: [
      {
        id: 'gancho-solo-fx',
        name: 'Gancho',
        kind: 'Efecto de perfil',
        profileEffectId: 'gancho',
      },
    ],
  },
  {
    id: 'bundle-dbd-fx-cuervos',
    title: 'Cuervos de luna oscura',
    shortTitle: 'Cuervos de luna oscura',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    colorSwatches: ['#e2e8f0', '#ef4444'],
    artVariant: 'cuervos-luna',
    items: [
      {
        id: 'cuervos-solo-fx',
        name: 'Cuervos de luna oscura',
        kind: 'Efecto de perfil',
        profileEffectId: 'cuervos-luna',
      },
    ],
  },
  {
    id: 'bundle-dbd-fx-red-sangre',
    title: 'Red de sangre (Efecto)',
    shortTitle: 'Red de sangre',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 520,
    priceUsd: '6,49 US$',
    artVariant: 'red-sangre',
    items: [
      {
        id: 'rs-solo-fx',
        name: 'Red de sangre',
        kind: 'Efecto de perfil',
        profileEffectId: 'red-sangre',
      },
    ],
  },
  {
    id: 'bundle-dbd-marco-el-ente',
    title: 'Marco El Ente',
    shortTitle: 'El Ente',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    artVariant: 'el-ente-marco',
    items: [
      {
        id: 'ente-solo-frame',
        name: 'El Ente',
        kind: 'Marco de perfil',
        profileFrameId: 'el-ente',
      },
    ],
  },
  {
    id: 'bundle-dbd-marco-luna-oscura',
    title: 'Marco Luna oscura',
    shortTitle: 'Luna oscura',
    collectionId: 'dbd',
    category: 'dbd',
    priceOrbs: 480,
    priceUsd: '5,99 US$',
    colorSwatches: ['#e2e8f0', '#ef4444'],
    artVariant: 'luna-oscura-marco',
    items: [
      {
        id: 'lo-solo-frame',
        name: 'Luna oscura',
        kind: 'Marco de perfil',
        profileFrameId: 'luna-oscura',
      },
    ],
  },

  /* ===================================================================== */
  /* STARDUST & LUCES COLLECTION                                           */
  /* ===================================================================== */
  {
    id: 'bundle-hazlo-brillante',
    title: 'Lote de ¡Hazlo brillante!',
    shortTitle: 'Lote de ¡Hazlo brillante!',
    collectionId: 'stardust',
    category: 'estilo',
    priceOrbs: 680,
    priceUsd: '8,49 US$',
    artVariant: 'hazlo-brillante',
    items: [
      {
        id: 'hb-deco',
        name: '¡Luces, cámara...!',
        kind: 'Decoración de avatar',
        decorationId: 'luces-camara',
      },
      {
        id: 'hb-plate',
        name: 'Estela Dorada',
        kind: 'Placa de identificación',
        nameplateId: 'rama',
      },
      {
        id: 'hb-fx',
        name: 'Chispas Neón',
        kind: 'Efecto de perfil',
        profileEffectId: 'sparks',
      },
    ],
  },
  {
    id: 'bundle-onda-cosmica',
    title: 'Lote de ¡Onda cósmica!',
    shortTitle: 'Lote de ¡Onda cósmica!',
    collectionId: 'stardust',
    category: 'estilo',
    priceOrbs: 680,
    priceUsd: '8,49 US$',
    artVariant: 'onda-cosmica',
    items: [
      {
        id: 'oc-deco',
        name: 'Onda cósmica',
        kind: 'Decoración de avatar',
        decorationId: 'onda-cosmica',
      },
      {
        id: 'oc-plate',
        name: 'Nebulosa Esmeralda',
        kind: 'Placa de identificación',
        nameplateId: 'fuegos-fatuos',
      },
      {
        id: 'oc-fx',
        name: 'Lluvia Cibernética',
        kind: 'Efecto de perfil',
        profileEffectId: 'cyber',
      },
    ],
  },
  {
    id: 'bundle-luces-camara',
    title: '¡Luces, cámara...!',
    shortTitle: '¡Luces, cámara...!',
    collectionId: 'stardust',
    category: 'estilo',
    priceOrbs: 380,
    priceUsd: '4,49 US$',
    artVariant: 'luces-camara',
    items: [
      {
        id: 'lc-solo-deco',
        name: '¡Luces, cámara...!',
        kind: 'Decoración de avatar',
        decorationId: 'luces-camara',
      },
    ],
  },

  /* ===================================================================== */
  /* NAMEPLATE BONANZA! COLLECTION                                         */
  /* ===================================================================== */
  {
    id: 'bundle-conejito-fresero',
    title: 'Conejito fresero',
    shortTitle: 'Conejito fresero',
    collectionId: 'nameplate-bonanza',
    category: 'bonanza',
    priceOrbs: 360,
    priceUsd: '4,49 US$',
    artVariant: 'conejito-fresero',
    items: [
      {
        id: 'cf-plate',
        name: 'Conejito fresero',
        kind: 'Placa de identificación',
        nameplateId: 'conejito-fresero',
      },
    ],
  },
  {
    id: 'bundle-plate-el-mismo-pato',
    title: 'El mismo pato',
    shortTitle: 'El mismo pato',
    collectionId: 'nameplate-bonanza',
    category: 'bonanza',
    priceOrbs: 360,
    priceUsd: '4,49 US$',
    artVariant: 'pato',
    items: [
      {
        id: 'emp-plate',
        name: 'El mismo pato',
        kind: 'Placa de identificación',
        nameplateId: 'el-mismo-pato',
      },
    ],
  },
  {
    id: 'bundle-marea-lluvia',
    title: 'Marea de lluvia',
    shortTitle: 'Marea de lluvia',
    collectionId: 'nameplate-bonanza',
    category: 'bonanza',
    priceOrbs: 360,
    priceUsd: '4,49 US$',
    artVariant: 'marea-lluvia',
    items: [
      {
        id: 'mll-plate',
        name: 'Marea de lluvia',
        kind: 'Placa de identificación',
        nameplateId: 'marea-lluvia',
      },
    ],
  },

  /* ===================================================================== */
  /* BORDERLANDS 4 COLLECTION                                              */
  /* ===================================================================== */
  {
    id: 'bundle-mas-alla-boveda',
    title: 'Lote Más allá de la Cámara',
    shortTitle: 'Lote Más allá de la Cámara',
    collectionId: 'borderlands',
    category: 'borderlands',
    priceOrbs: 720,
    priceUsd: '8,99 US$',
    artVariant: 'mas-alla-boveda',
    items: [
      {
        id: 'bl-boveda-deco',
        name: 'Sello de la Cámara',
        kind: 'Decoración de avatar',
        decorationId: 'boveda',
      },
      {
        id: 'bl-boveda-fx',
        name: 'Portal de Kairos',
        kind: 'Efecto de perfil',
        profileEffectId: 'boveda',
      },
    ],
  },
  {
    id: 'bundle-saqueo-arcoiris',
    title: 'Lote Saqueo arcoíris',
    shortTitle: 'Lote Saqueo arcoíris',
    collectionId: 'borderlands',
    category: 'borderlands',
    priceOrbs: 720,
    priceUsd: '8,99 US$',
    artVariant: 'saqueo-arcoiris',
    items: [
      {
        id: 'bl-saqueo-deco',
        name: 'Aura Legendaria',
        kind: 'Decoración de avatar',
        decorationId: 'saqueo',
      },
      {
        id: 'bl-saqueo-fx',
        name: 'Botín Eridiano',
        kind: 'Efecto de perfil',
        profileEffectId: 'saqueo',
      },
    ],
  },
  {
    id: 'bundle-claptrap',
    title: '¡Estoy bailando!',
    shortTitle: '¡Estoy bailando!',
    collectionId: 'borderlands',
    category: 'borderlands',
    priceOrbs: 420,
    priceUsd: '4,99 US$',
    artVariant: 'claptrap',
    items: [
      {
        id: 'bl-claptrap-deco',
        name: '¡Estoy bailando! · Claptrap',
        kind: 'Decoración de avatar',
        decorationId: 'claptrap',
      },
    ],
  },

  /* ===================================================================== */
  /* CELESTIAL & NOCTURNO COLLECTION                                       */
  /* ===================================================================== */
  {
    id: 'bundle-luna-mistica',
    title: 'Lote de Luna mística',
    shortTitle: 'Lote de Luna mística',
    collectionId: 'celestial',
    category: 'celestial',
    priceOrbs: 650,
    priceUsd: '7,99 US$',
    artVariant: 'luna-mistica',
    items: [
      {
        id: 'lm-deco',
        name: 'Luna mística',
        kind: 'Decoración de avatar',
        decorationId: 'luna-mistica',
      },
      {
        id: 'lm-fx',
        name: 'Constelación nocturna',
        kind: 'Efecto de perfil',
        profileEffectId: 'luna-mistica',
      },
    ],
  },
  {
    id: 'bundle-estrella-nocturna',
    title: 'Lote de Estrella nocturna',
    shortTitle: 'Lote de Estrella nocturna',
    collectionId: 'celestial',
    category: 'celestial',
    priceOrbs: 650,
    priceUsd: '7,99 US$',
    artVariant: 'estrella-nocturna',
    items: [
      {
        id: 'en-deco',
        name: 'Estrella nocturna',
        kind: 'Decoración de avatar',
        decorationId: 'estrella-nocturna',
      },
      {
        id: 'en-fx',
        name: 'Destello estelar',
        kind: 'Efecto de perfil',
        profileEffectId: 'sparks',
      },
    ],
  },
  {
    id: 'bundle-flores-lunares',
    title: 'Flores lunares',
    shortTitle: 'Flores lunares',
    collectionId: 'celestial',
    category: 'celestial',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'flores-lunares',
    items: [
      {
        id: 'flun-deco',
        name: 'Flores lunares',
        kind: 'Decoración de avatar',
        decorationId: 'flores-lunares',
      },
    ],
  },

  /* ===================================================================== */
  /* SECRET GARDEN COLLECTION                                              */
  /* ===================================================================== */
  {
    id: 'bundle-trebol',
    title: 'Lote de Trébol de la suerte',
    shortTitle: 'Lote de Trébol de la suerte',
    collectionId: 'secret-garden',
    category: 'garden',
    priceOrbs: 620,
    priceUsd: '7,99 US$',
    artVariant: 'trebol',
    items: [
      {
        id: 'tr-deco',
        name: 'Trébol de la suerte',
        kind: 'Decoración de avatar',
        decorationId: 'trebol',
      },
      {
        id: 'tr-fx',
        name: 'Rocío prismático',
        kind: 'Efecto de perfil',
        profileEffectId: 'trebol',
      },
    ],
  },
  {
    id: 'bundle-jardin-secreto',
    title: 'Lote de Jardín secreto',
    shortTitle: 'Lote de Jardín secreto',
    collectionId: 'secret-garden',
    category: 'garden',
    priceOrbs: 620,
    priceUsd: '7,99 US$',
    artVariant: 'jardin-secreto',
    items: [
      {
        id: 'js-deco',
        name: 'Jardín secreto',
        kind: 'Decoración de avatar',
        decorationId: 'jardin-secreto',
      },
      {
        id: 'js-fx',
        name: 'Brisa del estanque',
        kind: 'Efecto de perfil',
        profileEffectId: 'jardin-secreto',
      },
    ],
  },
  {
    id: 'bundle-lirio',
    title: 'Lote de Lirio del valle',
    shortTitle: 'Lote de Lirio del valle',
    collectionId: 'secret-garden',
    category: 'garden',
    priceOrbs: 620,
    priceUsd: '7,99 US$',
    artVariant: 'lirio',
    items: [
      {
        id: 'lv-deco',
        name: 'Lirio del valle',
        kind: 'Decoración de avatar',
        decorationId: 'lirio',
      },
      {
        id: 'lv-plate',
        name: 'Estanque sereno',
        kind: 'Placa de identificación',
        nameplateId: 'jardin-secreto',
      },
    ],
  },

  /* ===================================================================== */
  /* RAWR XD COLLECTION                                                    */
  /* ===================================================================== */
  {
    id: 'bundle-adorable',
    title: 'Lote Adorable',
    shortTitle: 'Lote Adorable',
    collectionId: 'rawr-xd',
    category: 'rawr',
    priceOrbs: 640,
    priceUsd: '7,99 US$',
    artVariant: 'adorable',
    items: [
      {
        id: 'ad-deco',
        name: 'Gatitos Rawr xD',
        kind: 'Decoración de avatar',
        decorationId: 'adorable',
      },
      {
        id: 'ad-fx',
        name: 'Corazones Pixel',
        kind: 'Efecto de perfil',
        profileEffectId: 'adorable',
      },
    ],
  },
  {
    id: 'bundle-random-xd',
    title: 'Lote jeje qué random',
    shortTitle: 'Lote jeje qué random',
    collectionId: 'rawr-xd',
    category: 'rawr',
    priceOrbs: 640,
    priceUsd: '7,99 US$',
    artVariant: 'random-xd',
    items: [
      {
        id: 'rx-deco',
        name: 'Calaveras Scene',
        kind: 'Decoración de avatar',
        decorationId: 'random-xd',
      },
      {
        id: 'rx-plate',
        name: 'Tablero Punk',
        kind: 'Placa de identificación',
        nameplateId: 'marcas-aranazos',
      },
    ],
  },
  {
    id: 'bundle-scene-xd',
    title: 'Lote Scene',
    shortTitle: 'Lote Scene',
    collectionId: 'rawr-xd',
    category: 'rawr',
    priceOrbs: 640,
    priceUsd: '7,99 US$',
    artVariant: 'scene-xd',
    items: [
      {
        id: 'sx-deco',
        name: 'RAWR! xD Neón',
        kind: 'Decoración de avatar',
        decorationId: 'scene-xd',
      },
      {
        id: 'sx-fx',
        name: 'Grafiti 2008',
        kind: 'Efecto de perfil',
        profileEffectId: 'scene-xd',
      },
    ],
  },

  /* ===================================================================== */
  /* SIGNATURE & CLASSIC FAVORITES                                         */
  /* ===================================================================== */
  {
    id: 'bundle-pato',
    title: 'el mismo pato',
    shortTitle: 'el mismo pato',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 350,
    priceUsd: '4,99 US$',
    artVariant: 'pato',
    items: [
      {
        id: 'pato-deco',
        name: 'el mismo pato',
        kind: 'Decoración de avatar',
        decorationId: 'pato',
      },
    ],
  },
  {
    id: 'bundle-rama',
    title: 'Rama en flor',
    shortTitle: 'Rama en flor',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 400,
    priceUsd: '4,99 US$',
    artVariant: 'rama',
    items: [
      {
        id: 'rama-plate',
        name: 'Rama en flor',
        kind: 'Placa de identificación',
        nameplateId: 'rama',
      },
    ],
  },
  {
    id: 'bundle-vader',
    title: 'Darth Vader',
    shortTitle: 'Darth Vader',
    category: 'estilo',
    priceOrbs: 550,
    priceUsd: '6,99 US$',
    artVariant: 'vader',
    items: [
      {
        id: 'vader-plate',
        name: 'Darth Vader',
        kind: 'Placa de identificación',
        nameplateId: 'vader',
      },
    ],
  },
  {
    id: 'bundle-condenacion',
    title: 'Condenación eterna',
    shortTitle: 'Condenación eterna',
    category: 'horror',
    priceOrbs: 450,
    priceUsd: '5,49 US$',
    colorSwatches: ['#22d3ee', '#fb7185'],
    artVariant: 'condenacion',
    items: [
      {
        id: 'condenacion-plate',
        name: 'Condenación eterna',
        kind: 'Placa de identificación',
        nameplateId: 'condenacion',
      },
    ],
  },
  {
    id: 'bundle-cerbero',
    title: 'Lote de Cerbero',
    shortTitle: 'Lote de Cerbero',
    category: 'fantasia',
    priceOrbs: 800,
    priceUsd: '10,99 US$',
    artVariant: 'cerbero',
    items: [
      {
        id: 'cerbero-deco',
        name: 'Llama de Cerbero',
        kind: 'Decoración de avatar',
        decorationId: 'cerbero',
      },
      {
        id: 'cerbero-plate',
        name: 'Colmillo Infernal',
        kind: 'Placa de identificación',
        nameplateId: 'cerbero',
      },
      {
        id: 'cerbero-fx',
        name: 'Guardián del Inframundo',
        kind: 'Efecto de perfil',
        profileEffectId: 'cerbero',
      },
      {
        id: 'cerbero-banner',
        name: 'Fauces de Cerbero',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_cerbero_art_1795286601612.jpg',
      },
    ],
  },
  {
    id: 'bundle-llama',
    title: 'Llama infernal',
    shortTitle: 'Llama infernal',
    category: 'fantasia',
    priceOrbs: 450,
    priceUsd: '5,99 US$',
    artVariant: 'llama',
    items: [
      {
        id: 'llama-deco',
        name: 'Llama infernal',
        kind: 'Decoración de avatar',
        decorationId: 'llama',
      },
    ],
  },
  {
    id: 'bundle-gojo',
    title: 'Lote de Satoru Gojo',
    shortTitle: 'Satoru Gojo',
    collectionId: 'anime',
    category: 'anime',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'gojo',
    items: [
      {
        id: 'gojo-deco',
        name: 'Infinito · Satoru Gojo',
        kind: 'Decoración de avatar',
        decorationId: 'gojo',
      },
      {
        id: 'gojo-plate',
        name: 'Seis Ojos',
        kind: 'Placa de identificación',
        nameplateId: 'gojo',
      },
      {
        id: 'gojo-fx',
        name: 'Vacío Púrpura',
        kind: 'Efecto de perfil',
        profileEffectId: 'gojo',
      },
      {
        id: 'gojo-banner',
        name: 'Seis Ojos · Infinito',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_gojo_art_1795286602337.jpg',
      },
    ],
  },
  {
    id: 'bundle-orejas',
    title: 'Orejas de gato',
    shortTitle: 'Orejas de gato',
    collectionId: 'lofi',
    category: 'lofi',
    priceOrbs: 350,
    priceUsd: '4,99 US$',
    colorSwatches: ['#18181b', '#f9a8d4', '#f5f5f4', '#fde047', '#86efac'],
    hasExtraSwatches: true,
    artVariant: 'orejas',
    items: [
      {
        id: 'orejas-deco',
        name: 'Orejas de gato',
        kind: 'Decoración de avatar',
        decorationId: 'orejas',
      },
    ],
  },
  {
    id: 'bundle-grabado',
    title: 'Lote de Grabado japonés',
    shortTitle: 'Grabado japonés',
    collectionId: 'anime',
    category: 'estilo',
    priceOrbs: 600,
    priceUsd: '7,99 US$',
    artVariant: 'grabado',
    items: [
      {
        id: 'grabado-deco',
        name: 'Trazo Sumi-e',
        kind: 'Decoración de avatar',
        decorationId: 'grabado',
      },
      {
        id: 'grabado-fx',
        name: 'Montaña Torii',
        kind: 'Efecto de perfil',
        profileEffectId: 'grabado',
      },
      {
        id: 'grabado-banner',
        name: 'Sumi-e Imperial',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_grabado_japones_1795286602758.jpg',
      },
    ],
  },
  {
    id: 'bundle-sukuna',
    title: 'Lote de Ryomen Sukuna',
    shortTitle: 'Ryomen Sukuna',
    collectionId: 'anime',
    category: 'anime',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    artVariant: 'sukuna',
    items: [
      {
        id: 'sukuna-deco',
        name: 'Santuario Malévolo',
        kind: 'Decoración de avatar',
        decorationId: 'sukuna',
      },
      {
        id: 'sukuna-plate',
        name: 'Rey de las Maldiciones',
        kind: 'Placa de identificación',
        nameplateId: 'sukuna',
      },
      {
        id: 'sukuna-fx',
        name: 'Fuga · Llamas Carmesí',
        kind: 'Efecto de perfil',
        profileEffectId: 'sukuna',
      },
      {
        id: 'sukuna-banner',
        name: 'Relicario Demoníaco',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_sukuna_art_1795286601954.jpg',
      },
    ],
  },
  {
    id: 'bundle-lobo',
    title: 'Lote de Lobo y Luna',
    shortTitle: 'Lobo y Luna',
    category: 'fantasia',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    artVariant: 'lobo',
    items: [
      {
        id: 'lobo-deco',
        name: 'Luna Creciente',
        kind: 'Decoración de avatar',
        decorationId: 'lobo',
      },
      {
        id: 'lobo-plate',
        name: 'Mirada Lupina',
        kind: 'Placa de identificación',
        nameplateId: 'lobo',
      },
      {
        id: 'lobo-fx',
        name: 'Aullido Nocturno',
        kind: 'Efecto de perfil',
        profileEffectId: 'lobo',
      },
      {
        id: 'lobo-banner',
        name: 'Luna de Medianoche',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_lobo_luna_1795286603884.jpg',
      },
    ],
  },
  {
    id: 'bundle-yuji',
    title: 'Lote de Yuji Itadori',
    shortTitle: 'Yuji Itadori',
    collectionId: 'anime',
    category: 'anime',
    priceOrbs: 800,
    priceUsd: '10,99 US$',
    artVariant: 'yuji',
    items: [
      {
        id: 'yuji-deco',
        name: 'Bufanda Jujutsu',
        kind: 'Decoración de avatar',
        decorationId: 'yuji',
      },
      {
        id: 'yuji-plate',
        name: 'Destello Negro',
        kind: 'Placa de identificación',
        nameplateId: 'yuji',
      },
      {
        id: 'yuji-fx',
        name: 'Energía Maldita',
        kind: 'Efecto de perfil',
        profileEffectId: 'yuji',
      },
      {
        id: 'yuji-banner',
        name: 'Impacto Destello Negro',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/shop_yuji_art_1795286603030.jpg',
      },
    ],
  },
  {
    id: 'bundle-banner-dune',
    title: 'Banner Dune: Arrakis',
    shortTitle: 'Banner Arrakis',
    collectionId: 'banners',
    category: 'banners',
    priceOrbs: 300,
    priceUsd: '3,99 US$',
    artVariant: 'dune',
    items: [
      {
        id: 'dune-banner',
        name: 'Horizonte de Arrakis',
        kind: 'Banner de perfil',
        bannerUrl: '/src/assets/images/banner_dune_1795280073636.jpg',
      },
    ],
  },
  {
    id: 'bundle-marco-lavanda',
    title: 'Marco Lavanda Primordial',
    shortTitle: 'Marco Lavanda',
    category: 'personalizacion',
    priceOrbs: 60,
    priceUsd: '0,99 US$',
    colorSwatches: ['#a855f7', '#e9d5ff'],
    artVariant: 'marco-lavanda',
    items: [
      {
        id: 'item-marco-lavanda',
        name: 'Marco Lavanda Cristal',
        kind: 'Marco de perfil',
        profileFrameId: 'lavanda',
      },
    ],
  },
  {
    id: 'bundle-tema-cyber',
    title: 'Tema Cyber Neón',
    shortTitle: 'Tema Cyber',
    category: 'personalizacion',
    priceOrbs: 120,
    priceUsd: '1,99 US$',
    colorSwatches: ['#06b6d4', '#08101c'],
    artVariant: 'tema-cyber',
    items: [
      {
        id: 'item-tema-cyber',
        name: 'Interfaz Cyber Neón',
        kind: 'Tema de interfaz',
        uiThemeId: 'cyber',
      },
    ],
  },
  {
    id: 'bundle-tema-emerald',
    title: 'Tema Esmeralda Botánica',
    shortTitle: 'Tema Esmeralda',
    category: 'personalizacion',
    priceOrbs: 120,
    priceUsd: '1,99 US$',
    colorSwatches: ['#10b981', '#0a1611'],
    artVariant: 'tema-emerald',
    items: [
      {
        id: 'item-tema-emerald',
        name: 'Interfaz Esmeralda',
        kind: 'Tema de interfaz',
        uiThemeId: 'emerald',
      },
    ],
  },
  {
    id: 'bundle-tema-crimson',
    title: 'Tema Carmesí Nocturno',
    shortTitle: 'Tema Carmesí',
    category: 'personalizacion',
    priceOrbs: 140,
    priceUsd: '2,49 US$',
    colorSwatches: ['#e11d48', '#160a0e'],
    artVariant: 'tema-crimson',
    items: [
      {
        id: 'item-tema-crimson',
        name: 'Interfaz Carmesí Nocturno',
        kind: 'Tema de interfaz',
        uiThemeId: 'crimson',
      },
    ],
  },
  {
    id: 'bundle-voz-arcade',
    title: 'Entrada de Voz: Arcade',
    shortTitle: 'Voz Arcade',
    category: 'personalizacion',
    priceOrbs: 80,
    priceUsd: '0,99 US$',
    colorSwatches: ['#f59e0b', '#fef08a'],
    artVariant: 'voz-arcade',
    items: [
      {
        id: 'item-voz-arcade',
        name: 'Chime Arcade Retro',
        kind: 'Efecto de entrada de voz',
        voiceEntryEffectId: 'arcade-chime',
      },
    ],
  },
  {
    id: 'bundle-voz-warp',
    title: 'Entrada de Voz: Cyber Warp',
    shortTitle: 'Cyber Warp',
    category: 'personalizacion',
    priceOrbs: 110,
    priceUsd: '1,49 US$',
    colorSwatches: ['#06b6d4', '#38bdf8'],
    artVariant: 'voz-warp',
    items: [
      {
        id: 'item-voz-warp',
        name: 'Destello Cyber Warp',
        kind: 'Efecto de entrada de voz',
        voiceEntryEffectId: 'cyber-warp',
      },
    ],
  },
  {
    id: 'bundle-voz-aurora',
    title: 'Entrada de Voz: Aurora Bloom',
    shortTitle: 'Aurora Bloom',
    category: 'personalizacion',
    priceOrbs: 110,
    priceUsd: '1,49 US$',
    colorSwatches: ['#a855f7', '#e9d5ff'],
    artVariant: 'voz-aurora',
    items: [
      {
        id: 'item-voz-aurora',
        name: 'Acorde Aurora Bloom',
        kind: 'Efecto de entrada de voz',
        voiceEntryEffectId: 'aurora-bloom',
      },
    ],
  },
  {
    id: 'bundle-voz-bass',
    title: 'Entrada de Voz: Impacto Bass',
    shortTitle: 'Impacto Bass',
    category: 'personalizacion',
    priceOrbs: 130,
    priceUsd: '1,99 US$',
    colorSwatches: ['#ef4444', '#18181b'],
    artVariant: 'voz-bass',
    items: [
      {
        id: 'item-voz-bass',
        name: 'Pulso Impacto Bass',
        kind: 'Efecto de entrada de voz',
        voiceEntryEffectId: 'bass-drop',
      },
    ],
  },
  {
    id: 'bundle-insignia-pionero',
    title: 'Insignia Exclusiva: Pionero',
    shortTitle: 'Insignia Pionero',
    category: 'personalizacion',
    priceOrbs: 180,
    priceUsd: '2,99 US$',
    colorSwatches: ['#a855f7', '#38bdf8'],
    artVariant: 'insignia-pionero',
    items: [
      {
        id: 'item-insignia-pionero',
        name: 'Emblema Pionero Primordial',
        kind: 'Insignia exclusiva',
        exclusiveBadgeId: 'pionero',
      },
    ],
  },

  /* ===================================================================== */
  /* DARK MODE FRIDAY COLLECTION                                           */
  /* ===================================================================== */
  {
    id: 'bundle-rabia-dark-mode',
    title: 'Lote de Rabia Dark Mode',
    shortTitle: 'Lote de Rabia Dark Mode',
    collectionId: 'dark-mode-friday',
    category: 'horror',
    priceOrbs: 850,
    priceUsd: '11,99 US$',
    colorSwatches: ['#18181b', '#f4f4f5', '#ec4899'],
    artVariant: 'rabia-bunny',
    items: [
      {
        id: 'rabia-deco',
        name: 'Rabia Dark Mode',
        kind: 'Decoración de avatar',
        decorationId: 'rabia-bunny',
      },
      {
        id: 'rabia-frame',
        name: 'Marco Rabia Dark Mode',
        kind: 'Marco de perfil',
        profileFrameId: 'rabia-bunny',
      },
      {
        id: 'rabia-fx',
        name: 'Dark Mode Friday',
        kind: 'Efecto de perfil',
        profileEffectId: 'rabia-bunny',
      },
      {
        id: 'rabia-plate',
        name: 'Corazón Dark Mode',
        kind: 'Placa de identificación',
        nameplateId: 'rabia-bunny',
      },
    ],
  },
  {
    id: 'bundle-no-me-sueltes',
    title: 'Lote de No me sueltes',
    shortTitle: 'Lote de No me sueltes',
    collectionId: 'dark-mode-friday',
    category: 'horror',
    priceOrbs: 750,
    priceUsd: '9,99 US$',
    colorSwatches: ['#e4e4e7', '#18181b', '#a855f7'],
    artVariant: 'garras-abisales',
    items: [
      {
        id: 'no-me-sueltes-deco',
        name: 'Garras abisales',
        kind: 'Decoración de avatar',
        decorationId: 'garras-abisales',
      },
      {
        id: 'no-me-sueltes-plate',
        name: 'Abrazo sombrío',
        kind: 'Placa de identificación',
        nameplateId: 'garras-abisales',
      },
      {
        id: 'no-me-sueltes-fx',
        name: 'No me sueltes',
        kind: 'Efecto de perfil',
        profileEffectId: 'garras-abisales',
      },
    ],
  },
  {
    id: 'bundle-zorro-aurora-noir',
    title: 'Zorro de la aurora (noir)',
    shortTitle: 'Zorro de la aurora (noir)',
    collectionId: 'dark-mode-friday',
    category: 'horror',
    priceOrbs: 450,
    priceUsd: '5,99 US$',
    colorSwatches: ['#f4f4f5', '#71717a', '#38bdf8'],
    artVariant: 'zorro-aurora-noir',
    items: [
      {
        id: 'zorro-aurora-noir-deco',
        name: 'Zorro de la aurora (noir)',
        kind: 'Decoración de avatar',
        decorationId: 'zorro-aurora-noir',
      },
    ],
  },
  {
    id: 'bundle-no-te-quito-ojo',
    title: 'Lote de No te quito ojo',
    shortTitle: 'Lote de No te quito ojo',
    collectionId: 'dark-mode-friday',
    category: 'horror',
    priceOrbs: 650,
    priceUsd: '8,49 US$',
    colorSwatches: ['#f4f4f5', '#09090b', '#71717a'],
    artVariant: 'no-te-quito-ojo',
    items: [
      {
        id: 'no-te-quito-ojo-deco',
        name: 'No te quito ojo',
        kind: 'Decoración de avatar',
        decorationId: 'no-te-quito-ojo',
      },
      {
        id: 'no-te-quito-ojo-plate',
        name: 'No te quito ojo',
        kind: 'Placa de identificación',
        nameplateId: 'no-te-quito-ojo',
      },
    ],
  },
  {
    id: 'bundle-nunca-mas',
    title: 'Lote de Nunca más',
    shortTitle: 'Lote de Nunca más',
    collectionId: 'dark-mode-friday',
    category: 'horror',
    priceOrbs: 950,
    priceUsd: '12,99 US$',
    colorSwatches: ['#8b5cf6', '#e4e4e7', '#312e81'],
    artVariant: 'angel-caido',
    items: [
      {
        id: 'nunca-mas-deco',
        name: 'Ángel caído (sombranoche)',
        kind: 'Decoración de avatar',
        decorationId: 'angel-caido',
      },
      {
        id: 'nunca-mas-plate',
        name: 'Alas sombranoche',
        kind: 'Placa de identificación',
        nameplateId: 'angel-caido',
      },
      {
        id: 'nunca-mas-fx',
        name: 'Nunca más',
        kind: 'Efecto de perfil',
        profileEffectId: 'nunca-mas',
      },
    ],
  },
];

const applyShopPriceIncrease = (priceOrbs: number, priceUsd: string, factor = 1.24) => {
  const nextOrbs = Math.round(priceOrbs * factor);
  const numericUsd = parseFloat(priceUsd.replace(/[^\d.,]/g, '').replace(',', '.'));
  const nextUsd = Number.isFinite(numericUsd)
    ? `${(Math.round(numericUsd * factor * 100) / 100).toFixed(2).replace('.', ',')} US$`
    : priceUsd;
  return { priceOrbs: nextOrbs, priceUsd: nextUsd };
};

export const INITIAL_SHOP_BUNDLES: ShopBundle[] = BASE_SHOP_BUNDLES.map((bundle) => ({
  ...bundle,
  ...applyShopPriceIncrease(bundle.priceOrbs, bundle.priceUsd, 1.24),
}));

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'hypesquad',
    title: 'ESPADA DE AVENTURERO',
    shortTitle: 'HypeSquad',
    description: 'Participaste en eventos oficiales y misiones destacadas de Discord.',
    hasNotificationDot: true,
    tiers: [
      { id: 'hs-1', name: 'Aventurero', requirementLabel: 'Desbloqueada', threshold: 1, color: '#38bdf8' },
    ],
  },
  {
    id: 'misiones',
    title: 'MISIONES COMPLETADAS',
    shortTitle: 'Misiones',
    description: 'Completa Misiones de Discord para conseguir Orbs y esta insignia exclusiva.',
    tiers: [
      { id: 'mis-1', name: 'Explorador de Misiones', requirementLabel: '1 misión', threshold: 1, color: '#818cf8' },
    ],
  },
  {
    id: 'nitro',
    title: 'DISCORD NITRO',
    shortTitle: 'Nitro',
    description: 'Suscríbete a Discord Nitro para desbloquear y hacer evolucionar esta insignia con tu racha.',
    ctaLabel: 'Obtener Nitro',
    tiers: [
      { id: 'ni-1', name: '1 mes', requirementLabel: '1 mes', threshold: 1, color: '#a855f7' },
      { id: 'ni-2', name: '3 meses', requirementLabel: '3 meses', threshold: 3, color: '#ec4899' },
      { id: 'ni-3', name: '6 meses', requirementLabel: '6 meses', threshold: 6, color: '#f43f5e' },
      { id: 'ni-4', name: '1 año', requirementLabel: '1 año', threshold: 12, color: '#f59e0b' },
    ],
  },
  {
    id: 'mejora',
    title: 'MEJORA DEL SERVIDOR',
    shortTitle: 'Mejora del servidor',
    description: 'Boost 1 server to unlock this badge.',
    ctaLabel: 'Mejorar un servidor',
    tiers: [
      { id: 'mj-1', name: '1 mes', requirementLabel: '1 mes', threshold: 1, color: '#f472b6' },
      { id: 'mj-2', name: '2 meses', requirementLabel: '2 meses', threshold: 2, color: '#f472b6' },
      { id: 'mj-3', name: '3 meses', requirementLabel: '3 meses', threshold: 3, color: '#ec4899' },
      { id: 'mj-4', name: '6 meses', requirementLabel: '6 meses', threshold: 6, color: '#e879f9' },
      { id: 'mj-5', name: '9 meses', requirementLabel: '9 meses', threshold: 9, color: '#d946ef' },
      { id: 'mj-6', name: '12 meses', requirementLabel: '12 meses', threshold: 12, color: '#f472b6', accent: '#fde047' },
      { id: 'mj-7', name: '15 meses', requirementLabel: '15 meses', threshold: 15, color: '#e879f9', accent: '#fde047' },
      { id: 'mj-8', name: '18 meses', requirementLabel: '18 meses', threshold: 18, color: '#d946ef', accent: '#fde047' },
      { id: 'mj-9', name: 'Más de 24 meses', requirementLabel: 'Más de 24 meses', threshold: 24, color: '#f43f5e', accent: '#facc15' },
    ],
  },
  {
    id: 'antiguedad',
    title: 'ANTIGÜEDAD DE LA CUENTA',
    shortTitle: 'Antigüedad',
    description: 'Ten una cuenta de Discord activa durante 1 año para desbloquear esta insignia.',
    tiers: [
      { id: 'ag-1', name: 'Semilla', requirementLabel: '1 año', threshold: 1, color: '#94a3b8' },
      { id: 'ag-2', name: 'Brote', requirementLabel: '2 años', threshold: 2, color: '#84cc16' },
      { id: 'ag-3', name: 'Retoño', requirementLabel: '3 años', threshold: 3, color: '#22c55e' },
      { id: 'ag-4', name: 'Cogollo', requirementLabel: '4 años', threshold: 4, color: '#14b8a6' },
      { id: 'ag-5', name: 'Flor', requirementLabel: '5 años', threshold: 5, color: '#0ea5e9' },
      { id: 'ag-6', name: 'Roble', requirementLabel: '6 años', threshold: 6, color: '#2563eb' },
      { id: 'ag-7', name: 'Secuoya', requirementLabel: '7 años', threshold: 7, color: '#7c3aed' },
      { id: 'ag-8', name: 'Pino', requirementLabel: '8 años', threshold: 8, color: '#c026d3' },
      { id: 'ag-9', name: 'Estromatolito', requirementLabel: '9 años', threshold: 9, color: '#e11d48' },
      { id: 'ag-10', name: 'Primordial', requirementLabel: 'Más de 10 años', threshold: 10, color: '#f59e0b' },
    ],
  },
  {
    id: 'orbs',
    title: 'APRENDIZ DE ORBS',
    shortTitle: 'Aprendiz de Orbs',
    description: 'Completa misiones o acumula Orbs en Discord para desbloquear esta insignia prismática.',
    ctaLabel: 'Ir a Misiones',
    tiers: [
      { id: 'orb-1', name: 'Aprendiz de Orbs', requirementLabel: 'Reclama una misión', threshold: 1, color: '#38bdf8' },
    ],
  },
  {
    id: 'regalos',
    title: 'HACER REGALOS',
    shortTitle: 'Hacer regalos',
    description: 'Envía 1 regalo para desbloquear esta insignia.',
    ctaLabel: 'Enviar regalo',
    tiers: [
      { id: 'rg-1', name: 'Mecenas', requirementLabel: '1 regalo', threshold: 1, color: '#2563eb' },
      { id: 'rg-2', name: 'Campeón', requirementLabel: '2 regalos', threshold: 2, color: '#10b981' },
      { id: 'rg-3', name: 'Portento', requirementLabel: '3 regalos', threshold: 3, color: '#ec4899' },
      { id: 'rg-4', name: 'Icono', requirementLabel: '6 regalos', threshold: 6, color: '#a855f7' },
      { id: 'rg-5', name: 'Adalid', requirementLabel: '10 regalos', threshold: 10, color: '#6366f1', accent: '#84cc16' },
      { id: 'rg-6', name: 'Leyenda', requirementLabel: 'Más de 20 regalos', threshold: 20, color: '#4f46e5', accent: '#f59e0b' },
    ],
  },
  {
    id: 'transmision',
    title: 'TRANSMISIÓN',
    shortTitle: 'Transmisión',
    description: 'Transmite a otros usuarios durante 1 hora para desbloquear esta insignia.',
    hasNotificationDot: true,
    ctaLabel: 'Transmitir (+1 hora)',
    tiers: [
      { id: 'tr-1', name: 'Recién llegado', requirementLabel: '1 hora', threshold: 1, color: '#94a3b8' },
      { id: 'tr-2', name: 'Aprendiz', requirementLabel: '5 horas', threshold: 5, color: '#84cc16' },
      { id: 'tr-3', name: 'Rompedor', requirementLabel: '20 horas', threshold: 20, color: '#22c55e' },
      { id: 'tr-4', name: 'Destacado', requirementLabel: '75 horas', threshold: 75, color: '#14b8a6' },
      { id: 'tr-5', name: 'Marcado de tendencias', requirementLabel: '150 horas', threshold: 150, color: '#0ea5e9' },
      { id: 'tr-6', name: 'Titular', requirementLabel: '300 horas', threshold: 300, color: '#2563eb' },
      { id: 'tr-7', name: 'Estrella', requirementLabel: '500 horas', threshold: 500, color: '#7c3aed' },
      { id: 'tr-8', name: 'Sensación', requirementLabel: '1.000 horas', threshold: 1000, color: '#d946ef' },
      { id: 'tr-9', name: 'Visionario', requirementLabel: '2.000 horas', threshold: 2000, color: '#ef4444' },
      { id: 'tr-10', name: 'Fenómeno', requirementLabel: 'Más de 5.000 horas', threshold: 5000, color: '#f59e0b' },
    ],
  },
  {
    id: 'juegos',
    title: 'VARIEDAD DE JUEGO',
    shortTitle: 'Variedad de juego',
    description: 'Juega a 2 juegos de PC detectables con Discord abierto para desbloquear esta insignia.',
    ctaLabel: 'Detectar juego (+1 juego)',
    tiers: [
      { id: 'jg-1', name: 'Probador', requirementLabel: '2 juegos', threshold: 2, color: '#94a3b8' },
      { id: 'jg-2', name: 'Aficionado', requirementLabel: '5 juegos', threshold: 5, color: '#84cc16' },
      { id: 'jg-3', name: 'Entusiasta', requirementLabel: '10 juegos', threshold: 10, color: '#22c55e' },
      { id: 'jg-4', name: 'Explorador', requirementLabel: '15 juegos', threshold: 15, color: '#14b8a6' },
      { id: 'jg-5', name: 'Aventurero', requirementLabel: '20 juegos', threshold: 20, color: '#0ea5e9' },
      { id: 'jg-6', name: 'Viajante', requirementLabel: '30 juegos', threshold: 30, color: '#2563eb' },
      { id: 'jg-7', name: 'Trotamundos', requirementLabel: '40 juegos', threshold: 40, color: '#7c3aed' },
      { id: 'jg-8', name: 'Rebelde', requirementLabel: '60 juegos', threshold: 60, color: '#d946ef' },
      { id: 'jg-9', name: 'Erudito', requirementLabel: '80 juegos', threshold: 80, color: '#ef4444' },
      { id: 'jg-10', name: 'Universalista', requirementLabel: 'Más de 100 juegos', threshold: 100, color: '#f59e0b' },
    ],
  },
  {
    id: 'pionero',
    title: 'PIONERO PRIMORDIAL',
    shortTitle: 'Pionero',
    description: 'Insignia exclusiva obtenible en la Tienda usando Orbs ganados por actividad o apoyo.',
    ctaLabel: 'Ir a Tienda',
    tiers: [
      { id: 'pio-1', name: 'Pionero', requirementLabel: 'Adquirida en Tienda', threshold: 1, color: '#a855f7', accent: '#e9d5ff' },
    ],
  },
  {
    id: 'beta',
    title: 'PROBADOR BETA',
    shortTitle: 'Probador Beta',
    description: 'Acceso anticipado a funciones experimentales y nuevas versiones de Primordial.',
    tiers: [
      { id: 'beta-1', name: 'Probador Beta', requirementLabel: 'Acceso Beta activo', threshold: 1, color: '#8b5cf6', accent: '#38bdf8' },
    ],
  },
  {
    id: 'cazabugs',
    title: 'CAZADOR DE BUGS BETA',
    shortTitle: 'Cazador de Bugs',
    description: 'Prueba funciones Beta y reporta hallazgos para hacer evolucionar tu emblema QA.',
    ctaLabel: 'Registrar prueba Beta (+1)',
    tiers: [
      { id: 'bug-1', name: 'Explorador Beta', requirementLabel: '1 prueba Beta', threshold: 1, color: '#22c55e' },
      { id: 'bug-2', name: 'Cazador de Bugs', requirementLabel: '3 pruebas Beta', threshold: 3, color: '#06b6d4', accent: '#67e8f9' },
      { id: 'bug-3', name: 'Guardián QA Dorado', requirementLabel: '6 pruebas Beta', threshold: 6, color: '#f59e0b', accent: '#fde68a' },
    ],
  },
];

export const USER_PROFILES_DIRECTORY: Record<string, PublicUserProfile> = {};

export function resolvePublicUserProfile(
  idOrKey: string,
  fallback?: Partial<PublicUserProfile>
): PublicUserProfile {
  const cleanKey = idOrKey.replace(/^dm-/, '');
  const found = USER_PROFILES_DIRECTORY[idOrKey] || USER_PROFILES_DIRECTORY[cleanKey];
  if (found) {
    return {
      ...found,
      ...fallback,
      displayName: fallback?.displayName || found.displayName,
      avatar: fallback?.avatar || found.avatar,
      status: fallback?.status || found.status,
    };
  }
  return {
    id: cleanKey,
    displayName: fallback?.displayName || cleanKey,
    username: fallback?.username || cleanKey.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
    displayNameStyle: fallback?.displayNameStyle,
    displayNameColorPreset: fallback?.displayNameColorPreset,
    displayNameCustomColors: fallback?.displayNameCustomColors,
    displayNameGlow: fallback?.displayNameGlow,
    avatar: fallback?.avatar || 'madara',
    customAvatarUrl: fallback?.customAvatarUrl,
    status: fallback?.status || 'online',
    bio: fallback?.bio || 'Miembro real de Primordial.',
    bannerColor: fallback?.bannerColor || '#5865F2',
    bannerImage: fallback?.bannerImage,
    decoration: fallback?.decoration || 'none',
    profileEffect: fallback?.profileEffect || 'none',
    profileFrame: fallback?.profileFrame || 'none',
    nameplate: fallback?.nameplate || 'none',
    serverTag: fallback?.serverTag,
    nitroTier: fallback?.nitroTier || 'none',
    badgeIds: fallback?.badgeIds || ['hypesquad'],
    memberSince: fallback?.memberSince || 'Noviembre 2026',
    isBot: false,
    mutualServers: fallback?.mutualServers || [],
    customStatus: fallback?.customStatus,
  };
}


