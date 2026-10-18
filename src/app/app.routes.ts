import { Routes } from '@angular/router';
import { requireSession } from './core/auth/session-guard';

/**
 * Rutas con `loadComponent`: el feed es la única vista que entra en el bundle
 * inicial. Las secundarias se cargan al navegar, que es lo que mantiene el
 * primer render por debajo del presupuesto de `angular.json`.
 *
 * Los params y query params se enlazan a los `input()` de cada página
 * gracias a `withComponentInputBinding()` en `app.config.ts`.
 *
 * `requireSession` cubre lo que no tiene sentido sin identidad: publicar,
 * la bandeja y el perfil propio. Ver también Explorar, que es público a
 * propósito: un feed de video se mira antes de entrar.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'YAPH — Para ti',
    loadComponent: () => import('./features/feed/feed-page').then((m) => m.FeedPage),
  },
  {
    path: 'buscar',
    title: 'YAPH — Buscar',
    loadComponent: () => import('./features/discover/search-page').then((m) => m.SearchPage),
  },
  {
    path: 'tag/:tag',
    title: 'YAPH — Hashtag',
    loadComponent: () => import('./features/discover/tag-page').then((m) => m.TagPage),
  },
  {
    path: 'sonido/:soundId',
    title: 'YAPH — Sonido',
    loadComponent: () => import('./features/discover/sound-page').then((m) => m.SoundPage),
  },
  {
    path: 'explorar',
    title: 'YAPH — Explorar',
    loadComponent: () => import('./features/discover/explore-page').then((m) => m.ExplorePage),
  },
  {
    path: 'acceder',
    title: 'YAPH — Entrar',
    loadComponent: () => import('./features/auth/identity-page').then((m) => m.IdentityPage),
  },
  {
    path: 'crear',
    title: 'YAPH — Crear',
    canActivate: [requireSession],
    loadComponent: () => import('./features/create/create-page').then((m) => m.CreatePage),
  },
  {
    path: 'mensajes',
    title: 'YAPH — Mensajes',
    canActivate: [requireSession],
    loadComponent: () => import('./features/messages/messages-page').then((m) => m.MessagesPage),
  },
  {
    path: 'perfil',
    title: 'YAPH — Mi perfil',
    canActivate: [requireSession],
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    // El handle viaja con la arroba, como en la URL que la gente copia y pega.
    path: 'perfil/:handle',
    title: 'YAPH — Perfil',
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'ajustes',
    title: 'YAPH — Ajustes',
    loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];
