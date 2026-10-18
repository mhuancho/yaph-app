import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { clipsForTag } from '../../core/data/catalog';
import { FeedCollection } from '../../core/models/feed';
import { ToastStore } from '../../core/state/toast-store';
import { ClipGrid } from '../profile/clip-grid';
import { CatalogHeader } from './catalog-header';

/** Publicaciones de un hashtag. */
@Component({
  selector: 'app-tag-page',
  imports: [CatalogHeader, ClipGrid],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
        <app-catalog-header
          [title]="'#' + tag()"
          icon="hash"
          [clipCount]="clips().length"
          [viewCount]="views()"
          actionLabel="Seguir hashtag"
          activeLabel="Siguiendo"
          actionIcon="hash"
          [active]="followed()"
          (toggle)="toggleFollow()"
        />

        <div class="mt-5">
          <app-clip-grid
            [collection]="collection()"
            emptyText="Ningún clip usa este hashtag todavía."
          />
        </div>
      </div>
    </div>
  `,
})
export class TagPage {
  readonly tag = input.required<string>();

  private readonly toasts = inject(ToastStore);
  protected readonly followed = signal(false);

  protected readonly clips = computed(() => clipsForTag(this.tag()));
  protected readonly views = computed(() =>
    this.clips().reduce((sum, clip) => sum + clip.metrics.views, 0),
  );
  protected readonly collection = computed<FeedCollection>(() => ({
    id: `tag:${this.tag()}`,
    label: `#${this.tag()}`,
    clips: this.clips(),
  }));

  constructor() {
    // Cambiar de hashtag no debe arrastrar el estado de seguimiento anterior.
    effect(() => {
      this.tag();
      this.followed.set(false);
    });
  }

  protected toggleFollow(): void {
    this.followed.update((value) => !value);
    this.toasts.show(
      this.followed() ? `Sigues #${this.tag()}` : `Dejaste de seguir #${this.tag()}`,
      'ok',
    );
  }
}
