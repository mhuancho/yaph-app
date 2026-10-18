import { Component, computed, input } from '@angular/core';
import { VideoClip } from '../../core/models/feed';
import { seededSeries } from '../../core/util/noise';
import { CompactPipe } from '../../ui/metric-pipes';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface Bar {
  readonly day: string;
  readonly views: number;
  /** Alto relativo al máximo de la semana, 0..1. */
  readonly ratio: number;
  readonly peak: boolean;
}

/**
 * Analíticas del perfil propio.
 *
 * Decisiones de la visualización, en el orden en que se toman:
 *
 * 1. **Forma.** Los totales son cifras sueltas, así que son tarjetas y no un
 *    gráfico: un gráfico de una barra es siempre peor que el número. La serie
 *    diaria sí es magnitud por categoría discreta, que es una barra.
 * 2. **Color.** Una sola serie, un solo color para todas las barras. Teñir
 *    cada barra según su valor gastaría el único canal libre en repetir lo que
 *    ya dice la altura.
 * 3. **Validación.** `--color-chart-1` es un paso del cian de marca que pasa
 *    las seis comprobaciones sobre la superficie oscura; el cian de interfaz
 *    (L 0.87) no. Los tres neones de marca juntos no forman paleta
 *    categórica: en deuteranopia su separación cae a ΔE 4.5.
 * 4. **Marcas.** Barras finas —un relleno saturado es un acento pequeño,
 *    nunca un bloque grande— con el extremo redondeado anclado a la línea
 *    base, y rejilla de un pelo, sólida y un tono por encima de la
 *    superficie. El área sensible al puntero es toda la columna, mayor que
 *    la propia marca.
 * 5. **Etiquetas.** Solo el máximo lleva cifra; el resto la dan el eje y el
 *    `title` de cada barra. Un número sobre cada barra no se lee.
 * 6. **Accesibilidad.** La misma serie va en una tabla para lectores de
 *    pantalla: el color y la altura nunca son el único camino al dato.
 */
@Component({
  selector: 'app-analytics-panel',
  imports: [CompactPipe],
  host: { class: 'block' },
  template: `
    <section class="glass rounded-glass border border-white/10 p-4">
      <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
        Resumen de 7 días
      </h2>

      <!-- Tarjetas: cifras, no gráficos. Sin color por tarjeta, que no
           codificaría nada. -->
      <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        @for (stat of stats(); track stat.label) {
          <div class="rounded-xl border border-white/8 bg-white/4 p-3">
            <dt class="metric text-[0.5625rem] tracking-[0.12em] text-ink-faint uppercase">
              {{ stat.label }}
            </dt>
            <dd class="metric mt-1 text-lg font-semibold text-ink">
              {{ stat.value | compact }}
            </dd>
          </div>
        }
      </dl>

      <figure class="mt-5">
        <figcaption
          class="metric mb-2 flex items-baseline justify-between text-[0.625rem] text-ink-faint"
        >
          <span class="tracking-[0.12em] uppercase">Reproducciones por día</span>
          <span>máx. {{ peak() | compact }}</span>
        </figcaption>

        <div class="relative h-28">
          <!-- Rejilla: un pelo, sólida y un tono por encima de la superficie. -->
          @for (line of gridLines; track line) {
            <span
              aria-hidden="true"
              class="absolute inset-x-0 h-px bg-white/8"
              [style.bottom.%]="line * 100"
            ></span>
          }

          <!-- Marcas finas: un relleno saturado vale como acento pequeño, no
               como bloque grande. La barra se centra en su columna y el área
               de interacción es toda la columna, mayor que la marca. -->
          <ul class="absolute inset-0 flex items-stretch" aria-hidden="true">
            @for (bar of bars(); track bar.day) {
              <li
                class="flex h-full flex-1 items-end justify-center"
                [title]="bar.day + ': ' + bar.views + ' reproducciones'"
              >
                <span
                  class="relative w-2.5 rounded-t-[4px] bg-chart-1 transition-opacity hover:opacity-75"
                  [style.height.%]="bar.ratio * 100"
                >
                  @if (bar.peak) {
                    <span
                      class="metric absolute -top-4 left-1/2 -translate-x-1/2 text-[0.5625rem] whitespace-nowrap text-ink"
                    >
                      {{ bar.views | compact }}
                    </span>
                  }
                </span>
              </li>
            }
          </ul>
        </div>

        <ul class="mt-1.5 flex" aria-hidden="true">
          @for (bar of bars(); track bar.day) {
            <li class="metric flex-1 text-center text-[0.5625rem] text-ink-faint">
              {{ bar.day }}
            </li>
          }
        </ul>

        <!-- Misma serie, en tabla: el dato no depende de ver la altura. -->
        <table class="sr-only">
          <caption>
            Reproducciones por día en la última semana
          </caption>
          <thead>
            <tr>
              <th scope="col">Día</th>
              <th scope="col">Reproducciones</th>
            </tr>
          </thead>
          <tbody>
            @for (bar of bars(); track bar.day) {
              <tr>
                <th scope="row">{{ bar.day }}</th>
                <td>{{ bar.views }}</td>
              </tr>
            }
          </tbody>
        </table>
      </figure>

      @if (topClips().length > 0) {
        <h3 class="metric mt-5 text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
          Clips con más alcance
        </h3>
        <ol class="mt-2 space-y-1.5">
          @for (clip of topClips(); track clip.id) {
            <li class="flex items-center gap-3">
              <span
                aria-hidden="true"
                class="clip-poster size-8 shrink-0 rounded-md"
                [style.--glow-from]="clip.accent.from"
                [style.--glow-to]="clip.accent.to"
              ></span>
              <span class="min-w-0 flex-1 truncate text-[0.8125rem] text-ink/90">
                {{ clip.description }}
              </span>
              <span class="metric shrink-0 text-[0.75rem] text-ink">
                {{ clip.metrics.views | compact }}
              </span>
            </li>
          }
        </ol>
      }
    </section>
  `,
})
export class AnalyticsPanel {
  readonly posts = input.required<readonly VideoClip[]>();

  protected readonly gridLines = [0.25, 0.5, 0.75, 1];

  protected readonly stats = computed(() => {
    const posts = this.posts();
    const sum = (pick: (clip: VideoClip) => number) => posts.reduce((n, c) => n + pick(c), 0);

    return [
      { label: 'Reproducciones', value: sum((c) => c.metrics.views) },
      { label: 'Me gusta', value: sum((c) => c.metrics.likes) },
      { label: 'Comentarios', value: sum((c) => c.metrics.comments) },
      { label: 'Compartidos', value: sum((c) => c.metrics.shares) },
    ];
  });

  /**
   * Serie diaria derivada del total con una semilla fija: sin marcas de tiempo
   * en los datos, inventarla con `Math.random()` daría un gráfico distinto en
   * cada render. Con backend sería un `GROUP BY` por día.
   */
  private readonly series = computed(() => {
    const total = this.stats()[0].value;
    const weights = seededSeries('analytics:7d', DAYS.length, 0.35);
    const sum = weights.reduce((n, w) => n + w, 0);
    return weights.map((weight) => Math.round((total * 0.12 * weight) / sum));
  });

  protected readonly peak = computed(() => Math.max(...this.series(), 1));

  protected readonly bars = computed<readonly Bar[]>(() => {
    const series = this.series();
    const peak = this.peak();

    return series.map((views, index) => ({
      day: DAYS[index],
      views,
      ratio: views / peak,
      peak: views === peak,
    }));
  });

  protected readonly topClips = computed(() =>
    [...this.posts()].sort((a, b) => b.metrics.views - a.metrics.views).slice(0, 3),
  );
}
