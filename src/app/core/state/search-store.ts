import { computed, inject, Service, signal } from '@angular/core';
import { ALL_CLIPS, ALL_SOUNDS, ALL_TAGS } from '../data/catalog';
import { AudioTrack, CreatorProfile, VideoClip } from '../models/feed';
import { ProfileStore } from './profile-store';

const MAX_PER_GROUP = 12;

export interface SearchResults {
  readonly creators: readonly CreatorProfile[];
  readonly clips: readonly VideoClip[];
  readonly tags: readonly { tag: string; count: number }[];
  readonly sounds: readonly { sound: AudioTrack; count: number }[];
  readonly total: number;
}

/**
 * Búsqueda sobre el catálogo.
 *
 * Filtra en cliente porque todo el catálogo cabe en memoria; con un backend
 * real esto sería una consulta por término y el store solo cambiaría de
 * fuente. Lo que no cambiaría es la forma del resultado, que es lo que
 * consume la vista.
 */
@Service()
export class SearchStore {
  private readonly profiles = inject(ProfileStore);

  readonly query = signal('');

  /** Sugerencias cuando todavía no se ha escrito nada. */
  readonly trendingTags = ALL_TAGS.slice(0, 10);

  readonly results = computed<SearchResults>(() => {
    const needle = normalize(this.query());
    if (needle.length === 0) return EMPTY_RESULTS;

    const creators = this.profiles
      .profiles()
      .filter(
        (profile) =>
          normalize(profile.handle).includes(needle) ||
          normalize(profile.displayName).includes(needle) ||
          normalize(profile.bio).includes(needle),
      )
      .slice(0, MAX_PER_GROUP);

    const clips = ALL_CLIPS.filter(
      (clip) =>
        normalize(clip.description).includes(needle) ||
        clip.hashtags.some((tag) => normalize(tag).includes(needle)) ||
        normalize(clip.audio.title).includes(needle),
    ).slice(0, MAX_PER_GROUP * 2);

    const tags = ALL_TAGS.filter((entry) => normalize(entry.tag).includes(needle)).slice(
      0,
      MAX_PER_GROUP,
    );

    const sounds = ALL_SOUNDS.filter(
      (entry) =>
        normalize(entry.sound.title).includes(needle) ||
        normalize(entry.sound.author).includes(needle),
    ).slice(0, MAX_PER_GROUP);

    return {
      creators,
      clips,
      tags,
      sounds,
      total: creators.length + clips.length + tags.length + sounds.length,
    };
  });
}

const EMPTY_RESULTS: SearchResults = {
  creators: [],
  clips: [],
  tags: [],
  sounds: [],
  total: 0,
};

/**
 * Compara sin acentos ni mayúsculas: nadie escribe «neón» con tilde en un
 * buscador, y `localeCompare` no sirve para subcadenas.
 */
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
