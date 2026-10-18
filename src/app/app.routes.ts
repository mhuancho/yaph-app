import { Routes } from '@angular/router';

/**
 * Rutas con `loadComponent`: el feed es la única vista que entra en el bundle
 * inicial. Las secundarias se cargan al navegar, que es lo que mantiene el
 * primer render por debajo del presupuesto de `angular.json`.
 *
 * Los `data` se enlazan a los `input()` de `StubPage` gracias a
 * `withComponentInputBinding()` en `app.config.ts`.
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
    data: {
      heading: 'Explorar',
      blurb: 'Rejilla de descubrimiento por sonido, hashtag y región.',
      icon: 'explore',
    },
    loadComponent: () => import('./features/stub/stub-page').then((m) => m.StubPage),
  },
  {
    path: 'crear',
    title: 'YAPH — Crear',
    data: {
      heading: 'Crear',
      blurb: 'Captura vertical, recorte 9:16 y mezcla de audio original.',
      icon: 'create',
    },
    loadComponent: () => import('./features/stub/stub-page').then((m) => m.StubPage),
  },
  {
    path: 'mensajes',
    title: 'YAPH — Mensajes',
    data: {
      heading: 'Mensajes',
      blurb: 'Hilos directos y respuestas a tus clips.',
      icon: 'messages',
    },
    loadComponent: () => import('./features/stub/stub-page').then((m) => m.StubPage),
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
