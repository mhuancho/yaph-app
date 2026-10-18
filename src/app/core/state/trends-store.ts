import { inject, Service, signal } from '@angular/core';
import { MOCK_LIVE_COMMENTS, MOCK_SUGGESTED, MOCK_TRENDING } from '../data/mock-feed';
import { LiveComment } from '../models/feed';
import { SessionStore } from './session-store';

const VISIBLE_COMMENTS = 5;
const DEFAULT_INTERVAL_MS = 3_200;

/**
 * Tendencias del panel derecho y chat simulado de los directos.
 *
 * El temporizador no se arranca en el constructor: un servicio raíz vive toda
 * la sesión y dejaría un intervalo corriendo aunque nadie lo mire. Quien lo
 * necesita llama a `connect()` y libera el teardown en su `DestroyRef`.
 *
 * `connect()` lleva cuenta de suscriptores porque el chat tiene dos consumidores
 * a la vez (la tarjeta del HUD y la pestaña «En vivo» del panel): sin el
 * recuento habría dos intervalos empujando a la misma lista y el chat correría
 * al doble de velocidad.
 */
@Service()
export class TrendsStore {
  private readonly session = inject(SessionStore);

  readonly trending = signal(MOCK_TRENDING);
  readonly suggested = signal(MOCK_SUGGESTED);
  readonly liveComments = signal<readonly LiveComment[]>(
    MOCK_LIVE_COMMENTS.slice(0, VISIBLE_COMMENTS).map((comment, index) => stamp(comment, index)),
  );

  private cursor = VISIBLE_COMMENTS;
  private subscribers = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private detach: (() => void) | null = null;

  /**
   * Arranca el chat. Devuelve la función de limpieza; también se detiene con
   * la pestaña en segundo plano para no gastar batería ni CPU invisible.
   */
  connect(intervalMs = DEFAULT_INTERVAL_MS): () => void {
    if (typeof window === 'undefined') return () => undefined;

    this.subscribers += 1;
    if (this.subscribers === 1) this.attach(intervalMs);

    let released = false;
    return () => {
      // Idempotente: un `DestroyRef` puede disparar su limpieza más de una vez
      // y el recuento quedaría en negativo.
      if (released) return;
      released = true;

      this.subscribers -= 1;
      if (this.subscribers === 0) this.release();
    };
  }

  /** Envía un mensaje propio al chat del directo. */
  sendOwn(body: string): boolean {
    const text = body.trim();
    if (text.length === 0) return false;

    const author = this.session.profile();
    this.cursor += 1;
    this.liveComments.update((comments) =>
      [
        {
          id: `lc-own-${this.cursor}`,
          handle: author.handle,
          body: text,
          accent: author.avatar.from,
          own: true,
        },
        ...comments,
      ].slice(0, VISIBLE_COMMENTS),
    );
    return true;
  }

  private attach(intervalMs: number): void {
    const start = () => {
      if (this.timer !== null) return;
      this.timer = setInterval(() => this.pushNext(), intervalMs);
    };
    const stop = () => {
      if (this.timer === null) return;
      clearInterval(this.timer);
      this.timer = null;
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());

    document.addEventListener('visibilitychange', onVisibility);
    onVisibility();

    this.detach = () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }

  private release(): void {
    this.detach?.();
    this.detach = null;
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
