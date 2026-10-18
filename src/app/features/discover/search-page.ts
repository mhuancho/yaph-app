import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FeedCollection } from '../../core/models/feed';
import { SearchStore } from '../../core/state/search-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';
import { ClipGrid } from '../profile/clip-grid';

/**
 * Resultados de búsqueda.
 *
 * El término vive en la URL (`?q=`) y no solo en el store: así un resultado se
 * puede compartir, el botón atrás funciona y recargar no pierde la consulta.
 */
@Component({
  selector: 'app-search-page',
  imports: [AvatarOrb, HoloBadge, Icon, ClipGrid, RouterLink, CompactPipe],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
        <label
          class="glass edge-gradient flex items-center gap-2.5 rounded-glass border border-white/10 px-4 py-3"
        >
          <app-icon name="search" class="size-4 shrink-0 text-ink-faint" />
          <span class="sr-only">Buscar clips, sonidos o creadores</span>
          <input
            #field
            type="search"
            enterkeyhint="search"
            placeholder="Buscar clips, sonidos, creadores"
            class="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            [value]="q() ?? ''"
            (input)="onInput($event)"
          />
        </label>

        @if (search.query().length === 0) {
          <p class="metric mt-6 text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Tendencias
          </p>
          <ul class="mt-2 flex flex-wrap gap-2">
            @for (entry of search.trendingTags; track entry.tag) {
              <li>
                <a
                  [routerLink]="['/tag', entry.tag.slice(1)]"
                  class="metric inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[0.75rem] text-neon-cyan transition-[background-color,border-color] hover:border-neon-cyan/50 hover:bg-neon-cyan/10"
                >
                  {{ entry.tag }}
                  <span class="text-ink-faint">{{ entry.count }}</span>
                </a>
              </li>
            }
          </ul>
        } @else if (results().total === 0) {
          <p class="py-16 text-center text-sm text-ink-muted">
            Nada coincide con «{{ search.query() }}».
          </p>
        } @else {
          @if (results().creators.length > 0) {
            <section class="mt-6">
              <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Creadores
              </h2>
              <ul class="mt-2 space-y-2">
                @for (creator of results().creators; track creator.id) {
                  <li>
                    <a
                      [routerLink]="['/perfil', creator.handle]"
                      class="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-white/5"
                    >
                      <app-avatar-orb [creator]="creator" size="sm" />
                      <span class="min-w-0 flex-1">
                        <span class="flex items-center gap-2">
                          <span class="truncate text-[0.8125rem] font-medium text-ink">
                            {{ creator.handle }}
                          </span>
                          @if (creator.badge; as badge) {
                            <app-holo-badge [tier]="badge" />
                          }
                        </span>
                        <span class="metric block truncate text-[0.625rem] text-ink-faint">
                          {{ creator.followers | compact }} seguidores · {{ creator.displayName }}
                        </span>
                      </span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          @if (results().tags.length > 0) {
            <section class="mt-6">
              <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Hashtags
              </h2>
              <ul class="mt-2 flex flex-wrap gap-2">
                @for (entry of results().tags; track entry.tag) {
                  <li>
                    <a
                      [routerLink]="['/tag', entry.tag.slice(1)]"
                      class="metric inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-[0.75rem] text-neon-cyan"
                    >
                      {{ entry.tag }}
                      <span class="text-ink-faint">{{ entry.count }}</span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          @if (results().sounds.length > 0) {
            <section class="mt-6">
              <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Sonidos
              </h2>
              <ul class="mt-2 space-y-1">
                @for (entry of results().sounds; track entry.sound.id) {
                  <li>
                    <a
                      [routerLink]="['/sonido', entry.sound.id]"
                      class="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-white/5"
                    >
                      <span
                        aria-hidden="true"
                        class="grid size-9 shrink-0 place-items-center rounded-xl bg-neon-magenta/15 text-neon-magenta"
                      >
                        <app-icon name="music" class="size-4" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-[0.8125rem] text-ink">
                          {{ entry.sound.title }}
                        </span>
                        <span class="metric block truncate text-[0.625rem] text-ink-faint">
                          {{ entry.sound.author }} · {{ entry.count }} clips
                        </span>
                      </span>
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          @if (results().clips.length > 0) {
            <section class="mt-6">
              <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
                Clips
              </h2>
              <div class="mt-2">
                <app-clip-grid [collection]="collection()" />
              </div>
            </section>
          }
        }
      </div>
    </div>
  `,
})
export class SearchPage {
  /** Término de búsqueda, enlazado al query param `q`. */
  readonly q = input<string>();

  protected readonly search = inject(SearchStore);
  private readonly router = inject(Router);
  private readonly fieldRef = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected readonly results = computed(() => this.search.results());
  protected readonly collection = computed<FeedCollection>(() => ({
    id: `search:${this.search.query()}`,
    label: `«${this.search.query()}»`,
    clips: this.results().clips,
  }));

  constructor() {
    // La URL manda: al entrar por un enlace compartido el store se alinea con
    // el parámetro, no al revés.
    effect(() => this.search.query.set(this.q() ?? ''));
    afterNextRender(() => this.fieldRef().nativeElement.focus());
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.query.set(value);

    // `replaceUrl` para no llenar el historial con una entrada por tecla.
    void this.router.navigate([], {
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
