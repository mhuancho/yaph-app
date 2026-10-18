import { Component, inject, input } from '@angular/core';
import { ClipComment } from '../../core/models/feed';
import { CommentsStore } from '../../core/state/comments-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { AgePipe, CompactPipe } from '../../ui/metric-pipes';

/**
 * Una fila del hilo: sirve igual para un comentario raíz y para una respuesta.
 *
 * Es un componente y no un `ng-template` con `ngTemplateOutlet` porque el
 * contexto habría que construirlo en la plantilla, creando un objeto nuevo en
 * cada ciclo de detección y re-renderizando filas que no han cambiado.
 */
@Component({
  selector: 'app-comment-row',
  imports: [AvatarOrb, HoloBadge, Icon, CompactPipe, AgePipe],
  host: { class: 'flex gap-3' },
  template: `
    <app-avatar-orb class="mt-0.5" [creator]="comment().author" size="sm" />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="truncate text-[0.8125rem] font-medium text-ink">
          {{ comment().author.handle }}
        </span>

        @if (comment().author.badge; as badge) {
          <app-holo-badge [tier]="badge" />
        }

        @if (comment().pinned) {
          <span
            class="metric inline-flex items-center gap-1 rounded-full border border-neon-amber/40 bg-neon-amber/10 px-1.5 py-[2px] text-[0.5625rem] tracking-[0.12em] text-neon-amber uppercase"
          >
            <app-icon name="pin" class="size-2.5" [strokeWidth]="1.8" />
            fijado
          </span>
        }

        @if (comment().own) {
          <span
            class="metric rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-1.5 py-[2px] text-[0.5625rem] tracking-[0.12em] text-neon-cyan uppercase"
          >
            tú
          </span>
        }
      </div>

      <p class="mt-1 text-[0.8125rem] leading-relaxed text-ink/90">{{ comment().body }}</p>

      <div class="metric mt-1.5 flex items-center gap-3 text-[0.625rem] text-ink-faint">
        <span>{{ comment().ageMinutes | age }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1 transition-colors hover:text-neon-cyan"
          [attr.aria-label]="'Responder a ' + comment().author.handle"
          (click)="comments.startReply(comment(), clipId())"
        >
          <app-icon name="reply" class="size-3" [strokeWidth]="1.8" />
          Responder
        </button>
      </div>
    </div>

    <button
      type="button"
      class="flex shrink-0 flex-col items-center gap-0.5 self-start pt-1 transition-colors duration-200"
      [class.text-neon-magenta]="comments.isLiked(comment().id)"
      [class.text-ink-faint]="!comments.isLiked(comment().id)"
      [attr.aria-pressed]="comments.isLiked(comment().id)"
      [attr.aria-label]="likeLabel()"
      (click)="comments.toggleLike(comment().id)"
    >
      <app-icon name="heart" class="size-4" [filled]="comments.isLiked(comment().id)" />
      <span class="metric text-[0.625rem]">{{ comments.likeCount(comment()) | compact }}</span>
    </button>
  `,
})
export class CommentRow {
  readonly comment = input.required<ClipComment>();
  readonly clipId = input.required<string>();

  protected readonly comments = inject(CommentsStore);

  protected likeLabel(): string {
    const comment = this.comment();
    const verb = this.comments.isLiked(comment.id) ? 'Quitar me gusta de' : 'Me gusta a';
    return `${verb} el comentario de ${comment.author.handle}`;
  }
}
