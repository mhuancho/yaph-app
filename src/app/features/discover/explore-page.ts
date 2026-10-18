import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ALL_CLIPS, ALL_TAGS, clipsForTag } from '../../core/data/catalog';
import { FeedCollection } from '../../core/models/feed';
import { ProfileStore } from '../../core/state/profile-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { HoloBadge } from '../../ui/holo-badge';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';
import { ClipGrid } from '../profile/clip-grid';

type Sort = 'populares' | 'recientes' | 'directos';

const SORTS = [
  { id: 'populares', label: 'Populares' },
  { id: 'recientes', label: 'Recientes' },
  { id: 'directos', label: 'En directo' },
] as const satisfies readonly { id: Sort; label: string }[];

/**
 * Descubrimiento: hashtags, creadores y una parrilla filtrable.
 *
 * Reutiliza `ClipGrid` y el catálogo. El orden se calcula sobre el catálogo
 * completo y no sobre una consulta: con todo en memoria, paginar aquí sería
 * complejidad sin beneficio, y el día que haya backend este componente solo
 * cambia de fuente.
 */
@Component({
  selector: 'app-explore-page',
  imports: [ClipGrid, AvatarOrb, HoloBadge, Icon, RouterLink, CompactPipe],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
        <a
          routerLink="/buscar"
          class="glass edge-gradient edge-live flex items-center gap-2.5 rounded-glass border border-white/10 px-4 py-3 text-sm text-ink-faint"
        >
          <app-icon name="search" class="size-4 shrink-0" />
          Buscar clips, sonidos, creadores
        </a>

        <!-- Hashtags del catálogo, no una lista escrita a mano: si entra una
             publicación nueva con una etiqueta nueva, aparece sola. -->
        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Hashtags
          </h2>
          <ul class="scrollbar-none mt-2 flex gap-2 overflow-x-auto pb-1">
            <li>
              <button
                type="button"
                class="metric rounded-full border px-3 py-1.5 text-[0.75rem] whitespace-nowrap transition-colors"
                [class]="chipClass(null)"
                (click)="tag.set(null)"
              >
                Todo
              </button>
            </li>
            @for (entry of tags; track entry.tag) {
              <li>
                <button
                  type="button"
                  class="metric rounded-full border px-3 py-1.5 text-[0.75rem] whitespace-nowrap transition-colors"
                  [class]="chipClass(entry.tag)"
                  [attr.aria-pressed]="tag() === entry.tag"
                  (click)="tag.set(entry.tag)"
                >
                  {{ entry.tag }}
                  <span class="text-ink-faint">{{ entry.count }}</span>
                </button>
              </li>
            }
          </ul>
        </section>

        <section class="mt-6">
          <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
            Creadores
          </h2>
          <ul class="scrollbar-none mt-2 flex gap-3 overflow-x-auto pb-1">
            @for (creator of creators(); track creator.id) {
              <li class="shrink-0">
                <a
                  [routerLink]="['/perfil', creator.handle]"
                  class="glass flex w-36 flex-col items-center gap-2 rounded-glass border border-white/10 p-3 text-center transition-colors hover:border-neon-cyan/40"
                >
                  <app-avatar-orb [creator]="creator" size="md" />
                  <span class="w-full truncate text-[0.75rem] font-medium text-ink">
                    {{ creator.handle }}
                  </span>
                  @if (creator.badge; as badge) {
                    <app-holo-badge [tier]="badge" />
                  }
                  <span class="metric text-[0.625rem] text-ink-faint">
                    {{ creator.followers | compact }}
                  </span>
                </a>
              </li>
            }
          </ul>
        </section>

        <section class="mt-6">
          <div class="flex items-center gap-2">
            <h2 class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
              {{ tag() ?? 'Para descubrir' }}
            </h2>
            <div class="ml-auto flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              @for (option of sorts; track option.id) {
                <button
                  type="button"
                  class="metric rounded-full px-2.5 py-1 text-[0.625rem] tracking-[0.08em] uppercase transition-colors"
                  [class]="sortClass(option.id)"
                  [attr.aria-pressed]="sort() === option.id"
                  (click)="sort.set(option.id)"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          </div>

          <div class="mt-3">
            <app-clip-grid [collection]="collection()" emptyText="Nada por aquí con este filtro." />
          </div>
        </section>
      </div>
    </div>
  `,
})
export class ExplorePage {
  private readonly profiles = inject(ProfileStore);

  protected readonly tags = ALL_TAGS.slice(0, 14);
  protected readonly sorts = SORTS;

  protected readonly tag = signal<string | null>(null);
  protected readonly sort = signal<Sort>('populares');

  /** Los creadores sugeridos excluyen el perfil propio. */
  protected readonly creators = computed(() =>
    this.profiles.profiles().filter((profile) => profile.id !== this.profiles.me.id),
  );

  private readonly pool = computed(() => (this.tag() ? clipsForTag(this.tag()!) : ALL_CLIPS));

  protected readonly collection = computed<FeedCollection>(() => {
    const clips = [...this.pool()];

    switch (this.sort()) {
      case 'recientes':
        // Sin marca de tiempo en los datos, «recientes» es el orden inverso
        // del catálogo: lo último indexado. Con backend sería un `ORDER BY`.
        clips.reverse();
        break;
      case 'directos':
        return {
          id: `explore:live:${this.tag() ?? 'all'}`,
          label: 'En directo',
          clips: clips.filter((clip) => clip.kind === 'live'),
        };
      default:
        clips.sort((a, b) => b.metrics.views - a.metrics.views);
    }

    return {
      id: `explore:${this.sort()}:${this.tag() ?? 'all'}`,
      label: this.tag() ?? 'Explorar',
      clips,
    };
  });

  protected chipClass(tag: string | null): string {
    return this.tag() === tag
      ? 'border-neon-cyan/60 bg-neon-cyan/15 text-neon-cyan'
      : 'border-white/12 text-ink-muted hover:border-neon-cyan/40';
  }

  protected sortClass(id: Sort): string {
    return this.sort() === id ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-ink-muted hover:text-ink';
  }
}
