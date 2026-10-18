import { Service, signal } from '@angular/core';
import { MOCK_LIVE_COMMENTS, MOCK_SUGGESTED, MOCK_TRENDING } from '../data/mock-feed';
import { LiveComment } from '../models/feed';

const VISIBLE_COMMENTS = 5;
const DEFAULT_INTERVAL_MS = 3_200;

/**
 * Tendencias del panel derecho y stream simulado de comentarios.
 *
 * El temporizador no se arranca en el constructor: un servicio raíz vive toda
 * la sesión y dejaría un intervalo corriendo aunque el panel no esté montado.
 * El componente llama a `connect()` y libera el teardown en su `DestroyRef`.
 */
@Service()
export class TrendsStore {
  readonly trending = signal(MOCK_TRENDING);
  readonly suggested = signal(MOCK_SUGGESTED);
  readonly liveComments = signal<readonly LiveComment[]>(
    MOCK_LIVE_COMMENTS.slice(0, VISIBLE_COMMENTS).map((comment, index) => stamp(comment, index)),
  );

  private cursor = VISIBLE_COMMENTS;

  /**
   * Arranca el stream. Devuelve la función de limpieza; también se detiene con
   * la pestaña en segundo plano para no gastar batería ni CPU invisible.
   */
  connect(intervalMs = DEFAULT_INTERVAL_MS): () => void {
    if (typeof window === 'undefined') return () => undefined;

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => this.pushNext(), intervalMs);
    };
    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  /** Inserta el siguiente comentario de la cola y recorta la lista visible. */
  pushNext(): void {
    const source = MOCK_LIVE_COMMENTS[this.cursor % MOCK_LIVE_COMMENTS.length];
    const comment = stamp(source, this.cursor);
    this.cursor += 1;
    this.liveComments.update((comments) => [comment, ...comments].slice(0, VISIBLE_COMMENTS));
  }
}

/**
 * Id único por aparición: el mismo comentario puede volver a entrar al ciclar
 * la cola y `@for` exige claves estables y distintas.
 */
function stamp(comment: LiveComment, sequence: number): LiveComment {
  return { ...comment, id: `${comment.id}#${sequence}` };
}
