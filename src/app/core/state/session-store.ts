import { computed, inject, Service } from '@angular/core';
import { CURRENT_PROFILE, MOCK_PROFILES } from '../data/mock-profiles';
import { AccentPair, CreatorProfile } from '../models/feed';
import { PersistentState } from './persistent-state';

/** Lo que la aplicación sabe de quien la está usando. */
export interface Session {
  readonly handle: string;
  readonly displayName: string;
}

/**
 * Formato del handle, sin la arroba: de 3 a 20 caracteres, letras, números,
 * punto y guion bajo, y nunca empezando ni acabando en punto. El handle viaja
 * en la URL (`/perfil/@handle`), así que el conjunto de caracteres es el que
 * sobrevive a copiar y pegar un enlace.
 */
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9._]{1,18}[a-z0-9]$/i;

export const DISPLAY_NAME_MAX = 24;

/**
 * Degradados del avatar propio, todos de la paleta neón de la aplicación. El
 * par lo elige el handle, de forma determinista: así el avatar conserva su
 * color entre recargas sin necesidad de guardarlo. No pretende ser único —con
 * seis pares hay colisiones—, sino que el avatar sea *tuyo* y no el mismo
 * degradado de demostración para todo el mundo.
 */
const AVATARS: readonly AccentPair[] = [
  { from: '#00F5D4', to: '#7C5CFF' },
  { from: '#FF2A85', to: '#FFB020' },
  { from: '#7C5CFF', to: '#00F5D4' },
  { from: '#FFB020', to: '#FF2A85' },
  { from: '#1B9AFF', to: '#00F5D4' },
  { from: '#0E8F7A', to: '#1B9AFF' },
];

/** Handles del catálogo: nadie puede presentarse con uno de ellos. */
const RESERVED = MOCK_PROFILES.filter((profile) => profile.id !== CURRENT_PROFILE.id).map(
  (profile) => profile.handle.toLowerCase(),
);

/**
 * Sesión local.
 *
 * **Esto no autentica a nadie.** No hay servidor que verifique nada: la
 * identidad se escribe en un formulario y vive en `localStorage`, así que
 * cualquiera con la consola abierta puede ponerse el handle que quiera. Es el
 * mismo seam que los mocks del catálogo: con un backend real, `signIn` pasa a
 * ser la llamada que devuelve un token y `profile` el perfil que responda el
 * servidor, sin que la interfaz cambie. Lo que esto sí resuelve hoy es lo que
 * la interfaz necesita saber: si hay alguien dentro, quién firma lo que se
 * publica, y qué rutas no tienen sentido sin identidad.
 *
 * Los handles del catálogo quedan reservados. No es (solo) por suplantación:
 * sin esa regla, `ProfileStore.byHandle` encontraría dos perfiles para el
 * mismo handle y el perfil ajeno quedaría inalcanzable.
 */
@Service()
export class SessionStore {
  private readonly store = inject(PersistentState);
  private readonly state = this.store.signal<Session | null>('session', null);

  readonly session = this.state.asReadonly();
  readonly signedIn = computed(() => this.state() !== null);

  /**
   * Perfil propio. Sin sesión es el de demostración: los clips y los
   * contadores son datos de ejemplo y no tienen de dónde salir hasta que haya
   * backend. Lo que la sesión aporta es la identidad, no el contenido.
   */
  readonly profile = computed<CreatorProfile>(() => {
    const session = this.state();
    if (!session) return CURRENT_PROFILE;

    return {
      ...CURRENT_PROFILE,
      handle: session.handle,
      displayName: session.displayName,
      avatar: avatarFor(session.handle),
    };
  });

  /** `true` si el handle ya es de alguien del catálogo. */
  isReserved(handle: string): boolean {
    return RESERVED.includes(withAt(handle).toLowerCase());
  }

  /**
   * Entra (o cambia la identidad de la sesión abierta). Devuelve `false` si el
   * handle no vale: la pantalla ya lo valida, pero el store no puede fiarse de
   * su única llamada conocida.
   */
  signIn(handle: string, displayName: string): boolean {
    const bare = handle.trim().replace(/^@+/, '');
    if (!HANDLE_PATTERN.test(bare) || this.isReserved(bare)) return false;

    const name = displayName.trim().slice(0, DISPLAY_NAME_MAX);
    this.state.set({ handle: withAt(bare), displayName: name || withAt(bare) });
    return true;
  }

  signOut(): void {
    this.state.set(null);
  }
}

function withAt(handle: string): string {
  const bare = handle.trim().replace(/^@+/, '');
  return `@${bare}`;
}

/**
 * Degradado del avatar de un handle. Hash determinista y estable; no necesita
 * ser bueno, solo repetible. Se exporta porque la pantalla de identidad
 * previsualiza el avatar mientras se escribe, antes de que exista sesión.
 */
export function avatarFor(handle: string): AccentPair {
  let hash = 0;
  for (const char of handle) hash = (hash * 31 + char.charCodeAt(0)) % 0xffff;
  return AVATARS[hash % AVATARS.length];
}
