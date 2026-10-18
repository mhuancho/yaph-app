import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `withComponentInputBinding` enlaza `data`/params de ruta a los `input()`
    // del componente, que es lo que alimenta a `StubPage`.
    //
    // No se añade `withInMemoryScrolling`: solo restaura el scroll del
    // documento y aquí el feed scrollea en su propio contenedor. La posición se
    // recupera desde `FeedStore.activeIndex`, que sobrevive a la navegación.
    provideRouter(routes, withComponentInputBinding()),
  ],
};
