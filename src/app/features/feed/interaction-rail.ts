import { Component, inject, input } from '@angular/core';
import { FeedStore } from '../../core/state/feed-store';
import { VideoClip } from '../../core/models/feed';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';

/**
 * Barra de interacción flotante.
 *
 * Translúcida sin `backdrop-filter`: se solapa con el `<video>` y desenfocar
 * ahí obliga al compositor a releer el frame en cada repintado. `glass-flat`
 * da la misma lectura con coste de composición plano.
 *
 * Posición: superpuesta al video en móvil, en columna propia a la derecha del
 * marco en escritorio (una sola instancia, reubicada con utilidades
 * responsivas, en vez de dos instancias sincronizadas).
 */
@Component({
  selector: 'app-interaction-rail',
  imports: [Icon, CompactPipe],
  host: {
    class:
      'z-20 flex flex-col items-center gap-4 ' +
      'absolute right-2.5 bottom-32 md:relative md:right-auto md:bottom-auto',
  },
  template: `
    <!-- Me gusta -->
    <button
      type="button"
      class="group/btn flex flex-col items-center gap-1.5"
      [attr.aria-pressed]="liked()"
      [attr.aria-label]="liked() ? 'Quitar me gusta' : 'Me gusta'"
      (click)="feed.toggleLike(clip().id)"
    >
      <span
        class="glass-flat grid size-12 place-items-center rounded-full border border-white/12 transition-[transform,border-color,box-shadow,color] duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:border-neon-magenta/60"
        [class.text-neon-magenta]="liked()"
        [class.text-ink]="!liked()"
        [class.shadow-neon-magenta]="liked()"
      >
        <!-- La animación se aplica solo en el estado activo: al reañadir la
             clase el navegador reinicia el keyframe, que es justo el pulso. -->
        <app-icon
          name="heart"
          class="size-[1.35rem]"
          [filled]="liked()"
          [class.animate-pulse-neon]="liked()"
        />
      </span>
      <span class="metric text-[0.6875rem] font-medium text-ink">
        {{ feed.likeCount(clip()) | compact }}
      </span>
    </button>

    <!-- Comentarios -->
    <button
      type="button"
      class="group/btn flex flex-col items-center gap-1.5"
      [attr.aria-label]="'Ver ' + clip().metrics.comments + ' comentarios'"
    >
      <span
        class="glass-flat grid size-12 place-items-center rounded-full border border-white/12 text-ink transition-[transform,border-color] duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:border-neon-cyan/60"
      >
        <app-icon name="comment" class="size-[1.35rem]" />
      </span>
      <span class="metric text-[0.6875rem] font-medium text-ink">
        {{ clip().metrics.comments | compact }}
      </span>
    </button>

    <!-- Compartir -->
    <button
      type="button"
      class="group/btn flex flex-col items-center gap-1.5"
      aria-label="Compartir clip"
    >
      <span
        class="glass-flat grid size-12 place-items-center rounded-full border border-white/12 text-ink transition-[transform,border-color] duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:border-neon-cyan/60"
      >
        <app-icon name="share" class="size-[1.3rem]" />
      </span>
      <span class="metric text-[0.6875rem] font-medium text-ink">
        {{ clip().metrics.shares | compact }}
      </span>
    </button>

    <!-- Guardar -->
    <button
      type="button"
      class="group/btn flex flex-col items-center gap-1.5"
      [attr.aria-pressed]="saved()"
      [attr.aria-label]="saved() ? 'Quitar de guardados' : 'Guardar clip'"
      (click)="feed.toggleSave(clip().id)"
    >
      <span
        class="glass-flat grid size-12 place-items-center rounded-full border border-white/12 transition-[transform,border-color,box-shadow,color] duration-200 group-hover/btn:-translate-y-0.5 group-hover/btn:border-neon-cyan/60"
        [class.text-neon-cyan]="saved()"
        [class.text-ink]="!saved()"
        [class.shadow-neon-cyan]="saved()"
      >
        <app-icon name="bookmark" class="size-[1.25rem]" [filled]="saved()" />
      </span>
      <span class="metric text-[0.6875rem] font-medium text-ink">
        {{ feed.saveCount(clip()) | compact }}
      </span>
    </button>

    <!-- Disco de audio: enlaza al sonido original. -->
    <a
      href="#contenido"
      class="group/btn mt-1 flex flex-col items-center"
      [attr.aria-label]="'Audio original: ' + clip().audio.title"
    >
      <span
        class="grid size-11 place-items-center rounded-full border border-white/15 bg-[linear-gradient(140deg,var(--glow-from),var(--glow-to))] text-abyss transition-transform duration-300 group-hover/btn:scale-105"
      >
        <app-icon name="music" class="size-[1.1rem]" [strokeWidth]="2" />
      </span>
    </a>
  `,
})
export class InteractionRail {
  readonly clip = input.required<VideoClip>();
  protected readonly feed = inject(FeedStore);

  protected liked(): boolean {
    return this.feed.isLiked(this.clip().id);
  }

  protected saved(): boolean {
    return this.feed.isSaved(this.clip().id);
  }
}
