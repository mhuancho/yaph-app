import { Component, computed, input } from '@angular/core';

/**
 * Sparkline SVG sin dependencias.
 *
 * `viewBox` normalizado a 100x100 con `preserveAspectRatio="none"`: el trazo se
 * estira al contenedor sin recalcular puntos, así que no hace falta observar el
 * tamaño ni volver a renderizar al cambiar el layout.
 */
@Component({
  selector: 'app-sparkline',
  host: { class: 'block' },
  template: `
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      class="size-full overflow-visible"
      aria-hidden="true"
      focusable="false"
    >
      <path
        [attr.d]="areaPath()"
        fill="currentColor"
        class="opacity-15"
        stroke="none"
        vector-effect="non-scaling-stroke"
      />
      <path
        [attr.d]="linePath()"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `,
})
export class Sparkline {
  /** Serie normalizada (0..1). */
  readonly series = input.required<readonly number[]>();

  private readonly points = computed(() => {
    const series = this.series();
    if (series.length < 2) return [];
    const stepX = 100 / (series.length - 1);
    return series.map((value, index) => ({
      x: index * stepX,
      // SVG crece hacia abajo: 1 debe quedar arriba.
      y: 100 - Math.min(1, Math.max(0, value)) * 100,
    }));
  });

  protected readonly linePath = computed(() => {
    const points = this.points();
    if (points.length === 0) return '';
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`)
      .join(' ');
  });

  protected readonly areaPath = computed(() => {
    const line = this.linePath();
    return line === '' ? '' : `${line} L100 100 L0 100 Z`;
  });
}

function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}
