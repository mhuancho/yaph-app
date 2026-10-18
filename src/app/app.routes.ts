import { Routes } from '@angular/router';

/**
 * Rutas con `loadComponent`: el feed es la única vista que entra en el bundle
 * inicial. Las secundarias se cargan al navegar, que es lo que mantiene el
 * primer render por debajo del presupuesto de `angular.json`.
 *
 * Los params y query params se enlazan a los `input()` de cada página
 * gracias a `withComponentInputBinding()` en `app.config.ts`.
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
    path: 'crear',
    title: 'YAPH — Crear',
    loadComponent: () => import('./features/create/create-page').then((m) => m.CreatePage),
  },
  {
    path: 'mensajes',
    title: 'YAPH — Mensajes',
    loadComponent: () => import('./features/messages/messages-page').then((m) => m.MessagesPage),
  },
  {
    path: 'perfil',
    title: 'YAPH — Mi perfil',
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    // El handle viaja con la arroba, como en la URL que la gente copia y pega.
    path: 'perfil/:handle',
    title: 'YAPH — Perfil',
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  { path: '**', redirectTo: '' },
];
