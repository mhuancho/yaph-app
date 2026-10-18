import { TestBed } from '@angular/core/testing';
import { MOCK_CLIPS } from '../data/mock-feed';
import { MOCK_COMMENTS } from '../data/mock-comments';
import { COMMENT_MAX_LENGTH, CommentsStore } from './comments-store';

const CLIP = MOCK_CLIPS[0];
const ROOT_SEED = MOCK_COMMENTS[CLIP.id].filter((comment) => comment.parentId === null);

describe('CommentsStore', () => {
  let store: CommentsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CommentsStore);
  });

  it('arranca con el panel cerrado y sin respuesta en curso', () => {
    expect(store.open()).toBe(false);
    expect(store.replyingTo()).toBeNull();
  });

  it('solo devuelve comentarios raíz, con los fijados al principio', () => {
    const roots = store.roots(CLIP.id);

    expect(roots.length).toBe(ROOT_SEED.length);
    expect(roots.every((comment) => comment.parentId === null)).toBe(true);
    expect(roots[0].pinned).toBe(true);
    expect(roots.slice(1).some((comment) => comment.pinned)).toBe(false);
  });

  it('devuelve las respuestas de un comentario y no las de otro', () => {
    const [pinned] = store.roots(CLIP.id);
    const replies = store.repliesFor(CLIP.id, pinned.id);

    expect(replies.length).toBeGreaterThan(0);
    expect(replies.every((reply) => reply.parentId === pinned.id)).toBe(true);
  });

  it('devuelve listas vacías para un clip sin comentarios', () => {
    expect(store.roots('clip-inexistente')).toEqual([]);
    expect(store.repliesFor('clip-inexistente', 'x')).toEqual([]);
  });

  it('publica el comentario raíz justo después de los fijados', () => {
    expect(store.publish(CLIP.id, '  qué nivel  ')).toBe(true);

    const published = store.roots(CLIP.id)[1];
    expect(published.body).toBe('qué nivel');
    expect(published.own).toBe(true);
    expect(published.parentId).toBeNull();
    expect(published.ageMinutes).toBe(0);
  });

  it('rechaza un borrador vacío o solo con espacios', () => {
    expect(store.publish(CLIP.id, '   ')).toBe(false);
    expect(store.publish(CLIP.id, '')).toBe(false);
    expect(store.countFor(CLIP)).toBe(CLIP.metrics.comments);
  });

  it('recorta al límite de longitud', () => {
    store.publish(CLIP.id, 'x'.repeat(COMMENT_MAX_LENGTH + 40));
    expect(store.roots(CLIP.id)[1].body).toHaveLength(COMMENT_MAX_LENGTH);
  });

  it('suma lo publicado al contador del servidor, sin contaminar otros clips', () => {
    store.publish(CLIP.id, 'primero');
    store.publish(CLIP.id, 'segundo');

    expect(store.countFor(CLIP)).toBe(CLIP.metrics.comments + 2);
    expect(store.countFor(MOCK_CLIPS[1])).toBe(MOCK_CLIPS[1].metrics.comments);
  });

  describe('respuestas', () => {
    it('cuelga la respuesta del comentario y despliega el hilo', () => {
      const [pinned] = store.roots(CLIP.id);
      const before = store.repliesFor(CLIP.id, pinned.id).length;

      store.startReply(pinned, CLIP.id);
      expect(store.replyingTo()?.id).toBe(pinned.id);

      store.publish(CLIP.id, 'buena pregunta');

      const replies = store.repliesFor(CLIP.id, pinned.id);
      expect(replies).toHaveLength(before + 1);
      expect(replies.at(-1)?.body).toBe('buena pregunta');
      expect(store.isExpanded(pinned.id)).toBe(true);
      // Una respuesta no aparece como comentario raíz.
      expect(store.roots(CLIP.id).some((c) => c.body === 'buena pregunta')).toBe(false);
    });

    it('limpia el estado de respuesta tras publicar', () => {
      const [pinned] = store.roots(CLIP.id);
      store.startReply(pinned, CLIP.id);
      store.publish(CLIP.id, 'ya está');
      expect(store.replyingTo()).toBeNull();
    });

    it('responder a una respuesta cuelga del mismo padre', () => {
      const [pinned] = store.roots(CLIP.id);
      const [firstReply] = store.repliesFor(CLIP.id, pinned.id);

      store.startReply(firstReply, CLIP.id);
      expect(store.replyingTo()?.id).toBe(pinned.id);
    });

    it('cancela la respuesta en curso', () => {
      store.startReply(store.roots(CLIP.id)[0], CLIP.id);
      store.cancelReply();
      expect(store.replyingTo()).toBeNull();
    });

    it('alterna el desplegado de respuestas', () => {
      const [pinned] = store.roots(CLIP.id);
      expect(store.isExpanded(pinned.id)).toBe(false);

      store.toggleReplies(pinned.id);
      expect(store.isExpanded(pinned.id)).toBe(true);

      store.toggleReplies(pinned.id);
      expect(store.isExpanded(pinned.id)).toBe(false);
    });
  });

  it('da ids únicos a cada comentario publicado', () => {
    store.publish(CLIP.id, 'uno');
    store.publish(CLIP.id, 'dos');

    const ids = store.roots(CLIP.id).map((comment) => comment.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alterna el me gusta de un comentario sin tocar los demás', () => {
    const [first, second] = store.roots(CLIP.id);

    store.toggleLike(first.id);
    expect(store.isLiked(first.id)).toBe(true);
    expect(store.likeCount(first)).toBe(first.likes + 1);
    expect(store.isLiked(second.id)).toBe(false);

    store.toggleLike(first.id);
    expect(store.likeCount(first)).toBe(first.likes);
  });

  it('devuelve el foco al elemento que abrió el panel y descarta la respuesta', () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);

    store.toggle(trigger);
    store.startReply(store.roots(CLIP.id)[0], CLIP.id);

    store.closePanel();
    expect(store.open()).toBe(false);
    expect(store.replyingTo()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  it('no reenfoca si el panel ya estaba cerrado', () => {
    expect(() => store.closePanel()).not.toThrow();
    expect(store.open()).toBe(false);
  });
});
