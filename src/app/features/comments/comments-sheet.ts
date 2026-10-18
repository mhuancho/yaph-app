import { afterNextRender, Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { VideoClip } from '../../core/models/feed';
import { CommentsStore } from '../../core/state/comments-store';
import { CommentsThread } from './comments-thread';

/**
 * Hoja inferior de comentarios para pantallas sin columna derecha.
 *
 * Usa `<dialog>` nativo con `showModal()`: el navegador aporta el atrapado de
 * foco, el cierre con Escape, el fondo inerte y el `::backdrop`. Reimplementar
 * eso a mano es la fuente habitual de diálogos inaccesibles.
 *
 * El `::backdrop` es color plano, sin `backdrop-filter`: cubre el `<video>` en
 * reproducción y desenfocarlo obligaría al compositor a releer cada frame.
 */
@Component({
  selector: 'app-comments-sheet',
  imports: [CommentsThread],
  host: { class: 'contents' },
  styles: `
    dialog {
      /* El margen ancla la hoja abajo; el resto anula los valores por defecto
       * del agente de usuario, pensados para un diálogo centrado. */
      margin: auto 0 0;
      width: 100%;
      max-width: 100%;
      height: 78dvh;
      max-height: 78dvh;
      padding: 0 0 env(safe-area-inset-bottom);
      border: 0;
      border-top: 1px solid rgb(255 255 255 / 0.12);
      border-radius: 1.5rem 1.5rem 0 0;
      background-color: #0b0b12;
      color: inherit;
      overflow: hidden;
      animation: sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    dialog::backdrop {
      background-color: rgb(5 5 8 / 0.72);
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
      aria-label="Comentarios del clip"
      (close)="comments.closePanel()"
      (click)="onDialogClick($event)"
    >
      <app-comments-thread class="h-full" [clip]="clip()" />
    </dialog>
  `,
})
export class CommentsSheet {
  readonly clip = input.required<VideoClip>();

  protected readonly comments = inject(CommentsStore);
  private readonly sheetRef = viewChild.required<ElementRef<HTMLDialogElement>>('sheet');

  constructor() {
    afterNextRender(() => {
      const dialog = this.sheetRef().nativeElement;
      // jsdom y los navegadores sin `<dialog>` no tienen `showModal`; sin él la
      // hoja se queda oculta en vez de romper el render.
      if (typeof dialog.showModal === 'function') dialog.showModal();
    });
  }

  /**
   * En un `<dialog>` el clic sobre el fondo tiene como destino el propio
   * elemento: cualquier otro destino viene del contenido.
   */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.sheetRef().nativeElement) this.comments.closePanel();
  }
}
