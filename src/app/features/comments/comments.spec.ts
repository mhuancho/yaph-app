import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { MOCK_CLIPS } from '../../core/data/mock-feed';
import { CommentsStore } from '../../core/state/comments-store';
import { FeedStore } from '../../core/state/feed-store';
import { Viewport } from '../../core/state/viewport';

/**
 * Integración del hilo de comentarios sobre el armazón completo: el botón del
 * rail, la conmutación de la columna derecha y la publicación.
 *
 * `Viewport` se sustituye porque jsdom responde `false` a cualquier media
 * query; sin esto nunca se ejercitaría la rama de la columna derecha.
 */
const DESKTOP_VIEWPORT = { hasSidePanel: signal(true) };

/** Primer clip emitiendo en directo del feed de demostración. */
const LIVE_INDEX = MOCK_CLIPS.findIndex((clip) => clip.kind === 'live');

function submitComposer(host: HTMLElement): void {
  host
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function stubBrowserMediaApis(): void {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  Element.prototype.scrollTo = () => undefined;
}

describe('Hilo de comentarios', () => {
  beforeEach(async () => {
    stubBrowserMediaApis();
    DESKTOP_VIEWPORT.hasSidePanel.set(true);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), { provide: Viewport, useValue: DESKTOP_VIEWPORT }],
    }).compileComponents();
  });

  async function render() {
    const fixture = TestBed.createComponent(App);
    // El feed llega por `loadComponent`: sin resolver la navegación inicial el
    // armazón se renderiza con el outlet vacío y no hay rail que pulsar.
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  function commentButton(host: HTMLElement): HTMLButtonElement {
    return host.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')!;
  }

  it('muestra el panel HUD mientras los comentarios están cerrados', async () => {
    const { host } = await render();

    expect(host.querySelector('aside[aria-label="Tendencias y telemetría"]')).toBeTruthy();
    expect(host.querySelector('textarea')).toBeNull();
    expect(commentButton(host).getAttribute('aria-expanded')).toBe('false');
  });

  it('abre el hilo en la columna derecha al pulsar el icono de mensaje', async () => {
    const { fixture, host } = await render();

    commentButton(host).click();
    await fixture.whenStable();

    expect(TestBed.inject(CommentsStore).open()).toBe(true);
    expect(host.querySelector('aside[aria-label="Tendencias y telemetría"]')).toBeNull();

    const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(composer).toBeTruthy();
    expect(composer.getAttribute('maxlength')).toBe('150');
    expect(commentButton(host).getAttribute('aria-expanded')).toBe('true');
  });

  it('publica el comentario y actualiza el contador del rail', async () => {
    const { fixture, host } = await render();
    const clip = MOCK_CLIPS[0];

    commentButton(host).click();
    await fixture.whenStable();

    const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
    composer.value = 'el borde del segundo 4 es otra cosa';
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    submitComposer(host);
    await fixture.whenStable();

    expect(host.textContent).toContain('el borde del segundo 4 es otra cosa');
    // El borrador se limpia solo si la publicación entró.
    expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
    expect(TestBed.inject(CommentsStore).countFor(clip)).toBe(clip.metrics.comments + 1);
  });

  it('ignora un envío sin texto', async () => {
    const { fixture, host } = await render();

    commentButton(host).click();
    await fixture.whenStable();

    const submit = host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);

    submitComposer(host);
    await fixture.whenStable();

    expect(TestBed.inject(CommentsStore).countFor(MOCK_CLIPS[0])).toBe(
      MOCK_CLIPS[0].metrics.comments,
    );
  });

  it('cambia de hilo y descarta el borrador al pasar de clip', async () => {
    const { fixture, host } = await render();
    const feed = TestBed.inject(FeedStore);

    commentButton(host).click();
    await fixture.whenStable();

    const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
    composer.value = 'borrador a medias';
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    feed.next();
    await fixture.whenStable();

    expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
    expect(host.textContent).toContain(MOCK_CLIPS[1].creator.handle);
  });

  it('reserva el chat del HUD a los clips en directo', async () => {
    const { fixture, host } = await render();
    const feed = TestBed.inject(FeedStore);

    expect(feed.activeClip()?.kind).toBe('short');
    expect(host.querySelector('[aria-live="polite"]')).toBeNull();

    feed.setActiveIndex(LIVE_INDEX);
    await fixture.whenStable();

    expect(host.querySelector('[aria-live="polite"]')).toBeTruthy();
  });

  describe('respuestas', () => {
    it('prepara la respuesta y la cuelga del comentario', async () => {
      const { fixture, host } = await render();

      commentButton(host).click();
      await fixture.whenStable();

      host.querySelector<HTMLButtonElement>('button[aria-label^="Responder a "]')!.click();
      await fixture.whenStable();
      expect(host.textContent).toContain('Respondiendo a');

      const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
      composer.value = 'early-out, confirmado';
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      submitComposer(host);
      await fixture.whenStable();

      // La respuesta vive dentro de la lista anidada del comentario padre, no
      // como un comentario raíz más.
      const nested = host.querySelector('ol ol');
      expect(nested?.textContent).toContain('early-out, confirmado');
      expect(host.textContent).not.toContain('Respondiendo a');
    });

    it('despliega y oculta las respuestas existentes', async () => {
      const { fixture, host } = await render();

      commentButton(host).click();
      await fixture.whenStable();

      const toggle = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
        button.textContent?.includes('respuestas'),
      )!;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(host.querySelector('ol ol')).toBeNull();

      toggle.click();
      await fixture.whenStable();
      expect(host.querySelector('ol ol')).toBeTruthy();

      toggle.click();
      await fixture.whenStable();
      expect(host.querySelector('ol ol')).toBeNull();
    });
  });

  describe('emojis', () => {
    it('inserta el emoji en la posición del cursor', async () => {
      const { fixture, host } = await render();

      commentButton(host).click();
      await fixture.whenStable();

      const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
      composer.value = 'qué nivel';
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      composer.setSelectionRange(3, 3);
      await fixture.whenStable();

      host.querySelector<HTMLButtonElement>('button[aria-label="Insertar emoji"]')!.click();
      await fixture.whenStable();

      host.querySelector<HTMLButtonElement>('button[aria-label="fuego"]')!.click();
      await fixture.whenStable();

      expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('qué🔥 nivel');
      // El panel se cierra al elegir.
      expect(host.querySelector('button[aria-label="fuego"]')).toBeNull();
    });
  });

  describe('directos', () => {
    it('ofrece dos pestañas y arranca en el chat', async () => {
      const { fixture, host } = await render();
      TestBed.inject(FeedStore).setActiveIndex(LIVE_INDEX);
      await fixture.whenStable();

      commentButton(host).click();
      await fixture.whenStable();

      const tabs = host.querySelectorAll('[role="tab"]');
      expect(tabs).toHaveLength(2);
      expect(tabs[0].getAttribute('aria-selected')).toBe('true');
      expect(host.textContent).toContain('Chat del directo');
    });

    it('cambia al hilo del clip desde la pestaña', async () => {
      const { fixture, host } = await render();
      TestBed.inject(FeedStore).setActiveIndex(LIVE_INDEX);
      await fixture.whenStable();

      commentButton(host).click();
      await fixture.whenStable();

      const [, threadTab] = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      threadTab.click();
      await fixture.whenStable();

      expect(threadTab.getAttribute('aria-selected')).toBe('true');
      expect(host.textContent).toContain('comentarios');
      expect(host.querySelector('[role="tabpanel"]')).toBeTruthy();
    });

    it('no muestra pestañas en un video corto', async () => {
      const { fixture, host } = await render();

      commentButton(host).click();
      await fixture.whenStable();

      expect(TestBed.inject(FeedStore).activeClip()?.kind).toBe('short');
      expect(host.querySelector('[role="tablist"]')).toBeNull();
    });

    it('envía el mensaje al chat, no al hilo del clip', async () => {
      const { fixture, host } = await render();
      const feed = TestBed.inject(FeedStore);
      feed.setActiveIndex(LIVE_INDEX);
      await fixture.whenStable();

      commentButton(host).click();
      await fixture.whenStable();

      const composer = host.querySelector<HTMLTextAreaElement>('textarea')!;
      composer.value = 'buenas desde Lima 👋';
      composer.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      submitComposer(host);
      await fixture.whenStable();

      expect(host.querySelector('[aria-live="polite"]')!.textContent).toContain(
        'buenas desde Lima 👋',
      );
      // El hilo persistente del clip no se toca.
      expect(TestBed.inject(CommentsStore).countFor(feed.activeClip()!)).toBe(
        feed.activeClip()!.metrics.comments,
      );
    });
  });
});
