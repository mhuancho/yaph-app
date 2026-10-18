import { computed, inject, Service } from '@angular/core';
import { PersistentState } from './persistent-state';

export type DataSaver = 'auto' | 'ahorro' | 'calidad';

/**
 * Preferencias del usuario.
 *
 * El autoplay vive aquí y no atado a `prefers-reduced-motion`: esa preferencia
 * gobierna el movimiento decorativo, y quien no quiera reproducción automática
 * necesita un interruptor explícito, no un efecto secundario de otra opción.
 */
@Service()
export class SettingsStore {
  private readonly store = inject(PersistentState);

  readonly autoplay = this.store.signal('autoplay', true);
  readonly startMuted = this.store.signal('start-muted', true);
  readonly dataSaver = this.store.signal<DataSaver>('data-saver', 'auto');
  readonly showTelemetry = this.store.signal('show-telemetry', true);

  /** `true` cuando el almacenamiento no está disponible (navegación privada). */
  readonly ephemeral = computed(() => !this.store.available);

  reset(): void {
    this.store.clear();
    this.autoplay.set(true);
    this.startMuted.set(true);
    this.dataSaver.set('auto');
    this.showTelemetry.set(true);
  }
}
