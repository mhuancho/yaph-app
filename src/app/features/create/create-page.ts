import { Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import {
  ComposerStore,
  DESCRIPTION_MAX_LENGTH,
  SAMPLE_FOOTAGE,
} from '../../core/state/composer-store';
import { clipSources } from '../../core/data/mock-feed';
import { pickPlayableSource } from '../../core/util/media';
import { EmojiPicker } from '../../ui/emoji-picker';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Publicar un clip.
 *
 * Sin backend no hay subida ni transcodificación, así que el origen es
 * metraje de muestra en lugar de un archivo del disco. Todo lo demás es real:
 * la descripción extrae sus propios hashtags, el sonido sale del catálogo, la
 * portada elige un fotograma y publicar coloca el clip en el perfil y en el
 * feed. Conectar una subida de verdad solo cambia de dónde salen `sources`.
 */
@Component({
  selector: 'app-create-page',
  imports: [Icon, EmojiPicker, CompactPipe],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
        <h1 class="font-display text-xl font-semibold tracking-tight text-ink">Crear</h1>
        <p class="mt-1 text-[0.8125rem] text-ink-muted">
          Elige metraje, describe el clip y publícalo.
        </p>

        <div class="mt-5 grid gap-5 md:grid-cols-[14rem_1fr]">
          <!-- Previsualización 9:16, el mismo marco que usa el reproductor -->
          <div>
            <div
              class="relative aspect-[9/16] w-full overflow-hidden rounded-stage border border-white/10 bg-carbon"
              [style.--glow-from]="composer.footage().accent.from"
              [style.--glow-to]="composer.footage().accent.to"
            >
              <video
                class="absolute inset-0 size-full object-cover"
                muted
                loop
                playsinline
                autoplay
                [attr.src]="previewSrc()"
              ></video>
              <span class="clip-poster absolute inset-0 -z-10"></span>

              <span
                class="metric absolute right-2 bottom-2 rounded-full bg-abyss/70 px-2 py-[2px] text-[0.5625rem] text-ink-muted"
              >
                9:16 · 0:08
              </span>
            </div>

            <!-- Portada: elegir fotograma mueve el cabezal de la vista previa -->
            <label class="mt-3 block">
              <span
                class="metric mb-1 flex justify-between text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase"
              >
                <span>Portada</span>
                <span>{{ composer.coverSecond() }}s</span>
              </span>
              <input
                type="range"
                min="0"
                max="7"
                step="1"
                class="w-full accent-[var(--color-neon-cyan)]"
                [value]="composer.coverSecond()"
                (input)="onCover($event)"
              />
            </label>
          </div>

          <div>
            <fieldset>
              <legend class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Metraje
              </legend>
              <ul class="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
                @for (item of footage; track item.file) {
                  <li>
                    <button
                      type="button"
                      class="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border transition-colors"
                      [class]="footageClass(item.file)"
                      [style.--glow-from]="item.accent.from"
                      [style.--glow-to]="item.accent.to"
                      [attr.aria-pressed]="composer.footage().file === item.file"
                      [attr.aria-label]="item.name"
                      (click)="composer.footage.set(item)"
                    >
                      <span class="clip-poster absolute inset-0"></span>
                    </button>
                  </li>
                }
              </ul>
            </fieldset>

            <label class="mt-5 block">
              <span class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Descripción
              </span>
              <div class="relative mt-2">
                <textarea
                  #description
                  rows="4"
                  [attr.maxlength]="maxLength"
                  placeholder="Cuenta de qué va. Escribe #hashtags aquí mismo."
                  class="glass-flat w-full resize-none rounded-2xl border border-white/12 px-3.5 py-3 pr-11 text-[0.8125rem] leading-relaxed text-ink placeholder:text-ink-faint focus:border-neon-cyan/50 focus:outline-none"
                  [value]="composer.description()"
                  (input)="onDescription($event)"
                ></textarea>
                <div class="absolute right-1.5 bottom-2.5">
                  <app-emoji-picker (pick)="insertEmoji($event)" />
                </div>
              </div>
              <span
                class="metric mt-1 block text-right text-[0.625rem]"
                [class.text-neon-magenta]="composer.remaining() <= 0"
                [class.text-ink-faint]="composer.remaining() > 0"
              >
                {{ composer.remaining() }} caracteres
              </span>
            </label>

            @if (composer.hashtags().length > 0) {
              <ul class="mt-1 flex flex-wrap gap-1.5">
                @for (tag of composer.hashtags(); track tag) {
                  <li
                    class="metric rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-[3px] text-[0.6875rem] text-neon-cyan"
                  >
                    {{ tag }}
                  </li>
                }
              </ul>
            }

            <label class="mt-5 block">
              <span class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Sonido
              </span>
              <select
                class="glass-flat mt-2 w-full rounded-2xl border border-white/12 px-3.5 py-2.5 text-[0.8125rem] text-ink focus:border-neon-cyan/50 focus:outline-none"
                [value]="composer.sound()?.id ?? ''"
                (change)="onSound($event)"
              >
                <option value="">Sonido original</option>
                @for (sound of composer.sounds; track sound.id) {
                  <option [value]="sound.id">
                    {{ sound.title }} · {{ sound.author }} ({{ sound.uses | compact }})
                  </option>
                }
              </select>
            </label>

            <div class="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-[background-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                [class]="publishClass()"
                [disabled]="!composer.canPublish()"
                (click)="publish()"
              >
                <app-icon name="send" class="size-3.5" [strokeWidth]="2" />
                Publicar
              </button>
              <button
                type="button"
                class="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-neon-magenta/50 hover:text-ink"
                (click)="composer.reset()"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CreatePage {
  /** `?sonido=` llega desde la página de un sonido. */
  readonly sonido = input<string>();

  protected readonly composer = inject(ComposerStore);
  private readonly router = inject(Router);

  protected readonly footage = SAMPLE_FOOTAGE;
  protected readonly maxLength = DESCRIPTION_MAX_LENGTH;

  /** La vista previa negocia códec igual que el reproductor del feed. */
  protected readonly previewSrc = computed(() =>
    pickPlayableSource(clipSources(this.composer.footage().file)),
  );
  protected readonly publishClass = computed(() =>
    this.composer.canPublish()
      ? 'bg-neon-cyan text-abyss shadow-neon-cyan'
      : 'bg-white/10 text-ink-faint',
  );

  constructor() {
    effect(() => {
      const id = this.sonido();
      if (id) this.composer.selectSound(id);
    });
  }

  protected footageClass(file: string): string {
    return this.composer.footage().file === file
      ? 'border-neon-cyan shadow-neon-cyan'
      : 'border-white/12 hover:border-neon-cyan/50';
  }

  protected onDescription(event: Event): void {
    this.composer.description.set((event.target as HTMLTextAreaElement).value);
  }

  protected onCover(event: Event): void {
    this.composer.coverSecond.set(Number((event.target as HTMLInputElement).value));
  }

  protected onSound(event: Event): void {
    this.composer.selectSound((event.target as HTMLSelectElement).value || null);
  }

  protected insertEmoji(emoji: string): void {
    this.composer.description.update((text) => `${text}${emoji}`);
  }

  protected publish(): void {
    if (this.composer.publish()) void this.router.navigate(['/perfil']);
  }
}
