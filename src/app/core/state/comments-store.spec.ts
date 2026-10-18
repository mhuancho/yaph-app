import { TestBed } from '@angular/core/testing';
import { MOCK_CLIPS } from '../data/mock-feed';
import { MOCK_COMMENTS } from '../data/mock-comments';
import { COMMENT_MAX_LENGTH, CommentsStore } from './comments-store';

const CLIP = MOCK_CLIPS[0];

describe('CommentsStore', () => {
  let store: CommentsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CommentsStore);
  });

  it('arranca con el panel cerrado', () => {
    expect(store.open()).toBe(false);
  });

  it('coloca los comentarios fijados al principio del hilo', () => {
    const thread = store.commentsFor(CLIP.id);
    expect(thread.length).toBe(MOCK_COMMENTS[CLIP.id].length);
    expect(thread[0].pinned).toBe(true);
    expect(thread.slice(1).some((comment) => comment.pinned)).toBe(false);
  });

  it('devuelve un hilo vacío para un clip sin comentarios', () => {
    expect(store.commentsFor('clip-inexistente')).toEqual([]);
  });

  it('publica el comentario justo después de los fijados', () => {
    expect(store.publish(CLIP.id, '  qué nivel  ')).toBe(true);

    const thread = store.commentsFor(CLIP.id);
    const published = thread[1];
    expect(published.body).toBe('qué nivel');
    expect(published.own).toBe(true);
    expect(published.ageMinutes).toBe(0);
    expect(thread[0].pinned).toBe(true);
  });

  it('rechaza un borrador vacío o solo con espacios', () => {
    expect(store.publish(CLIP.id, '   ')).toBe(false);
    expect(store.publish(CLIP.id, '')).toBe(false);
    expect(store.countFor(CLIP)).toBe(CLIP.metrics.comments);
  });

  it('recorta al límite de longitud', () => {
    store.publish(CLIP.id, 'x'.repeat(COMMENT_MAX_LENGTH + 40));
    expect(store.commentsFor(CLIP.id)[1].body).toHaveLength(COMMENT_MAX_LENGTH);
  });

  it('suma lo publicado al contador del servidor', () => {
    expect(store.countFor(CLIP)).toBe(CLIP.metrics.comments);

    store.publish(CLIP.id, 'primero');
    store.publish(CLIP.id, 'segundo');
    expect(store.countFor(CLIP)).toBe(CLIP.metrics.comments + 2);

    // Lo publicado en un clip no contamina al siguiente.
    expect(store.countFor(MOCK_CLIPS[1])).toBe(MOCK_CLIPS[1].metrics.comments);
  });

  it('da ids únicos a cada comentario publicado', () => {
    store.publish(CLIP.id, 'uno');
    store.publish(CLIP.id, 'dos');

    const ids = store.commentsFor(CLIP.id).map((comment) => comment.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alterna el me gusta de un comentario sin tocar los demás', () => {
    const [first, second] = store.commentsFor(CLIP.id);

    store.toggleLike(first.id);
    expect(store.isLiked(first.id)).toBe(true);
    expect(store.likeCount(first)).toBe(first.likes + 1);
    expect(store.isLiked(second.id)).toBe(false);

    store.toggleLike(first.id);
    expect(store.likeCount(first)).toBe(first.likes);
  });

  it('devuelve el foco al elemento que abrió el panel', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);

    store.toggle(trigger);
    expect(store.open()).toBe(true);

    store.closePanel();
    expect(store.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('no reenfoca si el panel ya estaba cerrado', () => {
    expect(() => store.closePanel()).not.toThrow();
    expect(store.open()).toBe(false);
  });
});
