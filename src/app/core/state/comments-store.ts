import { Service, signal } from '@angular/core';
import { CURRENT_USER, MOCK_COMMENTS } from '../data/mock-comments';
import { ClipComment, VideoClip } from '../models/feed';

/** Límite de un comentario. El composer avisa antes de llegar. */
export const COMMENT_MAX_LENGTH = 150;

/**
 * Hilo de comentarios del clip y estado del panel que lo muestra.
 *
 * Es un store aparte de `FeedStore` a propósito: el feed decide qué se
 * reproduce y los comentarios son una conversación sobre ello. Mezclarlos
 * obligaría a cargar el hilo de cada clip montado, cuando solo hace falta el
 * del clip que el usuario está mirando con el panel abierto.
 */
@Service()
export class CommentsStore {
  /** Panel abierto. Es global, no por clip: al pasar de clip con el panel
   * abierto el hilo cambia de contenido, como en cualquier feed vertical. */
  readonly open = signal(false);

  /** Comentarios publicados en esta sesión, por clip. */
  private readonly published = signal<ReadonlyMap<string, readonly ClipComment[]>>(new Map());
  private readonly likedIds = signal<ReadonlySet<string>>(new Set<string>());
  private sequence = 0;

  /**
   * Hilo visible: primero los fijados por el creador, luego lo que acaba de
   * escribir el usuario (para que vea su mensaje sin buscarlo) y después el
   * resto en el orden que llega del servidor.
   */
  commentsFor(clipId: string): readonly ClipComment[] {
    const seed = MOCK_COMMENTS[clipId] ?? [];
    const own = this.published().get(clipId) ?? [];

    const pinned: ClipComment[] = [];
    const rest: ClipComment[] = [];
    for (const comment of seed) (comment.pinned ? pinned : rest).push(comment);

    return [...pinned, ...own, ...rest];
  }

  /** Contador optimista: el valor del servidor más lo publicado en local. */
  countFor(clip: VideoClip): number {
    return clip.metrics.comments + (this.published().get(clip.id)?.length ?? 0);
  }

  /**
   * Elemento que abrió el panel, para devolverle el foco al cerrar.
   *
   * No es un signal porque nada lo renderiza: es estado imperativo de gestión
   * de foco. El `<dialog>` modal ya lo restaura solo, pero el panel de
   * escritorio no es modal y sin esto el foco se perdería en el `<body>`.
   */
  private trigger: HTMLElement | null = null;

  openPanel(trigger: HTMLElement | null = null): void {
    this.trigger = trigger;
    this.open.set(true);
  }

  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.trigger?.focus();
    this.trigger = null;
  }

  toggle(trigger: HTMLElement | null = null): void {
    if (this.open()) this.closePanel();
    else this.openPanel(trigger);
  }

  isLiked(commentId: string): boolean {
    return this.likedIds().has(commentId);
  }

  toggleLike(commentId: string): void {
    this.likedIds.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(commentId)) next.add(commentId);
      return next;
    });
  }

  likeCount(comment: ClipComment): number {
    return comment.likes + (this.isLiked(comment.id) ? 1 : 0);
  }

  /**
   * Publica el borrador. Devuelve `false` si no había nada que publicar, para
   * que la vista no limpie un campo que el usuario sigue escribiendo.
   */
  publish(clipId: string, body: string): boolean {
    const text = body.trim().slice(0, COMMENT_MAX_LENGTH);
    if (text.length === 0) return false;

    this.sequence += 1;
    const comment: ClipComment = {
      id: `cm-local-${this.sequence}`,
      author: CURRENT_USER,
      body: text,
      ageMinutes: 0,
      likes: 0,
      pinned: false,
      replies: 0,
      own: true,
    };

    this.published.update((map) => {
      const next = new Map(map);
      next.set(clipId, [comment, ...(next.get(clipId) ?? [])]);
      return next;
    });
    return true;
  }
}
