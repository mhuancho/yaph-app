import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MOCK_CLIPS } from '../../core/data/mock-feed';
import { VideoClip } from '../../core/models/feed';
import { VideoStage } from './video-stage';

/** jsdom no reproduce medios: sin estos sustitutos el efecto del clip lanza. */
function stubBrowserMediaApis(): void {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => undefined;
}

@Component({
  imports: [VideoStage],
  template: `
    <app-video-stage [clip]="clip()" [index]="0" [total]="1" [active]="true" [mounted]="true" />
  `,
})
class StageHost {
  readonly clip = signal<VideoClip>(MOCK_CLIPS[0]);
}

describe('VideoStage', () => {
  beforeEach(() => {
    stubBrowserMediaApis();
    // El overlay enlaza el handle al perfil, así que `RouterLink` pide router.
    TestBed.configureTestingModule({ imports: [StageHost], providers: [provideRouter([])] });
  });

  /**
   * Regresión del prerender: el servidor no sabe qué códec soporta el cliente,
   * así que no elige fuente. El `<video>` tiene que salir sin `src` —no con
   * `src=""`, que el navegador resolvería contra la URL de la página y daría
   * error— para que la descarga arranque solo cuando el navegador haya elegido.
   */
  it('no escribe src mientras no haya fuente elegida', async () => {
    const fixture = TestBed.createComponent(StageHost);
    fixture.componentInstance.clip.set({ ...MOCK_CLIPS[0], sources: [] });
    await fixture.whenStable();

    const video = (fixture.nativeElement as HTMLElement).querySelector('video');
    expect(video).toBeTruthy();
    expect(video!.hasAttribute('src')).toBe(false);
  });

  /**
   * Regresión de la hidratación: el prerender traía el MP4 como `src`, un
   * Chromium sin H.264 emitía `error` antes de hidratar y el replay de eventos
   * entregaba ese error al componente ya hidratado, que ocultaba el `<video>`
   * para siempre aunque el WebM fuera reproducible. El fallo es de la fuente.
   */
  it('reintenta cuando llega una fuente distinta tras un error', async () => {
    const fixture = TestBed.createComponent(StageHost);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector('video')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(host.querySelector('video')).toBeNull();
    expect(host.textContent).toContain('No se pudo cargar el clip');

    fixture.componentInstance.clip.set(MOCK_CLIPS[1]);
    await fixture.whenStable();

    expect(host.querySelector('video')).toBeTruthy();
    expect(host.textContent).not.toContain('No se pudo cargar el clip');
  });
});
