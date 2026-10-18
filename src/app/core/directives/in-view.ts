import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Avisa cuando el elemento anfitrión supera (o deja de superar) un umbral de
 * visibilidad.
 *
 * Es el disparador del autoplay del feed: con `scroll-snap` obligatorio y
 * elementos de alto completo, exactamente un clip supera el 65% en reposo, así
 * que no hace falta comparar ratios entre hermanos.
 */
@Directive({ selector: '[appInView]' })
export class InView {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Fracción visible (0..1) a partir de la cual se considera "en vista". */
  readonly threshold = input(0.65, { alias: 'appInViewThreshold' });

  readonly inViewChange = output<boolean>();

  constructor() {
    let observer: IntersectionObserver | null = null;
    let last: boolean | null = null;

    // `afterNextRender` garantiza DOM montado y no se ejecuta en servidor.
    afterNextRender(() => {
      // Sin IntersectionObserver (jsdom en tests, SSR) no se emite nada: el
      // feed conserva el clip activo del store y sigue navegable por teclado.
      if (typeof IntersectionObserver === 'undefined') return;

      const threshold = this.threshold();
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const visible = entry.intersectionRatio >= threshold;
            // Con varios umbrales el callback se dispara en cascada; solo
            // interesa el cambio de estado.
            if (visible === last) continue;
            last = visible;
            this.inViewChange.emit(visible);
          }
        },
        { threshold: [0, threshold, 1] },
      );
      observer.observe(this.element.nativeElement);
    });

    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}
