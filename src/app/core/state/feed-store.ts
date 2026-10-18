import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { ALL_CLIPS } from '../data/catalog';
import { MOCK_CLIPS } from '../data/mock-feed';
import { FeedCollection, VideoClip } from '../models/feed';
import { PersistentState } from './persistent-state';
import { SettingsStore } from './settings-store';

/** Cuántos clips se montan a cada lado del activo. Ver `shouldMount`. */
export const MOUNT_RADIUS = 1;

const FOR_YOU: FeedCollection = { id: 'for-you', label: 'Para ti', clips: MOCK_CLIPS };

/** Cuántos clips entran en cada tanda del scroll infinito. */
const PAGE_SIZE = 6;

/**
 * Estado del feed: qué clip está activo, qué ha tocado el usuario y qué debe
 * existir en el DOM.
 */
@Service()
export class FeedStore {
  // Las dependencias van primero porque varios campos leen de ellas al
  // inicializarse, y las propiedades de clase se evalúan en orden.
  private readonly store = inject(PersistentState);
  private readonly settings = inject(SettingsStore);

  /**
   * Colección en reproducción. «Para ti» es un ranking y la parrilla de un
   * perfil es un listado por autor: el feed reproduce una u otra, y por eso la
   * lista de clips no es un signal suelto sino parte de la colección activa.
   */
  private readonly current = signal<FeedCollection>(FOR_YOU);

  readonly collection = computed(() => this.current());
  readonly clips = computed(() => this.current().clips);
  readonly activeIndex = signal(0);

  readonly activeClip = computed<VideoClip | null>(() => this.clips()[this.activeIndex()] ?? null);
  readonly total = computed(() => this.clips().length);

  /**
   * Arranca silenciado salvo que el usuario diga lo contrario en Ajustes.
   * Es el valor por defecto porque todos los navegadores bloquean el autoplay
   * con audio sin gesto previo, y un `play()` rechazado dejaría el feed
   * congelado en el primer clip.
   */
  readonly muted = signal(this.settings.startMuted());

  /**
   * Pausa del clip activo. No significa "fuera de vista": un clip que sale de
   * pantalla se detiene por otra vía (`VideoStage` solo reproduce el activo).
   *
   * El feed autorreproduce siempre, también con `prefers-reduced-motion`. Esa
   * preferencia existe para el movimiento decorativo —y el CSS la respeta al
   * pie—, pero aquí el video ES el contenido: no reproducirlo deja la app
   * inservible justo para quien declaró una necesidad de accesibilidad. Lo que
   * WCAG 2.2.2 pide de un contenido que arranca solo es poder pararlo, y eso lo
   * cubre el botón de reproducción a pantalla completa de `VideoStage`.
   */
  readonly paused = signal(!this.settings.autoplay());

  // Lo que el usuario ha hecho sobrevive a la recarga; el catálogo no, que
  // vendría del servidor en cuanto haya uno.
  private readonly likedIds = this.store.idSet('liked');
  private readonly savedIds = this.store.idSet('saved');
  private readonly followedIds = this.store.idSet('followed');

  /**
   * La descripción se repliega sola al cambiar de clip: `linkedSignal` mantiene
   * la escritura local (toggle) y la resetea cuando cambia la fuente.
   */
  readonly descriptionExpanded = linkedSignal<number, boolean>({
    source: this.activeIndex,
    computation: () => false,
  });

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  /**
   * Solo el clip activo y sus vecinos inmediatos se montan. Un `<video>` por
   * clip significa un decodificador por clip: con 20 elementos el navegador
   * descarta decodificadores a mitad de scroll y el feed se queda en negro.
   */
  shouldMount(index: number): boolean {
    return Math.abs(index - this.activeIndex()) <= MOUNT_RADIUS;
  }

  setActiveIndex(index: number): void {
    const clamped = Math.min(Math.max(index, 0), Math.max(this.total() - 1, 0));
    if (clamped === this.activeIndex()) return;
    this.activeIndex.set(clamped);
    // Un clip nuevo sigue la preferencia: la pausa es del clip, no del feed.
    this.paused.set(!this.settings.autoplay());
  }

  activateById(clipId: string): void {
    const index = this.clips().findIndex((clip) => clip.id === clipId);
    if (index >= 0) this.setActiveIndex(index);
  }

  /**
   * Reproduce otra colección empezando por un clip concreto: es lo que ocurre
   * al abrir un video desde un perfil, donde el scroll vertical recorre los
   * videos de esa persona y no la recomendación general.
   */
  playCollection(collection: FeedCollection, startClipId?: string): void {
    const index = startClipId ? collection.clips.findIndex((c) => c.id === startClipId) : 0;

    this.current.set(collection);
    this.activeIndex.set(Math.max(index, 0));
    this.paused.set(!this.settings.autoplay());
  }

  /**
   * Inserta un clip al principio de la recomendación general. Lo usa el
   * composer: una publicación propia debe verse al instante, sin esperar a
   * que el ranking la recoja.
   */
  prepend(clip: VideoClip): void {
    this.current.update((collection) => ({
      ...collection,
      clips: [clip, ...collection.clips],
    }));
    this.activeIndex.set(0);
  }

  /**
   * Trae la siguiente tanda de «Para ti».
   *
   * Solo pagina la recomendación general: las demás colecciones —un perfil, un
   * hashtag, un sonido— son listas cerradas y alargarlas con clips ajenos
   * rompería lo que el usuario cree estar recorriendo.
   */
  loadMore(): void {
    if (!this.isForYou() || this.exhausted()) return;

    const seen = new Set(this.clips().map((clip) => clip.id));
    const next = ALL_CLIPS.filter((clip) => !seen.has(clip.id)).slice(0, PAGE_SIZE);

    if (next.length === 0) {
      this.exhausted.set(true);
      return;
    }
    this.current.update((collection) => ({
      ...collection,
      clips: [...collection.clips, ...next],
    }));
  }

  /** Vuelve a la recomendación general. */
  resetToForYou(): void {
    if (this.current().id === FOR_YOU.id) return;
    this.playCollection(FOR_YOU);
    this.exhausted.set(false);
  }

  readonly isForYou = computed(() => this.current().id === FOR_YOU.id);
  /** No quedan más clips que traer. */
  readonly exhausted = signal(false);

  next(): void {
    this.setActiveIndex(this.activeIndex() + 1);
  }

  previous(): void {
    this.setActiveIndex(this.activeIndex() - 1);
  }

  toggleMute(): void {
    this.muted.update((muted) => !muted);
  }

  togglePlayback(): void {
    this.paused.update((paused) => !paused);
  }

  toggleDescription(): void {
    this.descriptionExpanded.update((expanded) => !expanded);
  }

  isLiked(clipId: string): boolean {
    return this.likedIds().has(clipId);
  }

  isSaved(clipId: string): boolean {
    return this.savedIds().has(clipId);
  }

  isFollowed(creatorId: string): boolean {
    return this.followedIds().has(creatorId);
  }

  toggleLike(clipId: string): void {
    this.likedIds.update((ids) => toggleIn(ids, clipId));
  }

  toggleSave(clipId: string): void {
    this.savedIds.update((ids) => toggleIn(ids, clipId));
  }

  toggleFollow(creatorId: string): void {
    this.followedIds.update((ids) => toggleIn(ids, creatorId));
  }

  /**
   * Conteo optimista: el valor del servidor más el voto local. Así el contador
   * responde al instante sin esperar al backend ni mutar los datos del clip.
   */
  likeCount(clip: VideoClip): number {
    return clip.metrics.likes + (this.isLiked(clip.id) ? 1 : 0);
  }

  saveCount(clip: VideoClip): number {
    return clip.metrics.saves + (this.isSaved(clip.id) ? 1 : 0);
  }
}

function toggleIn(source: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(source);
  if (!next.delete(id)) next.add(id);
  return next;
}
