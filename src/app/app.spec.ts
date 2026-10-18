import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('monta el armazón con las dos navegaciones y el panel HUD', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;

    // Dock de escritorio y barra móvil conviven en el DOM; quién se ve lo
    // deciden las utilidades responsivas, no una rama de JavaScript.
    expect(host.querySelectorAll('nav[aria-label="Navegación principal"]').length).toBe(2);
    expect(host.querySelector('aside[aria-label="Tendencias y telemetría"]')).toBeTruthy();
    expect(host.querySelector('a[href="#contenido"]')?.textContent).toContain(
      'Saltar al contenido',
    );
  });
});
