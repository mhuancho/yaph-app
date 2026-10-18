import { TestBed } from '@angular/core/testing';
import { MOCK_CLIPS } from '../data/mock-feed';
import { FeedStore, MOUNT_RADIUS } from './feed-store';

describe('FeedStore', () => {
  let store: FeedStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(FeedStore);
  });

  it('arranca en el primer clip y silenciado', () => {
    expect(store.activeIndex()).toBe(0);
    expect(store.activeClip()?.id).toBe(MOCK_CLIPS[0].id);
    // Sin esto, el primer `play()` lo rechaza la política de autoplay.
    expect(store.muted()).toBe(true);
  });

  it('acota el índice activo al rango disponible', () => {
    store.setActiveIndex(999);
    expect(store.activeIndex()).toBe(store.total() - 1);

    store.setActiveIndex(-5);
    expect(store.activeIndex()).toBe(0);
  });

  it('monta solo el clip activo y sus vecinos inmediatos', () => {
    store.setActiveIndex(3);

    expect(store.shouldMount(3)).toBe(true);
    expect(store.shouldMount(3 - MOUNT_RADIUS)).toBe(true);
    expect(store.shouldMount(3 + MOUNT_RADIUS)).toBe(true);
    expect(store.shouldMount(3 + MOUNT_RADIUS + 1)).toBe(false);
    expect(store.shouldMount(0)).toBe(false);
  });

  it('repliega la descripción al cambiar de clip', () => {
    store.toggleDescription();
    expect(store.descriptionExpanded()).toBe(true);

    store.next();
    expect(store.descriptionExpanded()).toBe(false);
  });

  it('activa un clip por id', () => {
    store.activateById(MOCK_CLIPS[2].id);
    expect(store.activeIndex()).toBe(2);

    store.activateById('no-existe');
    expect(store.activeIndex()).toBe(2);
  });

  it('suma el voto local al contador del servidor', () => {
    const clip = MOCK_CLIPS[0];
    expect(store.likeCount(clip)).toBe(clip.metrics.likes);

    store.toggleLike(clip.id);
    expect(store.isLiked(clip.id)).toBe(true);
    expect(store.likeCount(clip)).toBe(clip.metrics.likes + 1);

    store.toggleLike(clip.id);
    expect(store.isLiked(clip.id)).toBe(false);
    expect(store.likeCount(clip)).toBe(clip.metrics.likes);
  });

  it('mantiene independientes guardados y seguidos', () => {
    const clip = MOCK_CLIPS[1];

    store.toggleSave(clip.id);
    expect(store.isSaved(clip.id)).toBe(true);
    expect(store.saveCount(clip)).toBe(clip.metrics.saves + 1);
    expect(store.isLiked(clip.id)).toBe(false);

    store.toggleFollow(clip.creator.id);
    expect(store.isFollowed(clip.creator.id)).toBe(true);
  });

  it('arranca reproduciendo y reanuda al cambiar de clip', () => {
    // El feed autorreproduce siempre: `prefers-reduced-motion` gobierna el
    // movimiento decorativo, no el contenido.
    expect(store.paused()).toBe(false);

    store.togglePlayback();
    expect(store.paused()).toBe(true);

    store.next();
    expect(store.paused()).toBe(false);
  });

  it('no reinicia el estado si el índice no cambia', () => {
    store.togglePlayback();
    store.setActiveIndex(0);
    expect(store.paused()).toBe(true);
  });
});

describe('FeedStore — paginación', () => {
  let store: FeedStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(FeedStore);
  });

  it('añade clips nuevos sin repetir los que ya estaban', () => {
    const before = store.total();
    store.loadMore();

    const ids = store.clips().map((clip) => clip.id);
    expect(store.total()).toBeGreaterThan(before);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('se agota y deja de crecer', () => {
    for (let i = 0; i < 40; i++) store.loadMore();

    expect(store.exhausted()).toBe(true);
    const total = store.total();
    store.loadMore();
    expect(store.total()).toBe(total);
  });

  it('no alarga una colección que no es «Para ti»', () => {
    const clips = store.clips().slice(0, 2);
    store.playCollection({ id: 'profile:x', label: '@x', clips });

    store.loadMore();
    expect(store.total()).toBe(2);
  });
});
