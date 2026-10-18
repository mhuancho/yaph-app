import { Component, computed, input } from '@angular/core';
import { CommentAuthor } from '../core/models/feed';

const BASE =
  'relative grid place-items-center rounded-full font-semibold text-abyss select-none ' +
  'bg-[linear-gradient(140deg,var(--orb-from),var(--orb-to))]';

const SIZES = {
  sm: 'size-8 text-[0.6rem]',
  md: 'size-11 text-xs',
  lg: 'size-14 text-base',
} as const;

/**
 * Avatar generado a partir del par de colores del creador.
 *
 * Sin imágenes: cero peticiones, cero layout shift y la paleta neón se mantiene
 * coherente. Cuando haya avatares reales, este componente es el único punto a
 * cambiar (añadir un `<img>` con `NgOptimizedImage` y caer al degradado si
 * falla la carga).
 */
@Component({
  selector: 'app-avatar-orb',
  host: {
    '[class]': 'hostClass()',
    '[style.--orb-from]': 'creator().avatar.from',
    '[style.--orb-to]': 'creator().avatar.to',
    '[attr.aria-hidden]': 'true',
  },
  template: `{{ initials() }}`,
})
export class AvatarOrb {
  // `CommentAuthor` y no `Creator`: el avatar solo necesita nombre y colores,
  // así sirve igual para la ficha del creador y para una fila de comentario.
  readonly creator = input.required<CommentAuthor>();
  readonly size = input<keyof typeof SIZES>('md');

  protected readonly hostClass = computed(() => `${BASE} ${SIZES[this.size()]}`);

  protected readonly initials = computed(() =>
    this.creator()
      .displayName.split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase(),
  );
}
