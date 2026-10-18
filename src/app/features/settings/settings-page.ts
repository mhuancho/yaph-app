import { Component, inject } from '@angular/core';
import { ModerationStore } from '../../core/state/moderation-store';
import { DataSaver, SettingsStore } from '../../core/state/settings-store';
import { ToastStore } from '../../core/state/toast-store';
import { Icon } from '../../ui/icon';

const DATA_SAVER_OPTIONS = [
  { id: 'auto', label: 'Automático', hint: 'Ajusta la calidad a la conexión' },
  { id: 'ahorro', label: 'Ahorro de datos', hint: 'Menor resolución, menos consumo' },
  { id: 'calidad', label: 'Máxima calidad', hint: 'Siempre la mejor fuente disponible' },
] as const satisfies readonly { id: DataSaver; label: string; hint: string }[];

/**
 * Preferencias.
 *
 * Aquí vive el interruptor de autoplay: quien no quiera reproducción
 * automática necesita decirlo explícitamente, no obtenerlo como efecto
 * secundario de `prefers-reduced-motion`, que gobierna otra cosa.
 */
@Component({
  selector: 'app-settings-page',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-xl px-4 md:px-6">
        <h1 class="font-display text-xl font-semibold tracking-tight text-ink">Ajustes</h1>

        @if (settings.ephemeral()) {
          <p
            class="glass mt-4 flex items-start gap-2.5 rounded-glass border border-neon-amber/40 p-3 text-[0.8125rem] text-ink-muted"
          >
            <app-icon name="bolt" class="mt-0.5 size-4 shrink-0 text-neon-amber" />
            El almacenamiento local no está disponible, así que estas preferencias solo duran lo que
            la pestaña.
          </p>
        }

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Reproducción
          </h2>
          <div class="glass mt-2 divide-y divide-white/8 rounded-glass border border-white/10">
            <label class="flex cursor-pointer items-center gap-3 p-4">
              <span class="min-w-0 flex-1">
                <span class="block text-[0.875rem] text-ink">Reproducción automática</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  Los clips empiezan solos al entrar en pantalla.
                </span>
              </span>
              <input
                type="checkbox"
                class="size-5 shrink-0 accent-[var(--color-neon-cyan)]"
                [checked]="settings.autoplay()"
                (change)="settings.autoplay.set($any($event.target).checked)"
              />
            </label>

            <label class="flex cursor-pointer items-center gap-3 p-4">
              <span class="min-w-0 flex-1">
                <span class="block text-[0.875rem] text-ink">Empezar silenciado</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  Los navegadores bloquean el sonido sin un gesto previo; desactivarlo puede impedir
                  que el clip arranque.
                </span>
              </span>
              <input
                type="checkbox"
                class="size-5 shrink-0 accent-[var(--color-neon-cyan)]"
                [checked]="settings.startMuted()"
                (change)="settings.startMuted.set($any($event.target).checked)"
              />
            </label>
          </div>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">Datos</h2>
          <fieldset class="glass mt-2 divide-y divide-white/8 rounded-glass border border-white/10">
            <legend class="sr-only">Calidad de reproducción</legend>
            @for (option of dataSavers; track option.id) {
              <label class="flex cursor-pointer items-center gap-3 p-4">
                <span class="min-w-0 flex-1">
                  <span class="block text-[0.875rem] text-ink">{{ option.label }}</span>
                  <span class="block text-[0.75rem] text-ink-muted">{{ option.hint }}</span>
                </span>
                <input
                  type="radio"
                  name="data-saver"
                  class="size-4 shrink-0 accent-[var(--color-neon-cyan)]"
                  [value]="option.id"
                  [checked]="settings.dataSaver() === option.id"
                  (change)="settings.dataSaver.set(option.id)"
                />
              </label>
            }
          </fieldset>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Interfaz
          </h2>
          <div class="glass mt-2 rounded-glass border border-white/10">
            <label class="flex cursor-pointer items-center gap-3 p-4">
              <span class="min-w-0 flex-1">
                <span class="block text-[0.875rem] text-ink">Panel de telemetría</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  Muestra resolución, buffer y fotogramas descartados del clip activo.
                </span>
              </span>
              <input
                type="checkbox"
                class="size-5 shrink-0 accent-[var(--color-neon-cyan)]"
                [checked]="settings.showTelemetry()"
                (change)="settings.showTelemetry.set($any($event.target).checked)"
              />
            </label>
          </div>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Privacidad
          </h2>
          <div class="glass mt-2 flex items-center gap-3 rounded-glass border border-white/10 p-4">
            <span class="min-w-0 flex-1">
              <span class="block text-[0.875rem] text-ink">Cuentas bloqueadas</span>
              <span class="block text-[0.75rem] text-ink-muted">
                No verás sus clips en ningún feed.
              </span>
            </span>
            <span class="metric shrink-0 text-sm text-ink">{{ moderation.blockedCount() }}</span>
            @if (moderation.blockedCount() > 0) {
              <button
                type="button"
                class="metric shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[0.625rem] text-ink-muted transition-colors hover:text-ink"
                (click)="unblockAll()"
              >
                Desbloquear
              </button>
            }
          </div>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Datos locales
          </h2>
          <p class="mt-2 text-[0.8125rem] text-ink-muted">
            Me gusta, guardados, seguimientos, comentarios y publicaciones se guardan en este
            navegador. Nada sale de aquí.
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-2 rounded-full border border-neon-magenta/50 px-4 py-2 text-xs font-semibold text-neon-magenta transition-colors hover:bg-neon-magenta/10"
            (click)="reset()"
          >
            <app-icon name="close" class="size-3.5" />
            Borrar datos locales
          </button>
        </section>
      </div>
    </div>
  `,
})
export class SettingsPage {
  protected readonly settings = inject(SettingsStore);
  protected readonly moderation = inject(ModerationStore);
  private readonly toasts = inject(ToastStore);

  protected readonly dataSavers = DATA_SAVER_OPTIONS;

  protected unblockAll(): void {
    this.moderation.unblockAll();
    this.toasts.show('Cuentas desbloqueadas', 'ok');
  }

  protected reset(): void {
    this.settings.reset();
    this.toasts.show('Datos locales borrados. Recarga para empezar de cero.', 'ok');
  }
}
