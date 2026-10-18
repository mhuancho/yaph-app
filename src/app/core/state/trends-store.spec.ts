import { TestBed } from '@angular/core/testing';
import { TrendsStore } from './trends-store';

describe('TrendsStore', () => {
  let store: TrendsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(TrendsStore);
  });

  it('expone tendencias y creadores sugeridos', () => {
    expect(store.trending().length).toBeGreaterThan(0);
    expect(store.suggested().length).toBeGreaterThan(0);
  });

  it('inserta los comentarios nuevos al principio y recorta la lista', () => {
    const initial = store.liveComments();
    store.pushNext();

    const after = store.liveComments();
    expect(after).toHaveLength(initial.length);
    expect(after[0].id).not.toBe(initial[0].id);
    expect(after[1].id).toBe(initial[0].id);
  });

  it('da un id único a cada aparición aunque la cola se repita', () => {
    // Más vueltas que comentarios en la cola: sin el sello, `@for` recibiría
    // claves duplicadas y Angular lanzaría.
    for (let i = 0; i < 40; i++) store.pushNext();

    const ids = store.liveComments().map((comment) => comment.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('devuelve un teardown que detiene el intervalo', () => {
    const stop = store.connect(10);
    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
  });
});
