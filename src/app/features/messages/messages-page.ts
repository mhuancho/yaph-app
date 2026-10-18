import {
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
import { RouterLink } from '@angular/router';
import { Conversation } from '../../core/models/feed';
import { MessagesStore } from '../../core/state/messages-store';
import { ProfileStore } from '../../core/state/profile-store';
import { Viewport } from '../../core/state/viewport';
import { AvatarOrb } from '../../ui/avatar-orb';
import { EmojiPicker } from '../../ui/emoji-picker';
import { Icon } from '../../ui/icon';
import { AgePipe } from '../../ui/metric-pipes';

/**
 * Bandeja y conversación.
 *
 * Maestro-detalle: en pantalla ancha conviven las dos columnas; en estrecha se
 * ve una u otra. La decisión se toma en TS y no solo con CSS porque cambia el
 * foco y el botón de volver, no únicamente la disposición.
 */
@Component({
  selector: 'app-messages-page',
  imports: [AvatarOrb, Icon, EmojiPicker, AgePipe, RouterLink],
  host: { class: 'block h-full' },
  template: `
    <div class="flex h-full flex-col pt-16 pb-24 md:grid md:grid-cols-[17rem_1fr] md:pt-0 md:pb-0">
      <!-- Lista -->
      @if (showList()) {
        <aside
          class="scrollbar-none min-h-0 flex-1 overflow-y-auto border-white/10 md:border-r"
          aria-label="Conversaciones"
        >
          <h1
            class="metric sticky top-0 z-10 bg-abyss/90 px-4 py-3 text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase"
          >
            Mensajes
            @if (messages.unreadTotal(); as unread) {
              <span class="ml-2 text-neon-magenta">{{ unread }} sin leer</span>
            }
          </h1>

          <ul>
            @for (conversation of messages.conversations(); track conversation.id) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                  [class]="rowClass(conversation)"
                  [attr.aria-current]="messages.openId() === conversation.id ? 'true' : null"
                  (click)="messages.openConversation(conversation.id)"
                >
                  <app-avatar-orb [creator]="conversation.peer" size="md" />

                  <span class="min-w-0 flex-1">
                    <span class="flex items-center gap-2">
                      <span class="truncate text-[0.8125rem] font-medium text-ink">
                        {{ conversation.peer.handle }}
                      </span>
                      @if (last(conversation); as message) {
                        <span class="metric ml-auto shrink-0 text-[0.625rem] text-ink-faint">
                          {{ message.ageMinutes | age }}
                        </span>
                      }
                    </span>
                    <span class="mt-0.5 flex items-center gap-2">
                      <span class="min-w-0 flex-1 truncate text-[0.75rem] text-ink-muted">
                        {{ last(conversation)?.body ?? 'Sin mensajes todavía' }}
                      </span>
                      @if (conversation.unread > 0) {
                        <span
                          class="metric grid min-w-4 shrink-0 place-items-center rounded-full bg-neon-magenta px-1 text-[0.5625rem] font-bold text-abyss"
                        >
                          {{ conversation.unread }}
                        </span>
                      }
                    </span>
                  </span>
                </button>
              </li>
            }
          </ul>
        </aside>
      }

      <!-- Conversación -->
      @if (showThread()) {
        @if (messages.open(); as conversation) {
          <section class="flex min-h-0 flex-1 flex-col" aria-label="Conversación">
            <header class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              @if (viewport.isCompact()) {
                <button
                  type="button"
                  class="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-ink-muted"
                  aria-label="Volver a la bandeja"
                  (click)="messages.close()"
                >
                  <app-icon name="chevron-down" class="size-4 rotate-90" />
                </button>
              }
              <a
                [routerLink]="['/perfil', conversation.peer.handle]"
                class="flex min-w-0 items-center gap-2.5"
              >
                <app-avatar-orb [creator]="conversation.peer" size="sm" />
                <span class="truncate text-[0.8125rem] font-medium text-ink">
                  {{ conversation.peer.handle }}
                </span>
              </a>
            </header>

            <ol #list class="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
              @for (message of conversation.messages; track message.id) {
                <li class="flex" [class.justify-end]="message.mine">
                  <div class="max-w-[80%]">
                    <p
                      class="rounded-2xl px-3.5 py-2 text-[0.8125rem] leading-snug"
                      [class]="bubbleClass(message.mine)"
                    >
                      {{ message.body }}
                    </p>
                    <p
                      class="metric mt-0.5 text-[0.5625rem] text-ink-faint"
                      [class.text-right]="message.mine"
                    >
                      {{ message.ageMinutes | age }}
                    </p>
                  </div>
                </li>
              } @empty {
                <li class="py-10 text-center text-[0.8125rem] text-ink-faint">
                  Escribe el primer mensaje.
                </li>
              }
            </ol>

            <form class="border-t border-white/10 px-4 py-3" (submit)="submit($event)">
              <div class="flex items-end gap-2.5">
                <div class="relative min-w-0 flex-1">
                  <label>
                    <span class="sr-only">Mensaje para {{ conversation.peer.handle }}</span>
                    <textarea
                      #composer
                      rows="1"
                      enterkeyhint="send"
                      placeholder="Escribe un mensaje…"
                      class="glass-flat scrollbar-none block max-h-28 min-h-[2.375rem] w-full resize-none overflow-y-auto rounded-2xl border border-white/12 py-2.5 pr-11 pl-3.5 text-[0.8125rem] leading-snug text-ink placeholder:text-ink-faint focus:border-neon-cyan/50 focus:outline-none"
                      [value]="draft()"
                      (input)="onInput($event)"
                      (keydown.enter)="submit($event)"
                    ></textarea>
                  </label>
                  <div class="absolute right-1.5 bottom-1.5">
                    <app-emoji-picker (pick)="insertEmoji($event)" />
                  </div>
                </div>

                <button
                  type="submit"
                  class="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full transition-[background-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  [class]="sendClass()"
                  [disabled]="!canSend()"
                  aria-label="Enviar mensaje"
                >
                  <app-icon name="send" class="size-[1.15rem]" [strokeWidth]="1.8" />
                </button>
              </div>
            </form>
          </section>
        } @else {
          <section class="grid min-h-0 flex-1 place-items-center px-6 text-center">
            <p class="text-sm text-ink-muted">Elige una conversación para empezar.</p>
          </section>
        }
      }
    </div>
  `,
})
export class MessagesPage {
  /** `?con=@handle` abre directamente ese hilo, p. ej. desde un perfil. */
  readonly con = input<string>();

  protected readonly messages = inject(MessagesStore);
  protected readonly viewport = inject(Viewport);
  private readonly profiles = inject(ProfileStore);

  private readonly listRef = viewChild<ElementRef<HTMLElement>>('list');
  private readonly composerRef = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  /** El borrador pertenece a la conversación: cambiar de hilo lo descarta. */
  protected readonly draft = linkedSignal<string | null, string>({
    source: () => this.messages.openId(),
    computation: () => '',
  });

  protected readonly canSend = computed(() => this.draft().trim().length > 0);
  protected readonly showList = computed(
    () => !this.viewport.isCompact() || this.messages.openId() === null,
  );
  protected readonly showThread = computed(
    () => !this.viewport.isCompact() || this.messages.openId() !== null,
  );

  constructor() {
    effect(() => {
      const handle = this.con();
      if (!handle) return;
      this.messages.openWithPeer(handle, this.profiles.byHandle(handle));
    });

    // Un hilo se lee por el final: al abrirlo y al enviar, abajo del todo.
    afterRenderEffect(() => {
      this.messages.open()?.messages.length;
      const list = this.listRef()?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }

  protected last(conversation: Conversation) {
    return this.messages.lastMessage(conversation);
  }

  protected rowClass(conversation: Conversation): string {
    return this.messages.openId() === conversation.id ? 'bg-neon-cyan/10' : 'hover:bg-white/5';
  }

  protected bubbleClass(mine: boolean): string {
    return mine
      ? 'bg-neon-cyan/20 text-ink border border-neon-cyan/30'
      : 'glass-flat border border-white/12 text-ink/90';
  }

  protected readonly sendClass = computed(() =>
    this.canSend() ? 'bg-neon-cyan text-abyss shadow-neon-cyan' : 'text-ink-faint',
  );

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected insertEmoji(emoji: string): void {
    const textarea = this.composerRef()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart ?? this.draft().length;
    const end = textarea.selectionEnd ?? start;
    const text = this.draft();
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`;

    this.draft.set(next);
    textarea.focus();
    const caret = Math.min(start + emoji.length, next.length);
    textarea.setSelectionRange(caret, caret);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.messages.send(this.draft())) this.draft.set('');
  }
}
