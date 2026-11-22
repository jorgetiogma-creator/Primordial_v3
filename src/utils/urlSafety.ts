const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/i;

/**
 * Validates and sanitizes image/media URLs so only safe HTTP(S), local asset paths,
 * or base64 raster images can ever be rendered in <img> or CSS url(...) bindings.
 */
export function sanitizeMediaUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}
