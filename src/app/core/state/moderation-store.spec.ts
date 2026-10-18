import { TestBed } from '@angular/core/testing';
import { MOCK_CLIPS } from '../data/mock-feed';
import { ClipActionsStore } from './clip-actions-store';
import { FeedStore } from './feed-store';
import { ModerationStore, REPORT_REASONS } from './moderation-store';

const CLIP = MOCK_CLIPS[0];

describe('ModerationStore', () => {
  let moderation: ModerationStore;
  let feed: FeedStore;
  let actions: ClipActionsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    moderation = TestBed.inject(ModerationStore);
    feed = TestBed.inject(FeedStore);
    actions = TestBed.inject(ClipActionsStore);
  });

  it('oculta del feed el clip marcado como no interesante', () => {
    expect(feed.clips().some((clip) => clip.id === CLIP.id)).toBe(true);

    actions.open(CLIP);
    actions.notInterested();

    expect(moderation.isHidden(CLIP.id)).toBe(true);
    expect(feed.clips().some((clip) => clip.id === CLIP.id)).toBe(false);
  });

  it('bloquear retira todos los clips de esa cuenta', () => {
    const creatorId = CLIP.creator.id;
    const before = feed.clips().filter((clip) => clip.creator.id === creatorId).length;
    expect(before).toBeGreaterThan(0);

    actions.open(CLIP);
    actions.toggleBlock();

    expect(moderation.isBlocked(creatorId)).toBe(true);
    expect(feed.clips().some((clip) => clip.creator.id === creatorId)).toBe(false);
  });

  it('desbloquear devuelve los clips', () => {
    actions.open(CLIP);
    actions.toggleBlock();
    actions.open(CLIP);
    actions.toggleBlock();

    expect(moderation.isBlocked(CLIP.creator.id)).toBe(false);
    expect(feed.clips().some((clip) => clip.id === CLIP.id)).toBe(true);
  });

  it('denunciar registra el motivo y oculta el clip', () => {
    actions.open(CLIP);
    actions.startReport();
    expect(actions.reporting()).toBe(true);

    actions.sendReport(REPORT_REASONS[0]);

    expect(moderation.isReported(CLIP.id)).toBe(true);
    // Quien denuncia algo no quiere seguir viéndolo mientras se revisa.
    expect(moderation.isHidden(CLIP.id)).toBe(true);
    expect(actions.clip()).toBeNull();
  });

  it('desbloquea todas las cuentas de una vez', () => {
    actions.open(CLIP);
    actions.toggleBlock();
    expect(moderation.blockedCount()).toBe(1);

    moderation.unblockAll();
    expect(moderation.blockedCount()).toBe(0);
  });

  it('abrir el menú de otro clip sale del modo denuncia', () => {
    actions.open(CLIP);
    actions.startReport();
    actions.open(MOCK_CLIPS[1]);

    expect(actions.reporting()).toBe(false);
  });
});
