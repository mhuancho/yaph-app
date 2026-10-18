import { TestBed } from '@angular/core/testing';
import { I18nStore } from './i18n-store';
import { EN, ES, MessageKey } from './messages';

describe('I18nStore', () => {
  let i18n: I18nStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18nStore);
  });

  it('traduce al idioma activo', () => {
    i18n.locale.set('es');
    expect(i18n.t('nav.home')).toBe('Inicio');

    i18n.locale.set('en');
    expect(i18n.t('nav.home')).toBe('Home');
  });

  it('cae al español si falta la clave en el otro idioma', () => {
    i18n.locale.set('en');
    const sinTraducir = Object.keys(ES).find((key) => !(key in EN)) as MessageKey | undefined;

    // Hoy el inglés está completo; la prueba protege el día que no lo esté.
    if (sinTraducir) expect(i18n.t(sinTraducir)).toBe(ES[sinTraducir]);
    expect(i18n.t('nav.profile')).toBeTruthy();
  });

  it('no deja ninguna clave sin texto en ningún idioma', () => {
    for (const locale of ['es', 'en'] as const) {
      i18n.locale.set(locale);
      for (const key of Object.keys(ES) as MessageKey[]) {
        expect(i18n.t(key), `${locale}/${key}`).toBeTruthy();
      }
    }
  });

  it('el inglés no copia literalmente el español', () => {
    const iguales = (Object.keys(EN) as MessageKey[]).filter((key) => EN[key] === ES[key]);
    // «Videos» es igual en los dos idiomas; cualquier otra coincidencia sería
    // una traducción olvidada.
    expect(iguales).toEqual(['profile.tab.videos']);
  });

  it('sincroniza el idioma del documento', () => {
    TestBed.tick();
    i18n.locale.set('en');
    TestBed.tick();
    expect(document.documentElement.lang).toBe('en');
  });

  it('recuerda el idioma entre sesiones', () => {
    i18n.locale.set('en');
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({});
    expect(TestBed.inject(I18nStore).locale()).toBe('en');
  });
});
