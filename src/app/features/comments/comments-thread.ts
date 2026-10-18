import {
  afterNextRender,
  afterRenderEffect,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ClipComment, VideoClip } from '../../core/models/feed';
import { COMMENT_MAX_LENGTH, CommentsStore } from '../../core/state/comments-store';
import { SessionStore } from '../../core/state/session-store';
import { TrendsStore } from '../../core/state/trends-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { EmojiPicker } from '../../ui/emoji-picker';
import { Icon } from '../../ui/icon';
import { formatCompact } from '../../core/util/format';
import { CommentRow } from './comment-row';
import { LiveChatList } from './live-chat-list';

type Tab = 'live' | 'thread';

/** A partir de aquí se muestra cuántos caracteres quedan. */
const WARN_REMAINING = 30;

/** Alto máximo del campo antes de que empiece a desplazarse (≈5 líneas). */
const COMPOSER_MAX_PX = 112;

/** Ids únicos por instancia para enlazar pestañas y paneles con ARIA. */
let instances = 0;

/**
 * Conversación de un clip.
 *
 * Un directo y un video corto conversan distinto, así que el panel ofrece lo
 * que corresponde a cada uno:
 *
 * - **Directo**: dos pestañas. «En directo» es el chat efímero, sincronizado
 *   con la emisión; «Comentarios» es el hilo que queda cuando el directo
 *   termine. Son dos conversaciones reales, no dos vistas del mismo dato.
 * - **Video corto**: solo el hilo, sin pestañas que elegir.
 *
 * La caja de escritura es la misma en ambos casos y publica donde toca según
 * la pestaña activa.
 *
 * Usa un signal y enlaces nativos en vez de Signal Forms: es un campo de texto
 * libre con un límite de longitud, sin esquema, campos cruzados ni envío
 * asíncrono. Cuando el composer gane menciones y adjuntos, ahí sí conviene
 * migrarlo a `@angular/forms/signals`.
 */
@Component({
  selector: 'app-comments-thread',
  imports: [AvatarOrb, Icon, EmojiPicker, CommentRow, LiveChatList],
  host: { class: 'flex h-full min-h-0 flex-col' },
  template: `
    <header class="border-b border-white/10 px-4 pt-3.5 pb-2.5">
      <div class="flex items-center gap-3">
        <h2 class="font-display text-sm font-semibold text-ink">{{ heading() }}</h2>
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
      </div>

      <!-- Las pestañas solo existen en un directo: en un video corto no hay
           nada entre lo que elegir y un selector de una opción es ruido. -->
      @if (isLive()) {
        <div
          role="tablist"
          aria-label="Conversación del clip"
          class="mt-3 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1"
          (keydown.arrowright)="moveTab(1, $event)"
          (keydown.arrowleft)="moveTab(-1, $event)"
        >
          @for (option of tabs; track option.id) {
            <button
              type="button"
              role="tab"
              [id]="option.id + uid"
              [attr.aria-selected]="tab() === option.id"
              [attr.aria-controls]="'panel-' + option.id + uid"
              [tabIndex]="tab() === option.id ? 0 : -1"
              class="metric flex-1 rounded-full px-3 py-1.5 text-[0.6875rem] tracking-[0.1em] uppercase transition-[background-color,color,box-shadow] duration-200"
              [class]="tabClass(option.id)"
              (click)="tab.set(option.id)"
            >
              {{ option.label }}
            </button>
          }
        </div>
      }
    </header>

    @if (tab() === 'live') {
      <app-live-chat-list
        role="tabpanel"
        [id]="'panel-live' + uid"
        [attr.aria-labelledby]="'live' + uid"
        class="min-h-0 flex-1"
        [viewers]="clip().liveViewers"
      />
    } @else {
      <ol
        #list
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
        [attr.role]="isLive() ? 'tabpanel' : null"
        [attr.id]="isLive() ? 'panel-thread' + uid : null"
        [attr.aria-labelledby]="isLive() ? 'thread' + uid : null"
      >
        @for (comment of roots(); track comment.id) {
          <li class="animate-ticker py-2.5">
            <app-comment-row [comment]="comment" [clipId]="clip().id" />

            @if (replyCount(comment); as count) {
              <button
                type="button"
                class="metric mt-1.5 ml-11 inline-flex items-center gap-1.5 text-[0.625rem] text-neon-cyan transition-opacity hover:opacity-80"
                [attr.aria-expanded]="comments.isExpanded(comment.id)"
                (click)="comments.toggleReplies(comment.id)"
              >
                <span class="h-px w-5 bg-current opacity-50"></span>
                {{ comments.isExpanded(comment.id) ? 'Ocultar' : 'Ver' }} {{ count }}
                {{ count === 1 ? 'respuesta' : 'respuestas' }}
              </button>

              @if (comments.isExpanded(comment.id)) {
                <ol class="mt-1 ml-11 space-y-3 border-l border-white/10 pt-1 pl-3">
                  @for (answer of replies(comment); track answer.id) {
                    <li class="animate-ticker">
                      <app-comment-row [comment]="answer" [clipId]="clip().id" />
                    </li>
                  }
                </ol>
              }
            }
          </li>
        } @empty {
          <li class="py-10 text-center text-[0.8125rem] text-ink-faint">
            Todavía no hay comentarios. Empieza tú.
          </li>
        }
      </ol>
    }

    <!-- Caja de escritura -->
    <div class="border-t border-white/10">
      @if (comments.replyingTo(); as parent) {
        <p class="flex items-center gap-2 bg-white/5 px-4 py-1.5 text-[0.6875rem] text-ink-muted">
          <app-icon name="reply" class="size-3 text-neon-cyan" [strokeWidth]="1.8" />
          Respondiendo a <span class="font-medium text-ink">{{ parent.author.handle }}</span>
          <button
            type="button"
            class="ml-auto grid size-5 place-items-center rounded-full text-ink-faint transition-colors hover:text-ink"
            aria-label="Cancelar respuesta"
            (click)="comments.cancelReply()"
          >
            <app-icon name="close" class="size-3" />
          </button>
        </p>
      }

      <form class="px-4 py-3" (submit)="submit($event)">
        <div class="flex items-end gap-2.5">
          <app-avatar-orb class="mb-1" [creator]="currentUser()" size="sm" />

          <!-- El campo ocupa toda la fila y el selector de emoji va dentro:
               repartido en columnas, el placeholder no cabía en una línea y se
               recortaba contra la altura de una sola fila. -->
          <div class="relative min-w-0 flex-1">
            <label>
              <span class="sr-only">{{ composerLabel() }}</span>
              <textarea
                #composer
                rows="1"
                enterkeyhint="send"
                [attr.maxlength]="maxLength"
                [attr.placeholder]="placeholder()"
                [attr.aria-describedby]="remaining() <= warnRemaining ? counterId : null"
                class="glass-flat scrollbar-none block max-h-28 min-h-[2.375rem] w-full resize-none overflow-y-auto rounded-2xl border border-white/12 py-2.5 pr-11 pl-3.5 text-[0.8125rem] leading-snug text-ink placeholder:text-ink-faint focus:border-neon-cyan/50 focus:outline-none"
                [value]="draft()"
                (input)="onInput($event)"
                (keydown.enter)="submit($event)"
              ></textarea>
            </label>

            <!-- El envoltorio lleva la posición: el host del selector ya es
                 relative para anclar su panel, y dos utilidades de position en
                 el mismo elemento se resuelven por orden de la cascada. -->
            <div class="absolute right-1.5 bottom-1.5">
              <app-emoji-picker (pick)="insertEmoji($event)" />
            </div>
          </div>

          <button
            type="submit"
            class="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40"
            [class]="submitClass()"
            [disabled]="!canSubmit()"
            [attr.aria-label]="submitLabel()"
          >
            <app-icon name="send" class="size-[1.15rem]" [strokeWidth]="1.8" />
          </button>
        </div>

        @if (remaining() <= warnRemaining) {
          <p
            [id]="counterId"
            class="metric mt-1.5 pr-12 text-right text-[0.625rem]"
            [class.text-neon-magenta]="remaining() <= 0"
            [class.text-ink-faint]="remaining() > 0"
            aria-live="polite"
          >
            {{ remaining() }} caracteres
          </p>
        }
      </form>
    </div>
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
  private readonly trends = inject(TrendsStore);
  private readonly session = inject(SessionStore);

  /** Quien firma lo que se escribe aquí: el perfil de la sesión. */
  protected readonly currentUser = this.session.profile;
  protected readonly maxLength = COMMENT_MAX_LENGTH;
  protected readonly warnRemaining = WARN_REMAINING;
  protected readonly uid = `-${(instances += 1)}`;
  protected readonly counterId = `composer-count${this.uid}`;
  protected readonly tabs = [
    { id: 'live', label: 'En directo' },
    { id: 'thread', label: 'Comentarios' },
  ] as const satisfies readonly { id: Tab; label: string }[];

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly composerRef = viewChild.required<ElementRef<HTMLTextAreaElement>>('composer');

  protected readonly isLive = computed(() => this.clip().kind === 'live');

  /**
   * Al cambiar de clip la pestaña vuelve a la que corresponde a ese clip; en
   * un corto no hay otra opción que el hilo. Dentro del mismo clip el usuario
   * manda, que es justo lo que resuelve `linkedSignal`.
   */
  protected readonly tab = linkedSignal<VideoClip, Tab>({
    source: this.clip,
    computation: (clip) => (clip.kind === 'live' ? 'live' : 'thread'),
  });

  /** El borrador se descarta al cambiar de clip: pertenece a esa conversación. */
  protected readonly draft = linkedSignal<VideoClip, string>({
    source: this.clip,
    computation: () => '',
  });

  protected readonly roots = computed(() => this.comments.roots(this.clip().id));
  protected readonly remaining = computed(() => COMMENT_MAX_LENGTH - this.draft().length);
  protected readonly canSubmit = computed(() => this.draft().trim().length > 0);

  protected readonly heading = computed(() =>
    this.tab() === 'live'
      ? 'Chat del directo'
      : `${formatCompact(this.comments.countFor(this.clip()))} comentarios`,
  );
  protected readonly placeholder = computed(() =>
    this.tab() === 'live' ? 'Escribe en el directo…' : 'Añade un comentario…',
  );
  protected readonly composerLabel = computed(
    () => `${this.placeholder()} en el clip de ${this.clip().creator.handle}`,
  );
  protected readonly submitLabel = computed(() =>
    this.tab() === 'live' ? 'Enviar al directo' : 'Publicar comentario',
  );

  constructor() {
    afterNextRender(() => {
      if (this.autoFocus()) this.composerRef().nativeElement.focus();
    });

    // El campo crece con el texto. `afterRenderEffect` y no `effect` porque
    // hay que medir el DOM ya actualizado con el nuevo valor.
    //
    // No se usa `field-sizing: content`, que haría esto en CSS puro, porque
    // todavía no está en todos los motores; en cuanto lo esté, este bloque se
    // sustituye por una línea de estilos.
    afterRenderEffect(() => {
      this.draft();
      this.autosize();
    });

    // El chat solo corre mientras su pestaña está a la vista. `TrendsStore`
    // lleva recuento de suscriptores, así que convivir con la tarjeta del HUD
    // no duplica el temporizador.
    effect((onCleanup) => {
      if (this.tab() !== 'live') return;
      onCleanup(this.trends.connect());
    });

    // Cambiar de clip o de pestaña invalida la respuesta en curso: apuntaba a
    // un comentario que ya no está en pantalla.
    effect(() => {
      this.clip();
      this.tab();
      this.comments.cancelReply();
    });
  }

  protected replies(comment: ClipComment): readonly ClipComment[] {
    return this.comments.repliesFor(this.clip().id, comment.id);
  }

  /** Devuelve 0 como falsy para que `@if (…; as count)` oculte el bloque. */
  protected replyCount(comment: ClipComment): number {
    return this.replies(comment).length;
  }

  /**
   * Clases completas por rama: `bg-neon-cyan` y compañía se alternan juntas y
   * un nombre con barra no se puede escribir como enlace `[class.…]`.
   */
  protected readonly submitClass = computed(() =>
    this.canSubmit() ? 'bg-neon-cyan text-abyss shadow-neon-cyan' : 'text-ink-faint',
  );

  protected tabClass(id: Tab): string {
    return this.tab() === id
      ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
      : 'text-ink-muted hover:text-ink';
  }

  protected moveTab(delta: number, event: Event): void {
    event.preventDefault();
    const index = this.tabs.findIndex((option) => option.id === this.tab());
    const next = this.tabs[(index + delta + this.tabs.length) % this.tabs.length];
    this.tab.set(next.id);
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * Ajusta el alto al contenido. Leer `scrollHeight` fuerza un cálculo de
   * layout, pero solo ocurre cuando cambia el texto, no en cada frame.
   *
   * En la hoja móvil el primer pase ocurre con el `<dialog>` todavía sin
   * abrir: el campo no está renderizado, `scrollHeight` vale 0 y fijar ese
   * valor dejaría la caja aplastada. Se descarta la medida y el `min-h` del
   * propio campo sostiene la altura hasta que haya algo que medir.
   */
  private autosize(): void {
    const textarea = this.composerRef().nativeElement;
    textarea.style.height = 'auto';

    const measured = textarea.scrollHeight;
    if (measured === 0) return;

    textarea.style.height = `${Math.min(measured, COMPOSER_MAX_PX)}px`;
  }

  /** Inserta el emoji donde está el cursor, no al final del texto. */
  protected insertEmoji(emoji: string): void {
    const textarea = this.composerRef().nativeElement;
    const start = textarea.selectionStart ?? this.draft().length;
    const end = textarea.selectionEnd ?? start;
    const text = this.draft();
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`.slice(0, COMMENT_MAX_LENGTH);

    this.draft.set(next);
    textarea.focus();
    // El cursor se recoloca tras el emoji; sin esto saltaría al final.
    const caret = Math.min(start + emoji.length, next.length);
    textarea.setSelectionRange(caret, caret);
  }

  /**
   * `keydown.enter` de Angular no coincide cuando hay modificadores, así que
   * Mayús+Intro sigue insertando un salto de línea sin código extra.
   */
  protected submit(event: Event): void {
    event.preventDefault();

    const sent =
      this.tab() === 'live'
        ? this.trends.sendOwn(this.draft())
        : this.comments.publish(this.clip().id, this.draft());
    if (!sent) return;

    this.draft.set('');
    // El comentario recién publicado entra arriba del todo; sin esto quedaría
    // fuera de la vista si el hilo estaba desplazado.
    this.listRef()?.nativeElement.scrollTo({ top: 0 });
  }
}
