import { TestBed } from '@angular/core/testing';
import { FeedStore } from './feed-store';
import { PersistentState } from './persistent-state';
import { SettingsStore } from './settings-store';

describe('PersistentState', () => {
  let state: PersistentState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(PersistentState);
  });

  it('devuelve el valor por defecto cuando no hay nada guardado', () => {
    expect(state.read('ausente', 'defecto')).toBe('defecto');
  });

  it('guarda y recupera estructuras', () => {
    state.write('clave', { a: 1, b: ['x'] });
    expect(state.read('clave', null)).toEqual({ a: 1, b: ['x'] });
  });

  it('sobrevive a un JSON corrupto sin lanzar', () => {
    localStorage.setItem('yaph:v1:roto', '{no-es-json');
    expect(state.read('roto', 'defecto')).toBe('defecto');
  });

  it('solo borra sus propias claves', () => {
    localStorage.setItem('ajeno', 'intacto');
    state.write('mía', 1);

    state.clear();

    expect(localStorage.getItem('ajeno')).toBe('intacto');
    expect(state.read('mía', null)).toBeNull();
  });
});

describe('estado persistido entre sesiones', () => {
  it('recupera los me gusta tras recrear el store', () => {
    TestBed.configureTestingModule({});
    TestBed.inject(FeedStore).toggleLike('clip-neon-grid');
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({});
    expect(TestBed.inject(FeedStore).isLiked('clip-neon-grid')).toBe(true);
  });

  it('recupera las preferencias tras recrear el store', () => {
    TestBed.configureTestingModule({});
    TestBed.inject(SettingsStore).autoplay.set(false);
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({});
    expect(TestBed.inject(SettingsStore).autoplay()).toBe(false);
  });

  it('el ajuste de autoplay decide si el feed arranca pausado', () => {
    TestBed.configureTestingModule({});
    TestBed.inject(SettingsStore).autoplay.set(false);
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({});
    expect(TestBed.inject(FeedStore).paused()).toBe(true);
  });
});
