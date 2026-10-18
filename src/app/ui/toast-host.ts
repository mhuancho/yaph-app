import { Component, inject } from '@angular/core';
import { ToastStore } from '../core/state/toast-store';
import { Icon } from './icon';

/**
 * Pila de avisos.
 *
 * `role="status"` con `aria-live="polite"`: son confirmaciones, no alertas, y
 * no deben interrumpir lo que el lector de pantalla esté anunciando. Se
 * coloca por encima de la barra inferior móvil para no quedar tapada.
 */
@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  host: { class: 'contents' },
  template: `
    <div
      role="status"
      aria-live="polite"
      class="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="glass animate-ticker pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full border px-4 py-2.5 text-[0.8125rem] text-ink shadow-hud"
          [class]="toneClass(toast.tone)"
        >
          <span class="truncate">{{ toast.message }}</span>
          <button
            type="button"
            class="ml-1 grid size-5 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:text-ink"
            aria-label="Descartar aviso"
            (click)="toasts.dismiss(toast.id)"
          >
            <app-icon name="close" class="size-3" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastStore);

  protected toneClass(tone: string): string {
    switch (tone) {
      case 'ok':
        return 'border-neon-cyan/50 shadow-neon-cyan';
      case 'error':
        return 'border-neon-magenta/50 shadow-neon-magenta';
      default:
        return 'border-white/15';
    }
  }
}
