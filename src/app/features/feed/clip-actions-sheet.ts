import { afterNextRender, Component, ElementRef, inject, viewChild } from '@angular/core';
import { ClipActionsStore } from '../../core/state/clip-actions-store';
import { FeedStore } from '../../core/state/feed-store';
import { Icon } from '../../ui/icon';

/**
 * Menú de acciones del clip.
 *
 * `<dialog>` nativo con `showModal()`, igual que la hoja de comentarios: el
 * atrapado de foco, el cierre con Escape y el fondo inerte los pone la
 * plataforma.
 */
@Component({
  selector: 'app-clip-actions-sheet',
  imports: [Icon],
  host: { class: 'contents' },
  styles: `
    dialog {
      margin: auto 0 0;
      width: 100%;
      max-width: 100%;
      padding: 0 0 env(safe-area-inset-bottom);
      border: 0;
      border-top: 1px solid rgb(255 255 255 / 0.12);
      border-radius: 1.5rem 1.5rem 0 0;
      background-color: #0b0b12;
      color: inherit;
      animation: sheet-up 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    dialog::backdrop {
      background-color: rgb(5 5 8 / 0.72);
    }

    @media (min-width: 48rem) {
      dialog {
        margin: auto;
        max-width: 22rem;
        border: 1px solid rgb(255 255 255 / 0.12);
        border-radius: 1.25rem;
      }
    }

    .row {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      color: var(--color-ink);
      transition: background-color 150ms ease;
    }

    .row:hover {
      background-color: rgb(255 255 255 / 0.06);
    }

    @keyframes sheet-up {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
  `,
  template: `
    <dialog
      #sheet
      aria-label="Acciones del clip"
      (close)="actions.close()"
      (click)="onDialogClick($event)"
    >
      @if (actions.clip(); as clip) {
        <p class="metric truncate px-5 pt-4 pb-2 text-[0.6875rem] text-ink-faint">
          {{ clip.creator.handle }} · {{ clip.description }}
        </p>

        <ul class="pb-3">
          <li>
            <button type="button" class="row" (click)="actions.toggleSave()">
              <app-icon name="bookmark" class="size-4" [filled]="feed.isSaved(clip.id)" />
              {{ feed.isSaved(clip.id) ? 'Quitar de guardados' : 'Guardar clip' }}
            </button>
          </li>
          <li>
            <button type="button" class="row" (click)="actions.share()">
              <app-icon name="share" class="size-4" />
              Compartir
            </button>
          </li>
          <li>
            <button type="button" class="row" (click)="actions.notInterested()">
              <app-icon name="close" class="size-4" />
              No me interesa
            </button>
          </li>
        </ul>
      }
    </dialog>
  `,
})
export class ClipActionsSheet {
  protected readonly actions = inject(ClipActionsStore);
  protected readonly feed = inject(FeedStore);

  private readonly sheetRef = viewChild.required<ElementRef<HTMLDialogElement>>('sheet');

  constructor() {
    afterNextRender(() => {
      const dialog = this.sheetRef().nativeElement;
      if (typeof dialog.showModal === 'function') dialog.showModal();
    });
  }

  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.sheetRef().nativeElement) this.actions.close();
  }
}
