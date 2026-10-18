import { Service, signal } from '@angular/core';
import { CURRENT_USER, MOCK_COMMENTS } from '../data/mock-comments';
import { ClipComment, VideoClip } from '../models/feed';

/** Límite de un comentario. El composer avisa antes de llegar. */
export const COMMENT_MAX_LENGTH = 150;

const EMPTY: readonly ClipComment[] = [];

/**
 * Hilo de comentarios del clip y estado del panel que lo muestra.
 *
 * Es un store aparte de `FeedStore` a propósito: el feed decide qué se
 * reproduce y los comentarios son una conversación sobre ello. Mezclarlos
 * obligaría a cargar el hilo de cada clip montado, cuando solo hace falta el
 * del clip que el usuario está mirando con el panel abierto.
 *
 * No guarda el chat de los directos: eso es efímero y vive en `TrendsStore`.
 */
@Service()
export class CommentsStore {
  /** Panel abierto. Es global, no por clip: al pasar de clip con el panel
   * abierto el hilo cambia de contenido, como en cualquier feed vertical. */
  readonly open = signal(false);

  /** Comentario al que se está respondiendo, o `null` para escribir en raíz. */
  readonly replyingTo = signal<ClipComment | null>(null);

  /** Comentarios publicados en esta sesión, por clip. */
  private readonly published = signal<ReadonlyMap<string, readonly ClipComment[]>>(new Map());
  private readonly likedIds = signal<ReadonlySet<string>>(new Set<string>());
  private readonly expandedIds = signal<ReadonlySet<string>>(new Set<string>());
  private sequence = 0;

  /**
   * Elemento que abrió el panel, para devolverle el foco al cerrar.
   *
   * No es un signal porque nada lo renderiza: es estado imperativo de gestión
   * de foco. El `<dialog>` modal ya lo restaura solo, pero el panel de
   * escritorio no es modal y sin esto el foco se perdería en el `<body>`.
   */
  private trigger: HTMLElement | null = null;

  /**
   * Comentarios de primer nivel: primero los fijados por el creador, luego lo
   * que acaba de escribir el usuario (para que vea su mensaje sin buscarlo) y
   * después el resto en el orden que llega del servidor.
   */
  roots(clipId: string): readonly ClipComment[] {
    const pinned: ClipComment[] = [];
    const rest: ClipComment[] = [];

    for (const comment of MOCK_COMMENTS[clipId] ?? EMPTY) {
      if (comment.parentId !== null) continue;
      (comment.pinned ? pinned : rest).push(comment);
    }

    const own = (this.published().get(clipId) ?? EMPTY).filter((c) => c.parentId === null);
    return [...pinned, ...own, ...rest];
  }

  /**
   * Respuestas de un comentario, las propias al final para que aparezcan como
   * continuación de la conversación y no desplacen lo ya leído.
   *
   * Recorre la lista en cada llamada en vez de precalcular un índice: un hilo
   * de clip son decenas de entradas, y mantener un mapa derivado sincronizado
   * cuesta más código del que ahorra.
   */
  repliesFor(clipId: string, parentId: string): readonly ClipComment[] {
    const seeded = (MOCK_COMMENTS[clipId] ?? EMPTY).filter((c) => c.parentId === parentId);
    const own = (this.published().get(clipId) ?? EMPTY).filter((c) => c.parentId === parentId);
    return [...seeded, ...own];
  }

  isExpanded(commentId: string): boolean {
    return this.expandedIds().has(commentId);
  }

  toggleReplies(commentId: string): void {
    this.expandedIds.update((ids) => toggleIn(ids, commentId));
  }

  /** Contador optimista: el valor del servidor más lo publicado en local. */
  countFor(clip: VideoClip): number {
    return clip.metrics.comments + (this.published().get(clip.id)?.length ?? 0);
  }

  openPanel(trigger: HTMLElement | null = null): void {
    this.trigger = trigger;
    this.open.set(true);
  }

  closePanel(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.replyingTo.set(null);
    this.trigger?.focus();
    this.trigger = null;
  }

  toggle(trigger: HTMLElement | null = null): void {
    if (this.open()) this.closePanel();
    else this.openPanel(trigger);
  }

  /**
   * Prepara una respuesta. Responder a una respuesta cuelga del mismo padre:
   * el hilo se queda en un solo nivel y no hay que paginar por rama.
   */
  startReply(comment: ClipComment, clipId: string): void {
    const parentId = comment.parentId ?? comment.id;
    const parent = this.findRoot(clipId, parentId) ?? comment;
    this.replyingTo.set(parent);
    this.expandedIds.update((ids) => new Set(ids).add(parent.id));
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  isLiked(commentId: string): boolean {
    return this.likedIds().has(commentId);
  }

  toggleLike(commentId: string): void {
    this.likedIds.update((ids) => toggleIn(ids, commentId));
  }

  likeCount(comment: ClipComment): number {
    return comment.likes + (this.isLiked(comment.id) ? 1 : 0);
  }

  /**
   * Publica el borrador en el hilo, como raíz o como respuesta según
   * `replyingTo`. Devuelve `false` si no había nada que publicar, para que la
   * vista no limpie un campo que el usuario sigue escribiendo.
   */
  publish(clipId: string, body: string): boolean {
    const text = body.trim().slice(0, COMMENT_MAX_LENGTH);
    if (text.length === 0) return false;

    const parent = this.replyingTo();
    this.sequence += 1;

    const comment: ClipComment = {
      id: `cm-local-${this.sequence}`,
      author: CURRENT_USER,
      body: text,
      ageMinutes: 0,
      likes: 0,
      pinned: false,
      parentId: parent?.id ?? null,
      own: true,
    };

    this.published.update((map) => {
      const next = new Map(map);
      next.set(clipId, [...(next.get(clipId) ?? EMPTY), comment]);
      return next;
    });

    // Una respuesta publicada con el hilo plegado quedaría invisible.
    if (parent) this.expandedIds.update((ids) => new Set(ids).add(parent.id));
    this.replyingTo.set(null);
    return true;
  }

  private findRoot(clipId: string, commentId: string): ClipComment | null {
    return this.roots(clipId).find((comment) => comment.id === commentId) ?? null;
  }
}

function toggleIn(source: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(source);
  if (!next.delete(id)) next.add(id);
  return next;
}
