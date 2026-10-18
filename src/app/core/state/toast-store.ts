import { DestroyRef, inject, Service, signal } from '@angular/core';

export type ToastTone = 'info' | 'ok' | 'error';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

const VISIBLE_MS = 4_000;

/**
 * Avisos efímeros.
 *
 * Existe porque varias acciones (compartir, publicar, denunciar) terminan sin
 * cambiar la pantalla: sin una confirmación visible el usuario no sabe si
 * pasó algo. Los temporizadores se cancelan al destruirse el inyector para no
 * dejar `setTimeout` vivos en los tests.
 */
@Service()
export class ToastStore {
  readonly toasts = signal<readonly Toast[]>([]);

  private sequence = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
    });
  }

  show(message: string, tone: ToastTone = 'info'): void {
    this.sequence += 1;
    const toast: Toast = { id: this.sequence, message, tone };
    this.toasts.update((list) => [...list, toast]);

    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this.dismiss(toast.id);
    }, VISIBLE_MS);
    this.timers.add(timer);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }
}
