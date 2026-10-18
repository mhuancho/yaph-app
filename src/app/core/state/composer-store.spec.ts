import { TestBed } from '@angular/core/testing';
import { CURRENT_PROFILE } from '../data/mock-profiles';
import { ComposerStore, DESCRIPTION_MAX_LENGTH, SAMPLE_FOOTAGE } from './composer-store';
import { FeedStore } from './feed-store';
import { ProfileStore } from './profile-store';

describe('ComposerStore', () => {
  let composer: ComposerStore;
  let feed: FeedStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    composer = TestBed.inject(ComposerStore);
    feed = TestBed.inject(FeedStore);
  });

  it('extrae los hashtags del propio texto, sin repetir', () => {
    composer.description.set('Prueba de #Motion con #motion y #neón ✨');
    expect(composer.hashtags()).toEqual(['#motion', '#neón']);
  });

  it('no publica sin descripción', () => {
    expect(composer.canPublish()).toBe(false);
    expect(composer.publish()).toBeNull();
  });

  it('publica con el autor, el metraje y el sonido elegidos', () => {
    composer.footage.set(SAMPLE_FOOTAGE[2]);
    composer.description.set('Degradados a 540p #holograma');
    composer.selectSound(composer.sounds[0].id);

    const clip = composer.publish()!;

    expect(clip.creator.id).toBe(CURRENT_PROFILE.id);
    expect(clip.hashtags).toEqual(['#holograma']);
    expect(clip.audio.id).toBe(composer.sounds[0].id);
    expect(clip.sources[0].src).toContain(SAMPLE_FOOTAGE[2].file);
    expect(clip.metrics.views).toBe(0);
  });

  it('usa sonido original cuando no se elige ninguno', () => {
    composer.description.set('Sin música prestada');
    expect(composer.publish()!.audio.title).toBe('Sonido original');
  });

  it('recorta la descripción al límite', () => {
    composer.description.set('x'.repeat(DESCRIPTION_MAX_LENGTH + 50));
    expect(composer.publish()!.description).toHaveLength(DESCRIPTION_MAX_LENGTH);
  });

  it('limpia el borrador tras publicar', () => {
    composer.description.set('algo');
    composer.publish();

    expect(composer.description()).toBe('');
    expect(composer.sound()).toBeNull();
  });

  it('coloca el clip al principio del feed y en el perfil propio', () => {
    const profiles = TestBed.inject(ProfileStore);
    const before = feed.clips().length;

    composer.description.set('recién publicado');
    const clip = composer.publish()!;

    expect(feed.clips()).toHaveLength(before + 1);
    expect(feed.clips()[0].id).toBe(clip.id);
    expect(feed.activeIndex()).toBe(0);
    expect(profiles.posts()[0].id).toBe(clip.id);
  });

  it('da un id distinto a cada publicación', () => {
    composer.description.set('uno');
    const a = composer.publish()!;
    composer.description.set('dos');
    const b = composer.publish()!;

    expect(a.id).not.toBe(b.id);
  });
});
