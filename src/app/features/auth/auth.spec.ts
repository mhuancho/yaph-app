import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from '../../app';
import { appConfig } from '../../app.config';
import { MOCK_CLIPS } from '../../core/data/mock-feed';
import { CommentsStore } from '../../core/state/comments-store';
import { SessionStore } from '../../core/state/session-store';
import { Viewport } from '../../core/state/viewport';

const DESKTOP_VIEWPORT = { hasSidePanel: signal(true) };

function stubBrowserMediaApis(): void {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  Element.prototype.scrollTo = () => undefined;
}

describe('Sesión', () => {
  beforeEach(async () => {
    stubBrowserMediaApis();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...appConfig.providers, { provide: Viewport, useValue: DESKTOP_VIEWPORT }],
    }).compileComponents();
  });

  async function open(url: string) {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  /**
   * Escribe y sale del campo: Signal Forms marca `touched` al perder el foco,
   * y los mensajes de error solo se enseñan cuando el campo se ha tocado.
   */
  function type(host: HTMLElement, selector: string, value: string): void {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  it('desvía a la pantalla de identidad lo que necesita sesión', async () => {
    const { fixture } = await open('/crear');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/acceder?volver=%2Fcrear');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Entrar en YAPH');
  });

  it('deja pasar al feed y a los perfiles ajenos sin sesión', async () => {
    const feed = await open('/');
    expect(feed.host.querySelector('[role="feed"]')).toBeTruthy();

    const ajeno = await open('/perfil/@nyx.render');
    expect(TestBed.inject(Router).url).toBe('/perfil/@nyx.render');
    expect(ajeno.host.querySelector('h1')?.textContent).toContain('Nyx Render');
  });

  it('entra y sigue al destino que guardó el guard', async () => {
    const { fixture, host } = await open('/crear');

    type(host, 'input[autocomplete="username"]', 'kuri.dev');
    type(host, 'input[autocomplete="nickname"]', 'Kuri Dev');
    await fixture.whenStable();

    host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/crear');
    expect(TestBed.inject(SessionStore).profile().handle).toBe('@kuri.dev');
  });

  it('no deja entrar con un handle del catálogo', async () => {
    const { fixture, host } = await open('/acceder');

    type(host, 'input[autocomplete="username"]', 'nyx.render');
    type(host, 'input[autocomplete="nickname"]', 'Falso Nyx');
    await fixture.whenStable();

    const submit = host.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBe(true);
    expect(host.textContent).toContain('ya es de otra cuenta');
    expect(TestBed.inject(SessionStore).signedIn()).toBe(false);
  });

  it('con sesión la pantalla edita el perfil en vez de entrar', async () => {
    TestBed.inject(SessionStore).signIn('kuri.dev', 'Kuri Dev');
    const { fixture, host } = await open('/acceder');

    expect(host.textContent).toContain('Editar perfil');
    expect(host.querySelector<HTMLInputElement>('input[autocomplete="username"]')!.value).toBe(
      'kuri.dev',
    );

    type(host, 'input[autocomplete="nickname"]', 'Kuri renombrada');
    await fixture.whenStable();
    host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/perfil');
    expect(host.querySelector('h1')?.textContent).toContain('Kuri renombrada');
  });

  it('firma con la identidad de la sesión lo que se publica', async () => {
    const session = TestBed.inject(SessionStore);
    session.signIn('kuri.dev', 'Kuri Dev');

    const comments = TestBed.inject(CommentsStore);
    const clip = MOCK_CLIPS[0];
    expect(comments.publish(clip.id, 'firmado por la sesión')).toBe(true);

    const mine = comments.roots(clip.id).find((comment) => comment.own);
    expect(mine?.author.handle).toBe('@kuri.dev');
    expect(mine?.author.displayName).toBe('Kuri Dev');
  });

  it('cierra la sesión desde ajustes y vuelve al feed', async () => {
    TestBed.inject(SessionStore).signIn('kuri.dev', 'Kuri Dev');
    const { fixture, host } = await open('/ajustes');

    expect(host.textContent).toContain('@kuri.dev');

    const buttons = [...host.querySelectorAll<HTMLButtonElement>('button')];
    buttons.find((button) => button.textContent?.includes('Cerrar sesión'))!.click();
    await fixture.whenStable();

    expect(TestBed.inject(SessionStore).signedIn()).toBe(false);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
