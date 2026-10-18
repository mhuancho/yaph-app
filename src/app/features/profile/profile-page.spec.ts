import { appConfig } from '../../app.config';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from '../../app';
import { MOCK_CLIPS } from '../../core/data/mock-feed';
import { CURRENT_PROFILE, MOCK_LIBRARY } from '../../core/data/mock-profiles';
import { FeedStore } from '../../core/state/feed-store';
import { SessionStore } from '../../core/state/session-store';
import { Viewport } from '../../core/state/viewport';

const DESKTOP_VIEWPORT = { hasSidePanel: signal(true) };
const LIVE_CLIP = MOCK_CLIPS.find((clip) => clip.kind === 'live')!;

function stubBrowserMediaApis(): void {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
  HTMLMediaElement.prototype.pause = () => undefined;
  Element.prototype.scrollIntoView = () => undefined;
  Element.prototype.scrollTo = () => undefined;
}

describe('ProfilePage', () => {
  beforeEach(async () => {
    stubBrowserMediaApis();
    DESKTOP_VIEWPORT.hasSidePanel.set(true);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...appConfig.providers, { provide: Viewport, useValue: DESKTOP_VIEWPORT }],
    }).compileComponents();
  });

  async function openProfile(url: string) {
    // El perfil propio está tras el guard de sesión: sin identidad, `/perfil`
    // redirige a la pantalla de acceso.
    TestBed.inject(SessionStore).signIn('tu.perfil', CURRENT_PROFILE.displayName);

    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('muestra el perfil propio con sus pestañas', async () => {
    const { host } = await openProfile('/perfil');

    expect(host.querySelector('h1')?.textContent).toContain(CURRENT_PROFILE.displayName);
    expect(host.textContent).toContain('Editar perfil');
    expect(host.querySelectorAll('[role="tab"]')).toHaveLength(3);
  });

  it('muestra un perfil ajeno con seguir y sin pestañas', async () => {
    const { host } = await openProfile('/perfil/@nyx.render');

    expect(host.querySelector('h1')?.textContent).toContain('Nyx Render');
    expect(host.textContent).toContain('Seguir');
    expect(host.textContent).not.toContain('Editar perfil');
    expect(host.querySelector('[role="tablist"]')).toBeNull();
    expect(host.textContent).toContain('publicaciones');
  });

  it('pinta una miniatura por publicación', async () => {
    const { host } = await openProfile('/perfil/@nyx.render');

    const profileId = MOCK_CLIPS.find((c) => c.creator.handle === '@nyx.render')!.creator.id;
    expect(host.querySelectorAll('app-clip-tile').length).toBe(MOCK_LIBRARY[profileId].length);
    // La parrilla no monta reproductores: serían tantos decodificadores como celdas.
    expect(host.querySelectorAll('app-clip-tile video').length).toBe(0);
  });

  it('destaca el directo y ofrece verlo', async () => {
    const { host } = await openProfile(`/perfil/${LIVE_CLIP.creator.handle}`);
    expect(host.textContent).toContain('Ver directo');
  });

  it('reproduce la colección del perfil al abrir una miniatura', async () => {
    const { fixture, host } = await openProfile('/perfil/@nyx.render');
    const feed = TestBed.inject(FeedStore);
    expect(feed.isForYou()).toBe(true);

    host.querySelectorAll<HTMLButtonElement>('app-clip-tile button')[1].click();
    await fixture.whenStable();

    expect(feed.isForYou()).toBe(false);
    expect(feed.collection().label).toBe('@nyx.render');
    expect(feed.activeIndex()).toBe(1);
    // Y el feed queda mostrando esa colección, no la recomendación general.
    expect(feed.clips().every((clip) => clip.creator.handle === '@nyx.render')).toBe(true);
  });

  it('vuelve a la recomendación general desde la barra de origen', async () => {
    const { fixture, host } = await openProfile('/perfil/@nyx.render');
    const feed = TestBed.inject(FeedStore);

    host.querySelectorAll<HTMLButtonElement>('app-clip-tile button')[0].click();
    await fixture.whenStable();
    expect(feed.isForYou()).toBe(false);

    const back = [...host.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
      button.textContent?.includes('videos de'),
    )!;
    back.click();
    await fixture.whenStable();

    expect(feed.isForYou()).toBe(true);
    expect(feed.collection().label).toBe('Para ti');
  });

  it('avisa cuando el handle no existe', async () => {
    const { host } = await openProfile('/perfil/@no-existe');
    expect(host.textContent).toContain('Perfil no encontrado');
  });
});
