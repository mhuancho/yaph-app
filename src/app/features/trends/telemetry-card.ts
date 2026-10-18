import { Component, computed, inject } from '@angular/core';
import { PlaybackState } from '../../core/models/feed';
import { FeedStore } from '../../core/state/feed-store';
import { PlaybackTelemetryStore } from '../../core/state/playback-telemetry-store';
import { HudCard } from '../../ui/hud-card';
import { ClockPipe, PercentRatioPipe } from '../../ui/metric-pipes';

const STATE_LABELS: Readonly<Record<PlaybackState, string>> = {
  idle: 'en espera',
  loading: 'cargando',
  playing: 'reproduciendo',
  paused: 'pausado',
  error: 'error',
};

/**
 * Sonda de reproducción.
 *
 * Los valores vienen del `HTMLVideoElement` activo (resolución real, buffer,
 * `getVideoPlaybackQuality()`), no de datos simulados. La fila de fotogramas
 * descartados es la que delata de inmediato un exceso de capas con
 * `backdrop-filter` encima del video.
 */
@Component({
  selector: 'app-telemetry-card',
  imports: [HudCard, ClockPipe, PercentRatioPipe],
  host: { class: 'block' },
  template: `
    <app-hud-card heading="Telemetría" icon="activity" [tag]="stateLabel()">
      <dl class="grid grid-cols-2 gap-3">
        <div>
          <dt class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
            Resolución
          </dt>
          <dd class="metric mt-0.5 text-sm text-ink">{{ telemetry.resolution() }}</dd>
        </div>

        <div>
          <dt class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">Tiempo</dt>
          <dd class="metric mt-0.5 text-sm text-ink">
            {{ telemetry.currentTime() | clock }} / {{ telemetry.duration() | clock }}
          </dd>
        </div>

        <div>
          <dt class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">Audio</dt>
          <dd class="metric mt-0.5 text-sm text-ink">
            {{ feed.muted() ? 'silenciado' : 'activo' }}
          </dd>
        </div>

        <div>
          <dt class="metric text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
            Frames perdidos
          </dt>
          <dd class="metric mt-0.5 flex items-center gap-1.5 text-sm text-ink">
            <span
              class="size-1.5 rounded-full"
              [class.bg-neon-cyan]="telemetry.healthy()"
              [class.bg-neon-magenta]="!telemetry.healthy()"
            ></span>
            {{ telemetry.dropRatio() | pct }}
          </dd>
        </div>
      </dl>

      <div class="mt-4 space-y-2.5">
        <!-- Progreso y buffer: scaleX sobre una capa fija, nunca width. -->
        <div>
          <div
            class="metric mb-1 flex justify-between text-[0.625rem] tracking-[0.1em] text-ink-faint uppercase"
          >
            <span>Progreso</span>
            <span>{{ telemetry.progress() | pct }}</span>
          </div>
          <div class="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              class="h-full origin-left rounded-full bg-neon-cyan"
              [style.transform]="scaleX(telemetry.progress())"
            ></div>
          </div>
        </div>

        <div>
          <div
            class="metric mb-1 flex justify-between text-[0.625rem] tracking-[0.1em] text-ink-faint uppercase"
          >
            <span>Buffer</span>
            <span>{{ telemetry.bufferAhead() | pct }}</span>
          </div>
          <div class="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              class="h-full origin-left rounded-full bg-neon-violet"
              [style.transform]="scaleX(telemetry.bufferAhead())"
            ></div>
          </div>
        </div>
      </div>
    </app-hud-card>
  `,
})
export class TelemetryCard {
  protected readonly telemetry = inject(PlaybackTelemetryStore);
  protected readonly feed = inject(FeedStore);

  protected readonly stateLabel = computed(() => STATE_LABELS[this.telemetry.state()]);

  protected scaleX(ratio: number): string {
    return `scaleX(${ratio})`;
  }
}
