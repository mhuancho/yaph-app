import { Component, inject, input } from '@angular/core';
import { TrendsStore } from '../../core/state/trends-store';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Chat del directo.
 *
 * Mensajes efímeros: no se guardan, no se responden y no tienen me gusta. Por
 * eso no reutiliza `CommentRow`, que existe para una conversación persistente.
 *
 * `aria-live="polite"` y no `assertive`: son mensajes ambientales y no deben
 * interrumpir lo que el lector de pantalla esté anunciando.
 */
@Component({
  selector: 'app-live-chat-list',
  imports: [Icon, CompactPipe],
  host: { class: 'flex h-full min-h-0 flex-col' },
  template: `
    <p
      class="metric flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase"
    >
      <span class="size-1.5 animate-breathe rounded-full bg-neon-magenta"></span>
      en directo
      @if (viewers(); as count) {
        <span class="ml-auto inline-flex items-center gap-1.5 text-ink-muted">
          <app-icon name="viewers" class="size-3" [strokeWidth]="1.6" />
          {{ count | compact }}
        </span>
      }
    </p>

    <ol
      class="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      @for (message of trends.liveComments(); track message.id) {
        <li class="animate-ticker flex gap-2.5">
          <span
            aria-hidden="true"
            class="mt-1.5 size-1.5 shrink-0 rounded-full"
            [style.background-color]="message.accent"
          ></span>
          <p class="min-w-0 text-[0.8125rem] leading-snug">
            <span
              class="metric text-[0.6875rem]"
              [class.text-neon-cyan]="message.own"
              [class.text-ink-faint]="!message.own"
            >
              {{ message.handle }}
            </span>
            <span class="mt-0.5 block text-ink/90">{{ message.body }}</span>
          </p>
        </li>
      }
    </ol>
  `,
})
export class LiveChatList {
  readonly viewers = input<number | null>(null);
  protected readonly trends = inject(TrendsStore);
}
