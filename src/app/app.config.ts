import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` enlaza params y query params de ruta a los
    // `input()` del componente: de ahí salen el handle de `/perfil/:handle`,
    // el `?q=` de la búsqueda y el `?con=` de los mensajes.
    //
    // No se añade `withInMemoryScrolling`: solo restaura el scroll del
    // documento y aquí el feed scrollea en su propio contenedor. La posición se
    // recupera desde `FeedStore.activeIndex`, que sobrevive a la navegación.
    provideRouter(routes, withComponentInputBinding()),
    // El service worker solo en producción: en desarrollo serviría el
    // build anterior desde caché. `registerWhenStable` espera a que la
    // aplicación esté ociosa para no competir con el primer render.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideClientHydration(),
  ],
};
