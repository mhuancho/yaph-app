import { TestBed } from '@angular/core/testing';
import { ALL_CLIPS, ALL_TAGS, clipsForSound, clipsForTag, soundById } from '../data/catalog';
import { MOCK_CLIPS } from '../data/mock-feed';
import { SearchStore } from './search-store';

describe('catálogo', () => {
  it('reúne las publicaciones de todos los perfiles', () => {
    expect(ALL_CLIPS.length).toBeGreaterThan(MOCK_CLIPS.length);
    expect(new Set(ALL_CLIPS.map((c) => c.id)).size).toBe(ALL_CLIPS.length);
  });

  it('indexa por hashtag sin almohadilla ni mayúsculas', () => {
    const [first] = ALL_TAGS;
    expect(clipsForTag(first.tag)).toHaveLength(first.count);
    expect(clipsForTag(first.tag.slice(1).toUpperCase())).toHaveLength(first.count);
    expect(clipsForTag('#no-existe')).toEqual([]);
  });

  it('indexa por sonido', () => {
    const clip = MOCK_CLIPS[0];
    expect(soundById(clip.audio.id)?.title).toBe(clip.audio.title);
    expect(clipsForSound(clip.audio.id).some((c) => c.id === clip.id)).toBe(true);
    expect(soundById('no-existe')).toBeNull();
  });
});

describe('SearchStore', () => {
  let store: SearchStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SearchStore);
  });

  it('no devuelve nada sin término', () => {
    expect(store.results().total).toBe(0);
  });

  it('encuentra creadores por handle, nombre o biografía', () => {
    store.query.set('nyx');
    expect(store.results().creators.some((c) => c.handle === '@nyx.render')).toBe(true);

    store.query.set('shaders');
    expect(store.results().creators.length).toBeGreaterThan(0);
  });

  it('ignora acentos y mayúsculas', () => {
    store.query.set('NEON');
    const sinTilde = store.results().total;
    store.query.set('neón');
    expect(store.results().total).toBe(sinTilde);
    expect(sinTilde).toBeGreaterThan(0);
  });

  it('encuentra clips por descripción, hashtag y sonido', () => {
    store.query.set('raymarching');
    expect(store.results().clips.length).toBeGreaterThan(0);

    store.query.set('dithering');
    expect(store.results().clips.length).toBeGreaterThan(0);
  });

  it('devuelve cero resultados para algo inexistente', () => {
    store.query.set('zzzzz-no-existe');
    expect(store.results().total).toBe(0);
  });
});
