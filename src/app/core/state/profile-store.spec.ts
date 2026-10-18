import { TestBed } from '@angular/core/testing';
import { CURRENT_PROFILE, MOCK_LIBRARY, MOCK_PROFILES } from '../data/mock-profiles';
import { MOCK_CLIPS } from '../data/mock-feed';
import { FeedStore } from './feed-store';
import { ProfileStore } from './profile-store';

const NYX = '@nyx.render';

describe('ProfileStore', () => {
  let store: ProfileStore;
  let feed: FeedStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ProfileStore);
    feed = TestBed.inject(FeedStore);
  });

  it('sin handle abre el perfil propio', () => {
    expect(store.profile()?.id).toBe(CURRENT_PROFILE.id);
    expect(store.isMe()).toBe(true);
  });

  it('resuelve el handle sin importar la arroba ni las mayúsculas', () => {
    for (const handle of [NYX, 'nyx.render', '@NYX.Render']) {
      expect(store.byHandle(handle)?.handle).toBe(NYX);
    }
  });

  it('devuelve null para un handle inexistente', () => {
    expect(store.byHandle('@no-existe')).toBeNull();
  });

  it('expone la biblioteca del perfil abierto', () => {
    store.openHandle.set(NYX);

    const profile = store.profile()!;
    expect(store.isMe()).toBe(false);
    expect(store.posts()).toEqual(MOCK_LIBRARY[profile.id]);
    expect(store.posts().every((clip) => clip.creator.id === profile.id)).toBe(true);
  });

  it('encabeza el perfil con el clip que el creador tiene en el feed', () => {
    store.openHandle.set(NYX);

    const featured = MOCK_CLIPS.find((clip) => clip.creator.handle === NYX)!;
    expect(store.posts()[0].id).toBe(featured.id);
  });

  it('genera la misma biblioteca en cada lectura', () => {
    store.openHandle.set(NYX);
    expect(store.posts()).toEqual(store.posts());
  });

  it('marca como en directo al perfil que tiene un clip emitiendo', () => {
    const liveClip = MOCK_CLIPS.find((clip) => clip.kind === 'live')!;

    store.openHandle.set(liveClip.creator.handle);
    expect(store.isLive()).toBe(true);
    expect(store.liveClip()?.kind).toBe('live');

    store.openHandle.set('@orbe.data');
    expect(store.isLive()).toBe(false);
    expect(store.liveClip()).toBeNull();
  });

  it('comparte el estado de seguimiento con el feed', () => {
    const profile = store.byHandle(NYX)!;
    expect(store.followerCount(profile)).toBe(profile.followers);

    feed.toggleFollow(profile.id);
    expect(store.isFollowed(profile.id)).toBe(true);
    expect(store.followerCount(profile)).toBe(profile.followers + 1);
  });

  it('construye una colección reproducible para el feed', () => {
    const profile = store.byHandle(NYX)!;
    const collection = store.collectionFor(profile);

    expect(collection.id).toBe(`profile:${profile.id}`);
    expect(collection.label).toBe(NYX);
    expect(collection.clips.length).toBeGreaterThan(1);
  });

  it('refleja guardados y me gusta del feed en el perfil propio', () => {
    const clip = MOCK_CLIPS[0];
    expect(store.saved()).toEqual([]);
    expect(store.liked()).toEqual([]);

    feed.toggleSave(clip.id);
    feed.toggleLike(clip.id);

    expect(store.saved().map((c) => c.id)).toEqual([clip.id]);
    expect(store.liked().map((c) => c.id)).toEqual([clip.id]);
  });

  it('incluye a todos los creadores del feed más el usuario', () => {
    expect(MOCK_PROFILES.length).toBe(new Set(MOCK_PROFILES.map((p) => p.id)).size);
    for (const clip of MOCK_CLIPS) {
      expect(store.byHandle(clip.creator.handle)).not.toBeNull();
    }
  });
});
