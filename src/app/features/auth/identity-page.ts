import { Component, computed, inject, input, signal } from '@angular/core';
import { form, FormField, maxLength, pattern, required, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { CommentAuthor } from '../../core/models/feed';
import {
  avatarFor,
  DISPLAY_NAME_MAX,
  HANDLE_PATTERN,
  SessionStore,
} from '../../core/state/session-store';
import { ToastStore } from '../../core/state/toast-store';
import { AvatarOrb } from '../../ui/avatar-orb';
import { Icon } from '../../ui/icon';

interface IdentityModel {
  handle: string;
  displayName: string;
}

/**
 * Pantalla de identidad: la misma para entrar y para editar el perfil.
 *
 * Son el mismo formulario sobre el mismo estado, así que separarlas en dos
 * rutas duplicaría la validación para cambiar un título. Con sesión abierta
 * edita; sin sesión, entra y sigue a `volver`, el destino que guardó el guard.
 *
 * Usa Signal Forms: la validación se declara una vez junto al modelo y el
 * botón lee `invalid()`, sin un segundo estado que mantener en sincronía.
 */
@Component({
  selector: 'app-identity-page',
  imports: [FormField, AvatarOrb, Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="scrollbar-none h-full overflow-y-auto pt-20 pb-28 md:pt-6 md:pb-8">
      <div class="mx-auto w-full max-w-md px-4 md:px-6">
        <h1 class="font-display text-xl font-semibold tracking-tight text-ink">
          {{ editing() ? 'Editar perfil' : 'Entrar en YAPH' }}
        </h1>
        <p class="mt-1.5 text-[0.8125rem] text-ink-muted">
          {{
            editing()
              ? 'Cambia cómo te ve el resto de la app.'
              : 'Elige tu handle y tu nombre para publicar, comentar y escribir.'
          }}
        </p>

        <!-- Lo que esto es de verdad. Una demo que finge una sesión sin
             decirlo sería peor que una demo sin sesión. -->
        <p
          class="glass mt-4 flex items-start gap-2.5 rounded-glass border border-neon-amber/40 p-3 text-[0.75rem] text-ink-muted"
        >
          <app-icon name="bolt" class="mt-0.5 size-4 shrink-0 text-neon-amber" />
          Demo sin servidor: no hay contraseña ni verificación. Esta identidad vive solo en este
          navegador.
        </p>

        <form class="mt-6" (submit)="save($event)">
          <div class="flex items-center gap-4">
            <app-avatar-orb [creator]="preview()" size="lg" />
            <p class="min-w-0 text-[0.75rem] text-ink-faint">
              El color del avatar sale de tu handle, así que cambia con él.
            </p>
          </div>

          <label class="mt-6 block">
            <span class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
              Handle
            </span>
            <!-- La arroba va fuera del campo: forma parte del handle en todas
                 las URL, pero escribirla solo añade una forma de equivocarse. -->
            <div
              class="mt-2 flex items-center gap-1 rounded-2xl px-3.5 py-2.5"
              [class]="handleBoxClass()"
            >
              <span aria-hidden="true" class="metric shrink-0 text-[0.8125rem] text-ink-faint">
                &#64;
              </span>
              <input
                type="text"
                autocomplete="username"
                spellcheck="false"
                placeholder="tu.handle"
                class="metric w-full min-w-0 bg-transparent text-[0.8125rem] text-ink placeholder:text-ink-faint focus:outline-none"
                [formField]="identity.handle"
                aria-describedby="handle-error"
                [attr.aria-invalid]="showHandleError()"
              />
            </div>
            <!-- El hueco del error existe siempre y es una región viva: creado
                 al fallar, un lector de pantalla no lo anunciaría. -->
            <span
              id="handle-error"
              aria-live="polite"
              class="mt-1 block min-h-4 text-[0.6875rem] text-neon-magenta"
            >
              {{ showHandleError() ? handleError() : '' }}
            </span>
          </label>

          <label class="block">
            <span class="metric text-[0.625rem] tracking-[0.16em] text-ink-faint uppercase">
              Nombre
            </span>
            <input
              type="text"
              autocomplete="nickname"
              placeholder="Cómo quieres que te llamen"
              class="glass-flat mt-2 w-full rounded-2xl border border-white/12 px-3.5 py-2.5 text-[0.8125rem] text-ink placeholder:text-ink-faint focus:border-neon-cyan/50 focus:outline-none"
              [formField]="identity.displayName"
              aria-describedby="name-error"
              [attr.aria-invalid]="showNameError()"
            />
            <span
              id="name-error"
              aria-live="polite"
              class="mt-1 block min-h-4 text-[0.6875rem] text-neon-magenta"
            >
              {{ showNameError() ? nameError() : '' }}
            </span>
          </label>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-[background-color,color,box-shadow,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40"
              [class]="submitClass()"
              [disabled]="identity().invalid()"
            >
              <app-icon name="send" class="size-3.5" [strokeWidth]="2" />
              {{ editing() ? 'Guardar' : 'Entrar' }}
            </button>

            @if (editing()) {
              <button
                type="button"
                class="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-neon-magenta/50 hover:text-ink"
                (click)="signOut()"
              >
                Cerrar sesión
              </button>
            }
          </div>
        </form>
      </div>
    </div>
  `,
})
export class IdentityPage {
  /** Ruta a la que volver tras entrar; la pone el guard de sesión. */
  readonly volver = input<string>();

  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastStore);

  protected readonly editing = this.session.signedIn;

  private readonly model = signal<IdentityModel>({
    handle: (this.session.session()?.handle ?? '').replace(/^@+/, ''),
    displayName: this.session.session()?.displayName ?? '',
  });

  protected readonly identity = form(this.model, (path) => {
    required(path.handle, { message: 'Hace falta un handle.' });
    pattern(path.handle, HANDLE_PATTERN, {
      message: 'De 3 a 20 caracteres: letras, números, punto o guion bajo.',
    });
    // Suplantar a un creador del catálogo, además de ser mentira, dejaría dos
    // perfiles con el mismo handle y uno de los dos inalcanzable por URL.
    validate(path.handle, ({ value }) =>
      this.session.isReserved(value())
        ? { kind: 'reservado', message: 'Ese handle ya es de otra cuenta.' }
        : undefined,
    );
    required(path.displayName, { message: 'Hace falta un nombre.' });
    maxLength(path.displayName, DISPLAY_NAME_MAX, {
      message: 'Máximo ' + DISPLAY_NAME_MAX + ' caracteres.',
    });
  });

  /**
   * Avatar que se verá: el degradado lo decide el handle, así que la vista
   * previa se recalcula mientras se escribe.
   */
  protected readonly preview = computed<CommentAuthor>(() => ({
    ...this.session.profile(),
    handle: '@' + this.model().handle,
    displayName: this.model().displayName || 'Tu Perfil',
    avatar: avatarFor('@' + this.model().handle),
  }));

  // El error solo se enseña cuando el campo ya se ha tocado: un formulario
  // recién abierto en blanco estaría en rojo antes de escribir nada.
  protected readonly showHandleError = computed(
    () => this.identity.handle().touched() && this.identity.handle().invalid(),
  );
  protected readonly handleError = computed(
    () => this.identity.handle().errors()[0]?.message ?? '',
  );

  protected readonly showNameError = computed(
    () => this.identity.displayName().touched() && this.identity.displayName().invalid(),
  );
  protected readonly nameError = computed(
    () => this.identity.displayName().errors()[0]?.message ?? '',
  );

  protected readonly handleBoxClass = computed(() =>
    this.showHandleError()
      ? 'glass-flat border border-neon-magenta/60'
      : 'glass-flat border border-white/12 focus-within:border-neon-cyan/50',
  );

  protected readonly submitClass = computed(() =>
    this.identity().invalid()
      ? 'bg-white/10 text-ink-faint'
      : 'bg-neon-cyan text-abyss shadow-neon-cyan',
  );

  protected save(event: Event): void {
    event.preventDefault();

    const wasEditing = this.editing();
    const { handle, displayName } = this.model();

    if (!this.session.signIn(handle, displayName)) {
      // La pantalla ya valida, pero si el store rechaza hay que enseñar por
      // qué en vez de dejar el botón pulsado sin efecto.
      this.identity().markAsTouched();
      return;
    }

    this.toasts.show(wasEditing ? 'Perfil actualizado' : 'Sesión abierta', 'ok');
    void this.router.navigateByUrl(wasEditing ? '/perfil' : safeReturn(this.volver()));
  }

  protected signOut(): void {
    this.session.signOut();
    this.toasts.show('Sesión cerrada', 'ok');
    void this.router.navigateByUrl('/');
  }
}

/**
 * Solo rutas de esta aplicación: `volver` llega de la URL y una que empiece
 * por `//` la interpretaría el navegador como otro host.
 */
function safeReturn(url: string | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return '/';
  return url;
}
