import { RenderMode, ServerRoute } from '@angular/ssr';
import { ALL_SOUNDS, ALL_TAGS } from './core/data/catalog';
import { MOCK_PROFILES } from './core/data/mock-profiles';

/**
 * Qué se renderiza dónde.
 *
 * El criterio es si la página es pública y la misma para todo el mundo:
 *
 * - **Prerender** el feed y todo lo que indexa un buscador —perfiles ajenos,
 *   hashtags, sonidos—, que es justo lo que un feed público de video necesita
 *   del SSR.
 * - **Cliente** lo que depende de quién mira (identidad, perfil propio,
 *   bandeja, crear, ajustes) o de parámetros de consulta (la búsqueda).
 *   Renderizarlo en servidor sin sesión produciría HTML que se descarta en la
 *   hidratación, y las tres primeras están además tras el guard de sesión.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'acceder', renderMode: RenderMode.Client },
  { path: 'buscar', renderMode: RenderMode.Client },
  { path: 'crear', renderMode: RenderMode.Client },
  { path: 'mensajes', renderMode: RenderMode.Client },
  { path: 'ajustes', renderMode: RenderMode.Client },
  { path: 'perfil', renderMode: RenderMode.Client },
  {
    path: 'perfil/:handle',
    renderMode: RenderMode.Prerender,
    // El perfil propio no se prerenderiza: no es público.
    getPrerenderParams: async () =>
      MOCK_PROFILES.filter((profile) => profile.id !== 'me').map((profile) => ({
        handle: profile.handle,
      })),
  },
  {
    path: 'tag/:tag',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ALL_TAGS.map((entry) => ({ tag: entry.tag.slice(1) })),
  },
  {
    path: 'sonido/:soundId',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ALL_SOUNDS.map((entry) => ({ soundId: entry.sound.id })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
