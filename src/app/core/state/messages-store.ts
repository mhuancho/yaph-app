import { computed, inject, Service, signal } from '@angular/core';
import { MOCK_CONVERSATIONS } from '../data/mock-messages';
import { CommentAuthor, Conversation, DirectMessage } from '../models/feed';
import { PersistentState } from './persistent-state';

/**
 * Bandeja de mensajes directos.
 *
 * Los no leídos se calculan desde las conversaciones, nunca se guardan aparte:
 * una insignia que lleva su propia cuenta acaba desincronizada del contenido
 * que dice resumir.
 */
@Service()
export class MessagesStore {
  private readonly store = inject(PersistentState);
  readonly conversations = this.store.signal<readonly Conversation[]>(
    'conversations',
    MOCK_CONVERSATIONS,
  );
  readonly openId = signal<string | null>(null);

  private sequence = 0;

  readonly open = computed(
    () => this.conversations().find((item) => item.id === this.openId()) ?? null,
  );
  readonly unreadTotal = computed(() =>
    this.conversations().reduce((sum, item) => sum + item.unread, 0),
  );

  /** Último mensaje de cada hilo, para la lista. */
  lastMessage(conversation: Conversation): DirectMessage | null {
    return conversation.messages.at(-1) ?? null;
  }

  openConversation(id: string): void {
    this.openId.set(id);
    this.markRead(id);
  }

  close(): void {
    this.openId.set(null);
  }

  /**
   * Abre el hilo con un handle, creándolo si aún no existía: es lo que ocurre
   * al pulsar «Mensaje» en un perfil con el que nunca se ha hablado.
   */
  openWithPeer(handle: string, peer: CommentAuthor | null): string | null {
    const normalized = handle.replace(/^@/, '').toLowerCase();
    const existing = this.conversations().find(
      (item) => item.peer.handle.replace(/^@/, '').toLowerCase() === normalized,
    );

    if (existing) {
      this.openConversation(existing.id);
      return existing.id;
    }
    if (!peer) return null;

    const created: Conversation = {
      id: `dm-${peer.id}`,
      peer,
      unread: 0,
      messages: [],
    };
    this.conversations.update((list) => [created, ...list]);
    this.openConversation(created.id);
    return created.id;
  }

  markRead(id: string): void {
    this.conversations.update((list) =>
      list.map((item) => (item.id === id && item.unread > 0 ? { ...item, unread: 0 } : item)),
    );
  }

  /** Devuelve `false` si no había nada que enviar, igual que el composer del hilo. */
  send(body: string): boolean {
    const text = body.trim();
    const id = this.openId();
    if (text.length === 0 || !id) return false;

    this.sequence += 1;
    const message: DirectMessage = {
      id: `dm-local-${this.sequence}`,
      mine: true,
      body: text,
      ageMinutes: 0,
    };

    this.conversations.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, messages: [...item.messages, message] } : item,
      ),
    );
    return true;
  }
}
