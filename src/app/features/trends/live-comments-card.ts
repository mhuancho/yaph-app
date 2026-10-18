import { Component, DestroyRef, inject } from '@angular/core';
import { TrendsStore } from '../../core/state/trends-store';
import { HudCard } from '../../ui/hud-card';

/**
 * Comentarios en tiempo real.
 *
 * El temporizador lo arranca este componente, no el store: así no queda un
 * intervalo corriendo cuando el panel no está montado (en móvil nunca lo está).
 * `TrendsStore.connect()` devuelve el teardown y además se pausa con la
 * pestaña en segundo plano.
 *
 * `aria-live="polite"` en vez de `assertive`: son mensajes ambientales y no
 * deben interrumpir lo que el lector de pantalla esté anunciando.
 */
@Component({
  selector: 'app-live-comments-card',
  imports: [HudCard],
  host: { class: 'block' },
  template: `
    <app-hud-card heading="Comentarios en vivo" icon="messages" tag="directo">
      <ul class="space-y-2.5" aria-live="polite" aria-relevant="additions">
        @for (comment of trends.liveComments(); track comment.id) {
          <li class="animate-ticker flex gap-2.5">
            <span
              aria-hidden="true"
              class="mt-1.5 size-1.5 shrink-0 rounded-full"
              [style.background-color]="comment.accent"
            ></span>
            <p class="min-w-0 text-[0.8125rem] leading-snug">
              <span class="metric text-[0.6875rem] text-ink-faint">{{ comment.handle }}</span>
              <span class="mt-0.5 block text-ink/90">{{ comment.body }}</span>
            </p>
          </li>
        }
      </ul>
    </app-hud-card>
  `,
})
export class LiveCommentsCard {
  protected readonly trends = inject(TrendsStore);

  constructor() {
    inject(DestroyRef).onDestroy(this.trends.connect());
  }
}
