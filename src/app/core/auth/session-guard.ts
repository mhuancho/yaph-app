import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionStore } from '../state/session-store';

/** Ruta de la pantalla de identidad; la usan el guard y quien enlaza a ella. */
export const SIGN_IN_PATH = 'acceder';

/**
 * Puerta de las rutas que no tienen sentido sin identidad: publicar, la
 * bandeja de mensajes y el perfil propio.
 *
 * Devuelve un `UrlTree` en vez de navegar a mano: así la navegación bloqueada
 * se reemplaza por la otra en lugar de encadenarse, y el botón «atrás» no
 * devuelve a una ruta que el guard va a volver a rechazar.
 *
 * El destino viaja en `volver` para que quien acaba de entrar siga a donde
 * iba. No es un redirect abierto: `UrlTree` solo acepta rutas de esta
 * aplicación, nunca un host externo.
 */
export const requireSession: CanActivateFn = (_route, state) => {
  const session = inject(SessionStore);
  if (session.signedIn()) return true;

  return inject(Router).createUrlTree([`/${SIGN_IN_PATH}`], {
    queryParams: { volver: state.url },
  });
};
