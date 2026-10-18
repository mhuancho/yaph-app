import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreatorProfile, FeedCollection } from '../../core/models/feed';
import { ProfileStore } from '../../core/state/profile-store';
import { Icon } from '../../ui/icon';
import { CompactPipe } from '../../ui/metric-pipes';
import { ClipGrid } from './clip-grid';
import { ProfileHeader } from './profile-header';

type Tab = 'videos' | 'guardados' | 'gustados';

/** Ids únicos por instancia para enlazar pestañas y paneles con ARIA. */
let instances = 0;

/**
 * Perfil propio y de cualquier otra persona.
 *
 * Una sola vista para los dos casos: cambian las acciones de la cabecera y las
 * pestañas, no la estructura. Mantener dos componentes casi iguales garantiza
 * que uno de los dos se quede atrás.
 *
 * El handle llega por la URL (`/perfil/:handle`); sin él se muestra el propio.
 */
@Component({
  selector: 'app-profile-page',
  imports: [ProfileHeader, ClipGrid, Icon, RouterLink, CompactPipe],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      @if (profile(); as current) {
        <div class="mx-auto w-full max-w-3xl px-4 md:px-6">
          <app-profile-header [profile]="current" />

          <!-- Las pestañas solo existen en el perfil propio: en uno ajeno no
               hay guardados ni me gusta que mostrar, y un selector de una
               opción es ruido. -->
          @if (profiles.isMe()) {
            <div
              role="tablist"
              aria-label="Contenido del perfil"
              class="mt-6 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1"
              (keydown.arrowright)="moveTab(1, $event)"
              (keydown.arrowleft)="moveTab(-1, $event)"
            >
              @for (option of tabs; track option.id) {
                <button
                  type="button"
                  role="tab"
                  [id]="option.id + uid"
                  [attr.aria-selected]="tab() === option.id"
                  [attr.aria-controls]="'panel-' + option.id + uid"
                  [tabIndex]="tab() === option.id ? 0 : -1"
                  class="metric flex-1 rounded-full px-3 py-1.5 text-[0.6875rem] tracking-[0.1em] uppercase transition-[background-color,color,box-shadow] duration-200"
                  [class]="tabClass(option.id)"
                  (click)="tab.set(option.id)"
                >
                  {{ option.label }}
                </button>
              }
            </div>
          } @else {
            <p
              class="metric mt-6 flex items-center gap-2 border-b border-white/10 pb-2 text-[0.6875rem] tracking-[0.14em] text-ink-faint uppercase"
            >
              <app-icon name="grid" class="size-3.5" />
              {{ profiles.posts().length }} publicaciones
              <span class="ml-auto normal-case">
                {{ profiles.totalViews() | compact }} reproducciones
              </span>
            </p>
          }

          <div
            class="mt-3"
            [attr.role]="profiles.isMe() ? 'tabpanel' : null"
            [attr.id]="profiles.isMe() ? 'panel-' + tab() + uid : null"
            [attr.aria-labelledby]="profiles.isMe() ? tab() + uid : null"
          >
            <app-clip-grid
              [collection]="collection()"
              [pinFirst]="tab() === 'videos'"
              [emptyText]="emptyText()"
            />
          </div>
        </div>
      } @else {
        <div class="grid h-full place-items-center px-6">
          <div class="max-w-sm text-center">
            <h1 class="font-display text-xl font-semibold text-ink">Perfil no encontrado</h1>
            <p class="mt-2 text-sm text-ink-muted">
              No existe ninguna cuenta con el identificador «{{ handle() }}».
            </p>
            <a
              routerLink="/perfil"
              class="metric mt-5 inline-block rounded-full border border-neon-cyan/50 bg-neon-cyan/10 px-4 py-2 text-[0.6875rem] tracking-[0.1em] text-neon-cyan uppercase"
            >
              Ir a mi perfil
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProfilePage {
  /** Viene de `/perfil/:handle` gracias a `withComponentInputBinding()`. */
  readonly handle = input<string>();

  protected readonly profiles = inject(ProfileStore);
  protected readonly uid = `-${(instances += 1)}`;
  protected readonly tabs = [
    { id: 'videos', label: 'Videos' },
    { id: 'guardados', label: 'Guardados' },
    { id: 'gustados', label: 'Me gusta' },
  ] as const satisfies readonly { id: Tab; label: string }[];

  protected readonly profile = computed<CreatorProfile | null>(() => this.profiles.profile());

  /** Al cambiar de perfil se vuelve a la parrilla principal. */
  protected readonly tab = linkedSignal<string | undefined, Tab>({
    source: this.handle,
    computation: () => 'videos',
  });

  /**
   * Cada pestaña es una colección propia: al abrir una celda de «Guardados»,
   * el feed debe recorrer los guardados, no las publicaciones del perfil.
   */
  protected readonly collection = computed<FeedCollection>(() => {
    const profile = this.profile();
    switch (this.tab()) {
      case 'guardados':
        return { id: 'saved', label: 'Guardados', clips: this.profiles.saved() };
      case 'gustados':
        return { id: 'liked', label: 'Me gusta', clips: this.profiles.liked() };
      default:
        return profile
          ? this.profiles.collectionFor(profile)
          : { id: 'empty', label: '', clips: [] };
    }
  });

  protected readonly emptyText = computed(() => {
    switch (this.tab()) {
      case 'guardados':
        return 'Aún no has guardado ningún clip. Toca el marcador en el feed.';
      case 'gustados':
        return 'Los clips a los que des me gusta aparecerán aquí.';
      default:
        return 'Todavía no hay publicaciones.';
    }
  });

  constructor() {
    // El store es quien resuelve el perfil: así la cabecera y la parrilla leen
    // de una sola fuente en vez de recibir el handle por entradas encadenadas.
    effect(() => this.profiles.openHandle.set(this.handle() ?? null));
  }

  protected tabClass(id: Tab): string {
    return this.tab() === id
      ? 'bg-neon-cyan/15 text-neon-cyan shadow-neon-cyan'
      : 'text-ink-muted hover:text-ink';
  }

  protected moveTab(delta: number, event: Event): void {
    event.preventDefault();
    const index = this.tabs.findIndex((option) => option.id === this.tab());
    const next = this.tabs[(index + delta + this.tabs.length) % this.tabs.length];
    this.tab.set(next.id);
  }
}
