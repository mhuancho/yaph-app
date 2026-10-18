import { TestBed } from '@angular/core/testing';
import { MOCK_CLIPS } from '../../core/data/mock-feed';
import { MOUNT_RADIUS } from '../../core/state/feed-store';
import { FeedPage } from './feed-page';

/**
 * jsdom no implementa la reproducción de medios ni `scrollIntoView`. Sin estos
 * sustitutos, el efecto de `VideoStage` y la navegación por teclado lanzarían
 * en cada prueba. `IntersectionObserver` tampoco existe, y por eso `InView`
 * comprueba su presencia: aquí no emite y el clip activo lo decide el store.
 */
function stubBrowserMediaApis(): void {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
}

describe('FeedPage', () => {
  beforeEach(() => {
    stubBrowserMediaApis();
    TestBed.configureTestingModule({ imports: [FeedPage] });
  });

  it('expone la semántica de feed con un artículo por clip', async () => {
    const fixture = TestBed.createComponent(FeedPage);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[role="feed"]')).toBeTruthy();

    const articles = host.querySelectorAll('[role="article"]');
    expect(articles.length).toBe(MOCK_CLIPS.length);
    expect(articles[0].getAttribute('aria-posinset')).toBe('1');
    expect(articles[0].getAttribute('aria-setsize')).toBe(String(MOCK_CLIPS.length));
  });

  it('monta solo los video de la ventana activa', async () => {
    const fixture = TestBed.createComponent(FeedPage);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    // Índice activo 0: se montan el 0 y sus vecinos existentes.
    expect(host.querySelectorAll('video').length).toBe(1 + MOUNT_RADIUS);
  });

  it('desplaza el clip activo con las flechas del teclado', async () => {
    const fixture = TestBed.createComponent(FeedPage);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const feed = host.querySelector('[role="feed"]')!;

    feed.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await fixture.whenStable();

    const labels = [...host.querySelectorAll('[aria-label^="Clip de"]')];
    // El segundo clip pasa a activo: es el único que muestra el contador de
    // tiempo, que solo se renderiza para el activo.
    expect(labels[1].querySelector('.metric')).toBeTruthy();
    expect(host.querySelectorAll('video').length).toBe(1 + 2 * MOUNT_RADIUS);
  });

  it('aplica el me gusta de forma optimista en el clip pulsado', async () => {
    const fixture = TestBed.createComponent(FeedPage);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    const like = host.querySelector<HTMLButtonElement>('button[aria-label="Me gusta"]')!;
    expect(like.getAttribute('aria-pressed')).toBe('false');

    like.click();
    await fixture.whenStable();

    const pressed = host.querySelector<HTMLButtonElement>('button[aria-label="Quitar me gusta"]')!;
    expect(pressed.getAttribute('aria-pressed')).toBe('true');
  });
});
