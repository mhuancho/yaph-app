import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { clipsForSound, soundById } from '../../core/data/catalog';
import { FeedCollection } from '../../core/models/feed';
import { ToastStore } from '../../core/state/toast-store';
import { Soundwave } from '../../ui/soundwave';
import { ClipGrid } from '../profile/clip-grid';
import { CatalogHeader } from './catalog-header';

/** Publicaciones que usan un sonido. */
@Component({
  selector: 'app-sound-page',
  imports: [CatalogHeader, ClipGrid, Soundwave],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
        @if (sound(); as track) {
          <app-catalog-header
            [title]="track.title"
            [subtitle]="track.author"
            icon="music"
            [accent]="{ from: '#FF2A85', to: '#7C5CFF' }"
            [clipCount]="clips().length"
            [viewCount]="views()"
            actionLabel="Usar este sonido"
            activeLabel="Usar este sonido"
            actionIcon="create"
            (toggle)="useSound()"
          />

          <!-- La envolvente del audio, la misma que dibuja el reproductor. -->
          <app-soundwave
            class="mt-5 h-8 w-full text-neon-magenta"
            [envelope]="track.envelope"
            [bars]="48"
          />

          <div class="mt-5">
            <app-clip-grid
              [collection]="collection()"
              emptyText="Ningún clip usa este sonido todavía."
            />
          </div>
        } @else {
          <p class="py-20 text-center text-sm text-ink-muted">Ese sonido no existe.</p>
        }
      </div>
    </div>
  `,
})
export class SoundPage {
  readonly soundId = input.required<string>();

  private readonly toasts = inject(ToastStore);
  private readonly router = inject(Router);

  protected readonly sound = computed(() => soundById(this.soundId()));
  protected readonly clips = computed(() => clipsForSound(this.soundId()));
  protected readonly views = computed(() =>
    this.clips().reduce((sum, clip) => sum + clip.metrics.views, 0),
  );
  protected readonly collection = computed<FeedCollection>(() => ({
    id: `sound:${this.soundId()}`,
    label: this.sound()?.title ?? '',
    clips: this.clips(),
  }));

  protected useSound(): void {
    this.toasts.show(`Sonido listo: ${this.sound()?.title}`, 'ok');
    void this.router.navigate(['/crear'], { queryParams: { sonido: this.soundId() } });
  }
}
