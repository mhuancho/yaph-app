import { Component, input } from '@angular/core';
import { CreatorProfile, VideoClip } from '../../core/models/feed';
import { ClipTile } from './clip-tile';

/**
 * Parrilla de publicaciones: tres columnas pegadas, como cualquier perfil de
 * video vertical. El hueco entre celdas es mínimo a propósito; lo que separa
 * las miniaturas es el póster, no el aire.
 */
@Component({
  selector: 'app-clip-grid',
  imports: [ClipTile],
  host: { class: 'block' },
  template: `
    @if (clips().length > 0) {
      <ul class="grid grid-cols-3 gap-0.5">
        @for (clip of clips(); track clip.id; let first = $first) {
          <li>
            <app-clip-tile [clip]="clip" [profile]="profile()" [pinned]="first && pinFirst()" />
          </li>
        }
      </ul>
    } @else {
      <p class="px-6 py-16 text-center text-[0.8125rem] text-ink-faint">{{ emptyText() }}</p>
    }
  `,
})
export class ClipGrid {
  readonly clips = input.required<readonly VideoClip[]>();
  readonly profile = input.required<CreatorProfile>();
  readonly emptyText = input('Todavía no hay nada por aquí.');
  readonly pinFirst = input(false);
}
