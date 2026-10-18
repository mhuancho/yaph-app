import { AudioTrack, VideoClip } from '../models/feed';
import { MOCK_LIBRARY } from './mock-profiles';

/**
 * Catálogo global: todas las publicaciones de todos los perfiles.
 *
 * Es la tabla contra la que consultan la búsqueda, las páginas de hashtag y
 * las de sonido. En un backend sería un índice; aquí se aplana una vez al
 * cargar el módulo porque recorrerlo en cada pulsación de tecla sería
 * recalcular lo mismo decenas de veces por segundo.
 */
export const ALL_CLIPS: readonly VideoClip[] = Object.values(MOCK_LIBRARY).flat();

function indexBy<T>(
  clips: readonly VideoClip[],
  keys: (clip: VideoClip) => readonly string[],
  value: (clip: VideoClip) => T,
): ReadonlyMap<string, { readonly value: T; readonly clips: VideoClip[] }> {
  const map = new Map<string, { value: T; clips: VideoClip[] }>();

  for (const clip of clips) {
    for (const key of keys(clip)) {
      const normalized = key.toLowerCase();
      const entry = map.get(normalized);
      if (entry) entry.clips.push(clip);
      else map.set(normalized, { value: value(clip), clips: [clip] });
    }
  }
  return map;
}

/** Publicaciones por hashtag, sin la almohadilla y en minúsculas. */
export const CLIPS_BY_TAG = indexBy(
  ALL_CLIPS,
  (clip) => clip.hashtags.map((tag) => tag.replace(/^#/, '')),
  (clip) => clip.hashtags[0] ?? '',
);

/** Publicaciones por id de sonido, con la ficha del propio audio. */
export const CLIPS_BY_SOUND = indexBy(
  ALL_CLIPS,
  (clip) => [clip.audio.id],
  (clip) => clip.audio,
);

export function clipsForTag(tag: string): readonly VideoClip[] {
  return CLIPS_BY_TAG.get(tag.replace(/^#/, '').toLowerCase())?.clips ?? [];
}

export function soundById(id: string): AudioTrack | null {
  return CLIPS_BY_SOUND.get(id.toLowerCase())?.value ?? null;
}

export function clipsForSound(id: string): readonly VideoClip[] {
  return CLIPS_BY_SOUND.get(id.toLowerCase())?.clips ?? [];
}

/** Hashtags del catálogo ordenados por número de publicaciones. */
export const ALL_TAGS: readonly { tag: string; count: number }[] = [...CLIPS_BY_TAG.entries()]
  .map(([tag, entry]) => ({ tag: `#${tag}`, count: entry.clips.length }))
  .sort((a, b) => b.count - a.count);

/** Sonidos del catálogo ordenados por número de publicaciones que los usan. */
export const ALL_SOUNDS: readonly { sound: AudioTrack; count: number }[] = [
  ...CLIPS_BY_SOUND.entries(),
].map(([, entry]) => ({ sound: entry.value, count: entry.clips.length }));
