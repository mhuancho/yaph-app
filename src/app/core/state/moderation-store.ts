import { computed, inject, Service } from '@angular/core';
import { PersistentState } from './persistent-state';

export const REPORT_REASONS = [
  'Contenido engañoso',
  'Acoso o incitación al odio',
  'Violencia o contenido explícito',
  'Spam o estafa',
  'Infracción de derechos de autor',
  'Otro motivo',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/**
 * Cuentas bloqueadas y clips ocultos.
 *
 * Es un store propio y sin dependencias para que `FeedStore` pueda filtrar por
 * él sin crear un ciclo: el menú de acciones conoce a los dos, pero el feed
 * solo necesita saber qué no debe mostrar.
 */
@Service()
export class ModerationStore {
  private readonly store = inject(PersistentState);

  readonly blockedCreators = this.store.idSet('blocked');
  /** Clips marcados como «no me interesa». */
  readonly hiddenClips = this.store.idSet('hidden');
  /** Denuncias enviadas, por id de clip; evita duplicar el aviso. */
  readonly reported = this.store.idSet('reported');

  readonly blockedCount = computed(() => this.blockedCreators().size);

  isBlocked(creatorId: string): boolean {
    return this.blockedCreators().has(creatorId);
  }

  isHidden(clipId: string): boolean {
    return this.hiddenClips().has(clipId);
  }

  isReported(clipId: string): boolean {
    return this.reported().has(clipId);
  }

  toggleBlock(creatorId: string): void {
    this.blockedCreators.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(creatorId)) next.add(creatorId);
      return next;
    });
  }

  hide(clipId: string): void {
    this.hiddenClips.update((ids) => new Set(ids).add(clipId));
  }

  report(clipId: string): void {
    this.reported.update((ids) => new Set(ids).add(clipId));
  }

  unblockAll(): void {
    this.blockedCreators.set(new Set());
  }
}
