import { Component, computed, input } from '@angular/core';

/**
 * Visualizador de ondas del audio original.
 *
 * Dibuja la envolvente precalculada del track con animación CSS en vez de
 * analizar el audio en vivo. Un `AnalyserNode` por clip obligaría a servir el
 * media con CORS, a crear el `AudioContext` tras un gesto del usuario y a
 * re-enrutar el audio del `<video>` por el grafo (lo que silencia la pista en
 * varios navegadores si algo falla). A cambio, la animación se pausa de verdad
 * con el video: `animation-play-state` no consume CPU mientras está parada.
 */
@Component({
  selector: 'app-soundwave',
  host: {
    class: 'flex h-5 items-end gap-[3px]',
    '[attr.aria-hidden]': 'true',
  },
  template: `
    @for (level of levels(); track $index) {
      <span
        class="w-[2px] origin-bottom rounded-full bg-current"
        [style.height.%]="level * 100"
        [style.animation-delay.ms]="$index * 60"
        [style.animation-play-state]="playing() ? 'running' : 'paused'"
      ></span>
    }
  `,
  styles: `
    span {
      animation: wave-bar 1.15s ease-in-out infinite;
    }

    /* Movimiento reducido: la envolvente se queda fija y sigue informando de
     * la forma del audio, solo deja de moverse. */
    @media (prefers-reduced-motion: reduce) {
      span {
        animation: none;
      }
    }
  `,
})
export class Soundwave {
  /** Envolvente normalizada (0..1). */
  readonly envelope = input.required<readonly number[]>();
  readonly playing = input(false);
  /** Número de barras a mostrar; se submuestrea la envolvente. */
  readonly barCount = input(14, { alias: 'bars' });

  protected readonly levels = computed(() => {
    const envelope = this.envelope();
    const count = Math.max(1, this.barCount());
    if (envelope.length === 0) return Array.from({ length: count }, () => 0.3);

    const step = envelope.length / count;
    return Array.from({ length: count }, (_, i) => {
      const value = envelope[Math.floor(i * step)] ?? 0.3;
      return Math.min(1, Math.max(0.15, value));
    });
  });
}
