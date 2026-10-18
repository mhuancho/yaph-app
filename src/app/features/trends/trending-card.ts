import { Component, inject } from '@angular/core';
import { TrendsStore } from '../../core/state/trends-store';
import { HudCard } from '../../ui/hud-card';
import { CompactPipe, DeltaPipe } from '../../ui/metric-pipes';
import { Sparkline } from '../../ui/sparkline';

@Component({
  selector: 'app-trending-card',
  imports: [HudCard, Sparkline, CompactPipe, DeltaPipe],
  host: { class: 'block' },
  template: `
    <app-hud-card heading="Tendencias" icon="hash" tag="60 min">
      <ul class="space-y-1">
        @for (trend of trends.trending(); track trend.tag) {
          <li>
            <a
              href="#contenido"
              class="group/row -mx-1.5 flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors duration-200 hover:bg-white/5"
            >
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[0.8125rem] font-medium text-ink">
                  {{ trend.tag }}
                </span>
                <span class="metric text-[0.625rem] text-ink-faint">
                  {{ trend.posts | compact }} clips
                </span>
              </span>

              <!-- El sparkline toma el color del delta, así que la dirección se
                   lee sin depender solo del color: también está el signo. -->
              <app-sparkline
                class="h-7 w-16 shrink-0 opacity-70 transition-opacity group-hover/row:opacity-100"
                [class.text-neon-cyan]="trend.deltaPercent >= 0"
                [class.text-neon-magenta]="trend.deltaPercent < 0"
                [series]="trend.series"
              />

              <span
                class="metric w-14 shrink-0 text-right text-[0.6875rem] font-medium"
                [class.text-neon-cyan]="trend.deltaPercent >= 0"
                [class.text-neon-magenta]="trend.deltaPercent < 0"
              >
                {{ trend.deltaPercent | delta }}
              </span>
            </a>
          </li>
        }
      </ul>
    </app-hud-card>
  `,
})
export class TrendingCard {
  protected readonly trends = inject(TrendsStore);
}
