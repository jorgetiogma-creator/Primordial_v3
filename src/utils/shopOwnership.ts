import { INITIAL_SHOP_BUNDLES } from '../data/discordData';
import {
  BadgeId,
  DecorationId,
  NameplateId,
  ProfileEffectId,
  ProfileFrameId,
  ShopBundle,
  ThemeMode,
  UserProfile,
  VoiceEntryEffectId,
} from '../types/discord';

export interface OwnedCosmetics {
  decorations: Set<DecorationId>;
  effects: Set<ProfileEffectId>;
  frames: Set<ProfileFrameId>;
  nameplates: Set<NameplateId>;
  banners: Set<string>;
  uiThemes: Set<ThemeMode>;
  voiceEntryEffects: Set<VoiceEntryEffectId>;
  exclusiveBadges: Set<BadgeId>;
}

const BASIC_FREE_FRAMES: ProfileFrameId[] = [
  'none',
  'obsidian',
  'crimson',
  'neon-blue',
  'gold',
  'glitch',
];

const FREE_THEMES: ThemeMode[] = ['onyx', 'dark', 'purple', 'light'];

export function getOwnedCosmetics(
  ownedBundleIds: string[],
  bundles: ShopBundle[] = INITIAL_SHOP_BUNDLES
): OwnedCosmetics {
  const decorations = new Set<DecorationId>(['none']);
  const effects = new Set<ProfileEffectId>(['none']);
  const frames = new Set<ProfileFrameId>(BASIC_FREE_FRAMES);
  const nameplates = new Set<NameplateId>(['none']);
  const banners = new Set<string>();
  const uiThemes = new Set<ThemeMode>(FREE_THEMES);
  const voiceEntryEffects = new Set<VoiceEntryEffectId>(['none']);
  const exclusiveBadges = new Set<BadgeId>();

  for (const bundle of bundles) {
    if (!ownedBundleIds.includes(bundle.id)) continue;
    for (const item of bundle.items) {
      if (item.decorationId) decorations.add(item.decorationId);
      if (item.profileEffectId) effects.add(item.profileEffectId);
      if (item.profileFrameId) frames.add(item.profileFrameId);
      if (item.nameplateId) nameplates.add(item.nameplateId);
      if (item.bannerUrl) banners.add(item.bannerUrl);
      if (item.uiThemeId) uiThemes.add(item.uiThemeId);
      if (item.voiceEntryEffectId) voiceEntryEffects.add(item.voiceEntryEffectId);
      if (item.exclusiveBadgeId) exclusiveBadges.add(item.exclusiveBadgeId);
    }
    // Companion variants included inside matching bundles
    if (bundle.id === 'bundle-deadpool') {
      decorations.add('wolverine');
      nameplates.add('wolverine');
    }
    if (bundle.id === 'bundle-rama') {
      nameplates.add('sakura');
    }
  }

  return {
    decorations,
    effects,
    frames,
    nameplates,
    banners,
    uiThemes,
    voiceEntryEffects,
    exclusiveBadges,
  };
}

export function findBundleForCosmetic(
  params: {
    decorationId?: DecorationId;
    profileEffectId?: ProfileEffectId;
    profileFrameId?: ProfileFrameId;
    nameplateId?: NameplateId;
    bannerUrl?: string;
    uiThemeId?: ThemeMode;
    voiceEntryEffectId?: VoiceEntryEffectId;
    exclusiveBadgeId?: BadgeId;
  },
  bundles: ShopBundle[] = INITIAL_SHOP_BUNDLES
): ShopBundle | undefined {
  const direct = bundles.find((b) =>
    b.items.some(
      (item) =>
        (params.decorationId && item.decorationId === params.decorationId) ||
        (params.profileEffectId && item.profileEffectId === params.profileEffectId) ||
        (params.profileFrameId && item.profileFrameId === params.profileFrameId) ||
        (params.nameplateId && item.nameplateId === params.nameplateId) ||
        (params.bannerUrl && item.bannerUrl === params.bannerUrl) ||
        (params.uiThemeId && item.uiThemeId === params.uiThemeId) ||
        (params.voiceEntryEffectId && item.voiceEntryEffectId === params.voiceEntryEffectId) ||
        (params.exclusiveBadgeId && item.exclusiveBadgeId === params.exclusiveBadgeId)
    )
  );
  if (direct) return direct;

  if (params.decorationId === 'wolverine' || params.nameplateId === 'wolverine') {
    return bundles.find((b) => b.id === 'bundle-deadpool');
  }
  if (params.nameplateId === 'sakura') {
    return bundles.find((b) => b.id === 'bundle-rama');
  }
  return undefined;
}

export const NITRO_EXCLUSIVE_DECORATIONS: DecorationId[] = [
  'nitro-disco',
  'nitro-auris',
  'nitro-chip',
];

export const NITRO_EXCLUSIVE_EFFECTS: ProfileEffectId[] = [
  'cyber',
  'sparks',
  'crimson',
];

/**
 * Ensures a user profile only has shop cosmetics equipped if they actually own
 * the corresponding bundle (user-uploaded data: URLs are preserved).
 */
export function sanitizeUserShopCosmetics(
  user: UserProfile,
  ownedBundleIds: string[],
  bundles: ShopBundle[] = INITIAL_SHOP_BUNDLES,
  isOwnerAccount = false
): UserProfile {
  const owned = getOwnedCosmetics(ownedBundleIds, bundles);
  const hasNitro = isOwnerAccount || user.nitroTier === 'nitro' || user.nitroTier === 'basic';
  const nitroUnlockedDecorations = new Set<DecorationId>(
    hasNitro ? NITRO_EXCLUSIVE_DECORATIONS : []
  );
  const nitroUnlockedEffects = new Set<ProfileEffectId>(
    hasNitro ? NITRO_EXCLUSIVE_EFFECTS : []
  );

  const safeDecoration: DecorationId =
    owned.decorations.has(user.decoration) || nitroUnlockedDecorations.has(user.decoration)
      ? user.decoration
      : 'none';

  const currentEffect = user.profileEffect || 'none';
  const safeEffect: ProfileEffectId =
    owned.effects.has(currentEffect) || nitroUnlockedEffects.has(currentEffect)
      ? currentEffect
      : 'none';

  const currentFrame = user.profileFrame || 'none';
  const safeFrame: ProfileFrameId = owned.frames.has(currentFrame) ? currentFrame : 'none';

  const currentVoiceEffect = user.voiceEntryEffect || 'none';
  const safeVoiceEffect: VoiceEntryEffectId =
    isOwnerAccount || owned.voiceEntryEffects.has(currentVoiceEffect)
      ? currentVoiceEffect
      : 'none';

  const normalizedPlate =
    (user.nameplate as string) === 'vice-city' || (user.nameplate as string) === 'konoha-naranja'
      ? 'none'
      : user.nameplate;
  const safeNameplate: NameplateId = owned.nameplates.has(normalizedPlate)
    ? normalizedPlate
    : 'none';

  const isCustomUploadBanner = Boolean(user.bannerImage && user.bannerImage.startsWith('data:'));
  const safeBannerImage =
    user.bannerImage && ((isCustomUploadBanner && hasNitro) || owned.banners.has(user.bannerImage))
      ? user.bannerImage
      : undefined;

  const safePerServerProfiles = user.perServerProfiles
    ? Object.fromEntries(
        Object.entries(user.perServerProfiles).map(([srvId, srvProf]) => {
          if (!srvProf) return [srvId, srvProf];
          const isSrvUploadBanner = Boolean(
            srvProf.bannerImage && srvProf.bannerImage.startsWith('data:')
          );
          const safeSrvBanner =
            srvProf.bannerImage &&
            ((isSrvUploadBanner && hasNitro) || owned.banners.has(srvProf.bannerImage))
              ? srvProf.bannerImage
              : undefined;
          return [srvId, { ...srvProf, bannerImage: safeSrvBanner }];
        })
      )
    : user.perServerProfiles;

  const safeColorPreset = hasNitro ? user.displayNameColorPreset || 'none' : 'none';

  return {
    ...user,
    decoration: safeDecoration,
    profileEffect: safeEffect,
    profileFrame: safeFrame,
    voiceEntryEffect: safeVoiceEffect,
    nameplate: safeNameplate,
    bannerImage: safeBannerImage,
    perServerProfiles: safePerServerProfiles,
    displayNameColorPreset: safeColorPreset,
  };
}
