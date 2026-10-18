import { computed, inject, Service } from '@angular/core';
import { MOCK_NOTIFICATIONS } from '../data/mock-notifications';
import { AppNotification } from '../models/feed';
import { PersistentState } from './persistent-state';

/**
 * Bandeja de actividad.
 *
 * Comparte pantalla con los mensajes, como en cualquier aplicación del
 * género: son dos listas de cosas que han pasado y separarlas en dos destinos
 * de navegación obligaría a mirar en dos sitios.
 */
@Service()
export class NotificationsStore {
  private readonly store = inject(PersistentState);

  readonly items = this.store.signal<readonly AppNotification[]>(
    'notifications',
    MOCK_NOTIFICATIONS,
  );

  readonly unreadTotal = computed(() => this.items().filter((item) => !item.read).length);

  markAllRead(): void {
    this.items.update((list) => list.map((item) => ({ ...item, read: true })));
  }

  markRead(id: string): void {
    this.items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }
}
