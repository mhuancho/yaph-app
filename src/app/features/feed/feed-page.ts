import { afterNextRender, Component, ElementRef, inject, viewChildren } from '@angular/core';
import { InView } from '../../core/directives/in-view';
import { FeedStore } from '../../core/state/feed-store';
import { ReducedMotion } from '../../core/state/reduced-motion';
import { VideoStage } from './video-stage';

/**
 * Feed vertical con `scroll-snap`.
 *
 * El clip activo lo decide `IntersectionObserver` (vía `InView`), no un cálculo
 * sobre `scrollTop`: leer la posición en cada evento de scroll fuerza un
 * reflujo sincrónico por evento y es la causa clásica del scroll a tirones en
 * este tipo de feed.
 *
 * Teclado: ↑/↓, PageUp/PageDown, Inicio/Fin para navegar, Espacio para
 * pausar y «M» para el audio. Sin esto el feed solo existiría para el ratón.
 */
@Component({
  selector: 'app-feed-page',
  imports: [VideoStage, InView],
  host: { class: 'block h-full' },
  template: `
    <div
      #scroller
      role="feed"
      aria-label="Clips recomendados"
      tabindex="0"
      class="scrollbar-none h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain focus:outline-none"
      (keydown.arrowDown)="step(1, $event)"
      (keydown.arrowUp)="step(-1, $event)"
      (keydown.pageDown)="step(1, $event)"
      (keydown.pageUp)="step(-1, $event)"
      (keydown.home)="goTo(0, $event)"
      (keydown.end)="goTo(feed.total() - 1, $event)"
      (keydown.space)="togglePlayback($event)"
      (keydown.m)="feed.toggleMute()"
    >
      @for (clip of feed.clips(); track clip.id; let i = $index) {
        <app-video-stage
          #stage
          appInView
          [appInViewThreshold]="0.6"
          (inViewChange)="onInView(i, $event)"
          [clip]="clip"
          [index]="i"
          [total]="feed.total()"
          [active]="feed.isActive(i)"
          [mounted]="feed.shouldMount(i)"
        />
      }
    </div>
  `,
})
export class FeedPage {
  protected readonly feed = inject(FeedStore);
  private readonly reducedMotion = inject(ReducedMotion);
  // La sobrecarga de `viewChildren` con `read` infiere el tipo del token, así
  // que el elemento se tipa con una expresión de instanciación en vez de un
  // parámetro genérico explícito (que seleccionaría la otra sobrecarga).
  private readonly stages = viewChildren('stage', { read: ElementRef<HTMLElement> });

  constructor() {
    // Al volver desde otra ruta, `FeedStore.activeIndex` sobrevive pero el
    // contenedor de scroll se vuelve a crear en 0: hay que recolocarlo.
    afterNextRender(() => {
      const index = this.feed.activeIndex();
      if (index > 0) this.scrollToStage(index, 'auto');
    });
  }

  protected onInView(index: number, visible: boolean): void {
    if (visible) this.feed.setActiveIndex(index);
  }

  protected step(delta: number, event: Event): void {
    this.goTo(this.feed.activeIndex() + delta, event);
  }

  protected goTo(index: number, event?: Event): void {
    event?.preventDefault();
    const clamped = Math.min(Math.max(index, 0), Math.max(this.feed.total() - 1, 0));
    if (clamped === this.feed.activeIndex()) return;

    this.feed.setActiveIndex(clamped);
    this.scrollToStage(clamped, this.reducedMotion.scrollBehavior());
  }

  protected togglePlayback(event: Event): void {
    event.preventDefault();
    this.feed.togglePlayback();
  }

  private scrollToStage(index: number, behavior: ScrollBehavior): void {
    this.stages()[index]?.nativeElement.scrollIntoView({ behavior, block: 'start' });
  }
}
