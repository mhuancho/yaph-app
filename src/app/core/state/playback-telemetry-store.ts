import { computed, Service, signal } from '@angular/core';
import { clamp01 } from '../util/format';
import { EMPTY_TELEMETRY, PlaybackState, PlaybackTelemetry } from '../models/feed';

/**
 * Telemetría del elemento de video activo.
 *
 * Son cifras reales leídas del `HTMLVideoElement` (resolución, buffer,
 * `getVideoPlaybackQuality()`), no decoración: el panel HUD sirve de sonda de
 * reproducción y en producción es el mismo dato que se enviaría al backend de
 * QoE.
 */
@Service()
export class PlaybackTelemetryStore {
  private readonly snapshot = signal<PlaybackTelemetry>(EMPTY_TELEMETRY);

  readonly state = computed<PlaybackState>(() => this.snapshot().state);
  readonly resolution = computed(() => {
    const { width, height } = this.snapshot();
    return width && height ? `${width}×${height}` : '—';
  });
  readonly progress = computed(() => {
    const { currentTime, duration } = this.snapshot();
    return duration > 0 ? clamp01(currentTime / duration) : 0;
  });
  readonly bufferAhead = computed(() => this.snapshot().bufferAhead);
  readonly currentTime = computed(() => this.snapshot().currentTime);
  readonly duration = computed(() => this.snapshot().duration);

  /**
   * Fotogramas descartados sobre decodificados. Es la métrica que delata un
   * exceso de capas con `backdrop-filter` encima del video.
   */
  readonly dropRatio = computed(() => {
    const { droppedFrames, decodedFrames } = this.snapshot();
    return decodedFrames > 0 ? clamp01(droppedFrames / decodedFrames) : 0;
  });
  readonly droppedFrames = computed(() => this.snapshot().droppedFrames);

  readonly healthy = computed(() => this.dropRatio() < 0.05 && this.state() !== 'error');

  report(patch: Partial<PlaybackTelemetry>): void {
    this.snapshot.update((current) => ({ ...current, ...patch }));
  }

  reset(): void {
    this.snapshot.set(EMPTY_TELEMETRY);
  }
}
