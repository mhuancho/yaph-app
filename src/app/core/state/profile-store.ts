import { computed, inject, Service, signal } from '@angular/core';
import { CURRENT_PROFILE, MOCK_LIBRARY, MOCK_PROFILES } from '../data/mock-profiles';
import { CreatorProfile, FeedCollection, VideoClip } from '../models/feed';
import { FeedStore } from './feed-store';

const EMPTY: readonly VideoClip[] = [];

/**
 * Perfiles y sus publicaciones.
 *
 * El estado de seguimiento vive en `FeedStore`, que ya lo gestiona para el
 * botón del rail: duplicarlo aquí daría dos fuentes de verdad y un perfil
 * podría decir «Siguiendo» mientras el feed dice lo contrario.
 */
@Service()
export class ProfileStore {
  private readonly feed = inject(FeedStore);

  readonly profiles = signal<readonly CreatorProfile[]>(MOCK_PROFILES);
  readonly me = CURRENT_PROFILE;

  /** Handle del perfil abierto; `null` significa el perfil propio. */
  readonly openHandle = signal<string | null>(null);

  readonly profile = computed(() => this.byHandle(this.openHandle()));
  readonly isMe = computed(() => this.profile()?.id === this.me.id);

  readonly posts = computed(() => this.libraryFor(this.profile()?.id ?? null));

  /** Clips que esta persona tiene guardados; solo tiene sentido en el propio. */
  readonly saved = computed(() => this.feed.clips().filter((clip) => this.feed.isSaved(clip.id)));
  readonly liked = computed(() => this.feed.clips().filter((clip) => this.feed.isLiked(clip.id)));

  /**
   * Un perfil está en directo si alguna de sus publicaciones lo está. El
   * estado es del clip, no una bandera suelta del perfil, así no pueden
   * contradecirse.
   */
  readonly liveClip = computed(() => this.posts().find((clip) => clip.kind === 'live') ?? null);
  readonly isLive = computed(() => this.liveClip() !== null);

  readonly totalViews = computed(() =>
    this.posts().reduce((sum, clip) => sum + clip.metrics.views, 0),
  );

  /**
   * Compara sin `@` y sin mayúsculas: el handle llega de la URL, donde el
   * usuario puede escribirlo de cualquier forma.
   */
  byHandle(handle: string | null): CreatorProfile | null {
    if (!handle) return this.me;

    const needle = normalize(handle);
    return this.profiles().find((profile) => normalize(profile.handle) === needle) ?? null;
  }

  libraryFor(profileId: string | null): readonly VideoClip[] {
    return profileId ? (MOCK_LIBRARY[profileId] ?? EMPTY) : EMPTY;
  }

  /** Colección que el feed debe reproducir al abrir un video del perfil. */
  collectionFor(profile: CreatorProfile): FeedCollection {
    return {
      id: `profile:${profile.id}`,
      label: profile.handle,
      clips: this.libraryFor(profile.id),
    };
  }

  isFollowed(profileId: string): boolean {
    return this.feed.isFollowed(profileId);
  }

  toggleFollow(profileId: string): void {
    this.feed.toggleFollow(profileId);
  }

  /** Seguidores con el voto local aplicado, igual que el contador de me gusta. */
  followerCount(profile: CreatorProfile): number {
    return profile.followers + (this.isFollowed(profile.id) ? 1 : 0);
  }
}

function normalize(handle: string): string {
  return handle.replace(/^@/, '').toLowerCase();
}
