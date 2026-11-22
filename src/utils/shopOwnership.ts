import { INITIAL_SHOP_BUNDLES } from '../data/discordData';
import {
  DecorationId,
  NameplateId,
  ProfileEffectId,
  ProfileFrameId,
  ShopBundle,
  UserProfile,
} from '../types/discord';

export interface OwnedCosmetics {
  decorations: Set<DecorationId>;
  effects: Set<ProfileEffectId>;
  frames: Set<ProfileFrameId>;
  nameplates: Set<NameplateId>;
  banners: Set<string>;
}

const BASIC_FREE_FRAMES: ProfileFrameId[] = [
  'none',
  'obsidian',
  'crimson',
  'neon-blue',
  'gold',
  'glitch',
];

export function getOwnedCosmetics(
  ownedBundleIds: string[],
  bundles: ShopBundle[] = INITIAL_SHOP_BUNDLES
): OwnedCosmetics {
  const decorations = new Set<DecorationId>(['none']);
  const effects = new Set<ProfileEffectId>(['none']);
  const frames = new Set<ProfileFrameId>(BASIC_FREE_FRAMES);
  const nameplates = new Set<NameplateId>(['none']);
  const banners = new Set<string>();

  for (const bundle of bundles) {
    if (!ownedBundleIds.includes(bundle.id)) continue;
    for (const item of bundle.items) {
      if (item.decorationId) decorations.add(item.decorationId);
      if (item.profileEffectId) effects.add(item.profileEffectId);
      if (item.profileFrameId) frames.add(item.profileFrameId);
      if (item.nameplateId) nameplates.add(item.nameplateId);
      if (item.bannerUrl) banners.add(item.bannerUrl);
    }
    // Companion variants included inside matching bundles
    if (bundle.id === 'bundle-deadpool') {
      decorations.add('wolverine');
      nameplates.add('wolverine');
    }
    if (bundle.id === 'bundle-rama') {
      nameplates.add('sakura');
    }
    if (bundle.id === 'bundle-banner-vice') {
      nameplates.add('vice-city');
    }
  }

  return { decorations, effects, frames, nameplates, banners };
}

export function findBundleForCosmetic(
  params: {
    decorationId?: DecorationId;
    profileEffectId?: ProfileEffectId;
    profileFrameId?: ProfileFrameId;
    nameplateId?: NameplateId;
    bannerUrl?: string;
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
        (params.bannerUrl && item.bannerUrl === params.bannerUrl)
    )
  );
  if (direct) return direct;

  if (params.decorationId === 'wolverine' || params.nameplateId === 'wolverine') {
    return bundles.find((b) => b.id === 'bundle-deadpool');
  }
  if (params.nameplateId === 'sakura') {
    return bundles.find((b) => b.id === 'bundle-rama');
  }
  if (params.nameplateId === 'vice-city') {
    return bundles.find((b) => b.id === 'bundle-banner-vice');
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
  bundles: ShopBundle[] = INITIAL_SHOP_BUNDLES
): UserProfile {
  const owned = getOwnedCosmetics(ownedBundleIds, bundles);
  const hasNitro = user.nitroTier !== 'none';
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

  const safeNameplate: NameplateId = owned.nameplates.has(user.nameplate)
    ? user.nameplate
    : 'none';

  const isCustomUploadBanner = Boolean(user.bannerImage && user.bannerImage.startsWith('data:'));
  const safeBannerImage =
    user.bannerImage && (isCustomUploadBanner || owned.banners.has(user.bannerImage))
      ? user.bannerImage
      : undefined;

  const safeColorPreset = hasNitro ? user.displayNameColorPreset || 'none' : 'none';

  return {
    ...user,
    decoration: safeDecoration,
    profileEffect: safeEffect,
    profileFrame: safeFrame,
    nameplate: safeNameplate,
    bannerImage: safeBannerImage,
    displayNameColorPreset: safeColorPreset,
  };
}
