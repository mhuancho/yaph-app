import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { MOCK_CLIPS } from '../data/mock-feed';
import { VideoClip } from '../models/feed';
import { ReducedMotion } from './reduced-motion';

/** Cuántos clips se montan a cada lado del activo. Ver `shouldMount`. */
export const MOUNT_RADIUS = 1;

/**
 * Estado del feed: qué clip está activo, qué ha tocado el usuario y qué debe
 * existir en el DOM.
 */
@Service()
export class FeedStore {
  private readonly reducedMotion = inject(ReducedMotion);

  readonly clips = signal<readonly VideoClip[]>(MOCK_CLIPS);
  readonly activeIndex = signal(0);

  readonly activeClip = computed<VideoClip | null>(() => this.clips()[this.activeIndex()] ?? null);
  readonly total = computed(() => this.clips().length);

  /**
   * Arranca silenciado: todos los navegadores bloquean el autoplay con audio
   * sin gesto previo del usuario, y un `play()` rechazado deja el feed
   * congelado en el primer clip.
   */
  readonly muted = signal(true);

  /**
   * Pausa del clip activo. No significa "fuera de vista": un clip que sale de
   * pantalla se detiene por otra vía (`VideoStage` solo reproduce el activo).
   *
   * Arranca en el valor de `prefers-reduced-motion`: con la preferencia activa
   * nada se autorreproduce, pero el botón de play sigue funcionando. Si el
   * autoplay se bloqueara con una condición aparte, pulsar play no haría nada.
   */
  readonly paused = signal(this.reducedMotion.enabled());

  private readonly likedIds = signal<ReadonlySet<string>>(new Set<string>());
  private readonly savedIds = signal<ReadonlySet<string>>(new Set<string>());
  private readonly followedIds = signal<ReadonlySet<string>>(new Set<string>());

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
    // Cada clip nuevo vuelve a la política por defecto del usuario.
    this.paused.set(this.reducedMotion.enabled());
  }

  activateById(clipId: string): void {
    const index = this.clips().findIndex((clip) => clip.id === clipId);
    if (index >= 0) this.setActiveIndex(index);
  }

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
