import { TestBed } from '@angular/core/testing';
import { MOCK_CONVERSATIONS } from '../data/mock-messages';
import { CREATORS } from '../data/mock-feed';
import { MessagesStore } from './messages-store';

describe('MessagesStore', () => {
  let store: MessagesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MessagesStore);
  });

  it('suma los no leídos de todas las conversaciones', () => {
    const expected = MOCK_CONVERSATIONS.reduce((sum, item) => sum + item.unread, 0);
    expect(store.unreadTotal()).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it('marca como leída la conversación al abrirla', () => {
    const withUnread = MOCK_CONVERSATIONS.find((item) => item.unread > 0)!;
    const before = store.unreadTotal();

    store.openConversation(withUnread.id);

    expect(store.open()?.id).toBe(withUnread.id);
    expect(store.unreadTotal()).toBe(before - withUnread.unread);
  });

  it('abre por handle sin importar la arroba ni las mayúsculas', () => {
    expect(store.openWithPeer('NYX.render', null)).toBe('dm-nyx');
    expect(store.open()?.peer.handle).toBe('@nyx.render');
  });

  it('crea el hilo con quien aún no se ha hablado', () => {
    const peer = CREATORS.orbe;
    expect(store.conversations().some((c) => c.peer.id === peer.id)).toBe(false);

    const id = store.openWithPeer(peer.handle, peer);

    expect(id).toBe(`dm-${peer.id}`);
    expect(store.open()?.messages).toEqual([]);
    expect(store.conversations()[0].peer.id).toBe(peer.id);
  });

  it('no inventa un hilo si no sabe con quién', () => {
    expect(store.openWithPeer('@desconocido', null)).toBeNull();
  });

  it('añade el mensaje al final del hilo abierto', () => {
    store.openConversation('dm-kaze');
    const before = store.open()!.messages.length;

    expect(store.send('  vale  ')).toBe(true);

    const messages = store.open()!.messages;
    expect(messages).toHaveLength(before + 1);
    expect(messages.at(-1)).toMatchObject({ body: 'vale', mine: true, ageMinutes: 0 });
  });

  it('rechaza un mensaje vacío o sin hilo abierto', () => {
    expect(store.send('hola')).toBe(false);

    store.openConversation('dm-kaze');
    expect(store.send('   ')).toBe(false);
  });

  it('no mezcla mensajes entre conversaciones', () => {
    store.openConversation('dm-kaze');
    store.send('solo para kaze');

    const otra = store.conversations().find((c) => c.id === 'dm-volt')!;
    expect(otra.messages.some((m) => m.body === 'solo para kaze')).toBe(false);
  });
});
