import { Component, inject } from '@angular/core';
import { I18nStore, Locale } from '../../core/i18n/i18n-store';
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
        <h1 class="font-display text-xl font-semibold tracking-tight text-ink">
          {{ i18n.t('settings.title') }}
        </h1>

        @if (settings.ephemeral()) {
          <p
            class="glass mt-4 flex items-start gap-2.5 rounded-glass border border-neon-amber/40 p-3 text-[0.8125rem] text-ink-muted"
          >
            <app-icon name="bolt" class="mt-0.5 size-4 shrink-0 text-neon-amber" />
            {{ i18n.t('settings.ephemeral') }}
          </p>
        }

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            {{ i18n.t('settings.playback') }}
          </h2>
          <div class="glass mt-2 divide-y divide-white/8 rounded-glass border border-white/10">
            <label class="flex cursor-pointer items-center gap-3 p-4">
              <span class="min-w-0 flex-1">
                <span class="block text-[0.875rem] text-ink">{{
                  i18n.t('settings.autoplay')
                }}</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  {{ i18n.t('settings.autoplay.hint') }}
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
                <span class="block text-[0.875rem] text-ink">{{ i18n.t('settings.muted') }}</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  {{ i18n.t('settings.muted.hint') }}
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
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            {{ i18n.t('settings.data') }}
          </h2>
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
            {{ i18n.t('settings.interface') }}
          </h2>
          <div class="glass mt-2 rounded-glass border border-white/10">
            <label class="flex cursor-pointer items-center gap-3 p-4">
              <span class="min-w-0 flex-1">
                <span class="block text-[0.875rem] text-ink">{{
                  i18n.t('settings.telemetry')
                }}</span>
                <span class="block text-[0.75rem] text-ink-muted">
                  {{ i18n.t('settings.telemetry.hint') }}
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
            {{ i18n.t('settings.language') }}
          </h2>
          <div class="glass mt-2 rounded-glass border border-white/10 p-4">
            <label class="flex items-center gap-3">
              <span class="min-w-0 flex-1 text-[0.75rem] text-ink-muted">
                {{ i18n.t('settings.language.hint') }}
              </span>
              <select
                class="glass-flat shrink-0 rounded-xl border border-white/12 px-3 py-2 text-[0.8125rem] text-ink focus:border-neon-cyan/50 focus:outline-none"
                [value]="i18n.locale()"
                (change)="onLocale($event)"
              >
                @for (option of i18n.locales; track option.id) {
                  <option [value]="option.id">{{ option.label }}</option>
                }
              </select>
            </label>
          </div>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            {{ i18n.t('settings.privacy') }}
          </h2>
          <div class="glass mt-2 flex items-center gap-3 rounded-glass border border-white/10 p-4">
            <span class="min-w-0 flex-1">
              <span class="block text-[0.875rem] text-ink">{{ i18n.t('settings.blocked') }}</span>
              <span class="block text-[0.75rem] text-ink-muted">
                {{ i18n.t('settings.blocked.hint') }}
              </span>
            </span>
            <span class="metric shrink-0 text-sm text-ink">{{ moderation.blockedCount() }}</span>
            @if (moderation.blockedCount() > 0) {
              <button
                type="button"
                class="metric shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-[0.625rem] text-ink-muted transition-colors hover:text-ink"
                (click)="unblockAll()"
              >
                {{ i18n.t('settings.unblock') }}
              </button>
            }
          </div>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            {{ i18n.t('settings.local') }}
          </h2>
          <p class="mt-2 text-[0.8125rem] text-ink-muted">
            {{ i18n.t('settings.local.hint') }}
          </p>
          <button
            type="button"
            class="mt-3 inline-flex items-center gap-2 rounded-full border border-neon-magenta/50 px-4 py-2 text-xs font-semibold text-neon-magenta transition-colors hover:bg-neon-magenta/10"
            (click)="reset()"
          >
            <app-icon name="close" class="size-3.5" />
            {{ i18n.t('settings.local.clear') }}
          </button>
        </section>
      </div>
    </div>
  `,
})
export class SettingsPage {
  protected readonly settings = inject(SettingsStore);
  protected readonly i18n = inject(I18nStore);
  protected readonly moderation = inject(ModerationStore);
  private readonly toasts = inject(ToastStore);

  protected readonly dataSavers = DATA_SAVER_OPTIONS;

  protected onLocale(event: Event): void {
    this.i18n.locale.set((event.target as HTMLSelectElement).value as Locale);
  }

  protected unblockAll(): void {
    this.moderation.unblockAll();
    this.toasts.show('Cuentas desbloqueadas', 'ok');
  }

  protected reset(): void {
    this.settings.reset();
    this.toasts.show('Datos locales borrados. Recarga para empezar de cero.', 'ok');
  }
}
