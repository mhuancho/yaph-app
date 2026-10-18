import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ClipComment, VideoClip } from '../../core/models/feed';
import { COMMENT_MAX_LENGTH, CommentsStore } from '../../core/state/comments-store';
import { CURRENT_USER } from '../../core/data/mock-comments';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { AgePipe, CompactPipe } from '../../ui/metric-pipes';

/** A partir de aquí se muestra cuántos caracteres quedan. */
const WARN_REMAINING = 30;

/**
 * Hilo de comentarios de un clip: cabecera, lista y caja de escritura.
 *
 * Es el contenido puro, sin envoltorio: la columna derecha lo coloca tal cual
 * y `CommentsSheet` lo mete en un `<dialog>` modal en pantallas pequeñas. Así
 * la única diferencia entre ambas presentaciones es el contenedor, no el
 * marcado.
 *
 * La caja de escritura usa un signal y enlaces nativos en vez de Signal Forms:
 * es un campo de texto libre con un límite de longitud, sin esquema, campos
 * cruzados ni envío asíncrono. Cuando el composer gane respuestas, menciones y
 * adjuntos, ahí sí conviene migrarlo a `@angular/forms/signals`.
 */
@Component({
  selector: 'app-comments-thread',
  imports: [AvatarOrb, HoloBadge, Icon, CompactPipe, AgePipe],
  host: { class: 'flex h-full min-h-0 flex-col' },
  template: `
    <header class="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
      <h2 class="font-display text-sm font-semibold text-ink">
        {{ total() | compact }} comentarios
      </h2>
      <span class="metric truncate text-[0.6875rem] text-ink-faint">
        · {{ clip().creator.handle }}
      </span>

      <button
        type="button"
        class="ml-auto grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-ink-muted transition-colors duration-200 hover:border-neon-cyan/50 hover:text-neon-cyan"
        aria-label="Cerrar comentarios"
        (click)="comments.closePanel()"
      >
        <app-icon name="close" class="size-4" />
      </button>
    </header>

    <ol #list class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
      @for (comment of thread(); track comment.id) {
        <li class="animate-ticker flex gap-3 py-2.5">
          <app-avatar-orb [creator]="comment.author" size="sm" />

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="truncate text-[0.8125rem] font-medium text-ink">
                {{ comment.author.handle }}
              </span>
              @if (comment.author.badge; as badge) {
                <app-holo-badge [tier]="badge" />
              }
              @if (comment.pinned) {
                <span
                  class="metric inline-flex items-center gap-1 rounded-full border border-neon-amber/40 bg-neon-amber/10 px-1.5 py-[2px] text-[0.5625rem] tracking-[0.12em] text-neon-amber uppercase"
                >
                  <app-icon name="pin" class="size-2.5" [strokeWidth]="1.8" />
                  fijado
                </span>
              }
              @if (comment.own) {
                <span
                  class="metric rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-[2px] text-[0.5625rem] tracking-[0.12em] text-neon-cyan uppercase"
                >
                  tú
                </span>
              }
            </div>

            <p class="mt-1 text-[0.8125rem] leading-relaxed text-ink/90">{{ comment.body }}</p>

            <div class="metric mt-1.5 flex items-center gap-3 text-[0.625rem] text-ink-faint">
              <span>{{ comment.ageMinutes | age }}</span>
              <button type="button" class="transition-colors hover:text-ink">Responder</button>
              @if (comment.replies > 0) {
                <button type="button" class="text-neon-cyan transition-opacity hover:opacity-80">
                  Ver {{ comment.replies }} respuestas
                </button>
              }
            </div>
          </div>

          <button
            type="button"
            class="flex shrink-0 flex-col items-center gap-0.5 self-start pt-1 transition-colors duration-200"
            [class.text-neon-magenta]="comments.isLiked(comment.id)"
            [class.text-ink-faint]="!comments.isLiked(comment.id)"
            [attr.aria-pressed]="comments.isLiked(comment.id)"
            [attr.aria-label]="likeLabel(comment)"
            (click)="comments.toggleLike(comment.id)"
          >
            <app-icon name="heart" class="size-4" [filled]="comments.isLiked(comment.id)" />
            <span class="metric text-[0.625rem]">{{ comments.likeCount(comment) | compact }}</span>
          </button>
        </li>
      } @empty {
        <li class="py-10 text-center text-[0.8125rem] text-ink-faint">
          Todavía no hay comentarios. Empieza tú.
        </li>
      }
    </ol>

    <!-- Caja de escritura -->
    <form
      class="flex items-end gap-2.5 border-t border-white/10 px-4 py-3"
      (submit)="publish($event)"
    >
      <app-avatar-orb class="mb-1" [creator]="currentUser" size="sm" />

      <label class="min-w-0 flex-1">
        <span class="sr-only">Escribe un comentario para {{ clip().creator.handle }}</span>
        <textarea
          #composer
          rows="1"
          [attr.maxlength]="maxLength"
          placeholder="Añade un comentario…"
          class="glass-flat max-h-24 w-full resize-none rounded-2xl border border-white/12 px-3.5 py-2.5 text-[0.8125rem] text-ink placeholder:text-ink-faint focus:border-neon-cyan/50 focus:outline-none"
          [value]="draft()"
          (input)="onInput($event)"
          (keydown.enter)="publish($event)"
        ></textarea>
      </label>

      @if (remaining() <= warnRemaining) {
        <span
          class="metric mb-3 shrink-0 text-[0.625rem]"
          [class.text-neon-magenta]="remaining() <= 0"
          [class.text-ink-faint]="remaining() > 0"
          aria-live="polite"
        >
          {{ remaining() }}
        </span>
      }

      <button
        type="submit"
        class="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40"
        [class.bg-neon-cyan]="canPublish()"
        [class.text-abyss]="canPublish()"
        [class.shadow-neon-cyan]="canPublish()"
        [class.text-ink-faint]="!canPublish()"
        [disabled]="!canPublish()"
        aria-label="Publicar comentario"
      >
        <app-icon name="send" class="size-[1.15rem]" [strokeWidth]="1.8" />
      </button>
    </form>
  `,
})
export class CommentsThread {
  readonly clip = input.required<VideoClip>();
  /**
   * Enfocar la caja al abrir solo tiene sentido con teclado físico: en un
   * móvil levantaría el teclado virtual sobre el hilo que se quiere leer.
   */
  readonly autoFocus = input(false);

  protected readonly comments = inject(CommentsStore);
  protected readonly currentUser = CURRENT_USER;
  protected readonly maxLength = COMMENT_MAX_LENGTH;
  protected readonly warnRemaining = WARN_REMAINING;

  private readonly listRef = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly composerRef = viewChild.required<ElementRef<HTMLTextAreaElement>>('composer');

  /** El borrador se descarta al cambiar de clip: pertenece a esa conversación. */
  protected readonly draft = linkedSignal<VideoClip, string>({
    source: this.clip,
    computation: () => '',
  });

  protected readonly thread = computed(() => this.comments.commentsFor(this.clip().id));
  protected readonly total = computed(() => this.comments.countFor(this.clip()));
  protected readonly remaining = computed(() => COMMENT_MAX_LENGTH - this.draft().length);
  protected readonly canPublish = computed(() => this.draft().trim().length > 0);

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.composerRef().nativeElement.focus();
    });
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected likeLabel(comment: ClipComment): string {
    const verb = this.comments.isLiked(comment.id) ? 'Quitar me gusta de' : 'Me gusta a';
    return `${verb} el comentario de ${comment.author.handle}`;
  }

  /**
   * `keydown.enter` de Angular no coincide cuando hay modificadores, así que
   * Mayús+Intro sigue insertando un salto de línea sin código extra.
   */
  protected publish(event: Event): void {
    event.preventDefault();
    if (!this.comments.publish(this.clip().id, this.draft())) return;

    this.draft.set('');
    // El comentario recién publicado entra arriba del todo; sin esto quedaría
    // fuera de la vista si el hilo estaba desplazado.
    this.listRef().nativeElement.scrollTo({ top: 0 });
  }
}
