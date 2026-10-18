import { MessageKey } from '../core/i18n/messages';
import { IconName } from '../ui/icon';

export interface NavItem {
  /** Clave de traducción, no el texto: el idioma cambia sin recargar. */
  readonly label: MessageKey;
  readonly icon: IconName;
  readonly path: string;
  /** Solo la ruta raíz debe coincidir de forma exacta. */
  readonly exact: boolean;
  /**
   * De dónde sale el contador de la insignia. No es un número: una insignia
   * con su propia cuenta acaba desincronizada del contenido que resume.
   */
  readonly badge: 'mensajes' | null;
}

/** Fuente única de la navegación: la comparten el dock y la barra móvil. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'nav.home', icon: 'home', path: '/', exact: true, badge: null },
  { label: 'nav.explore', icon: 'explore', path: '/explorar', exact: false, badge: null },
  { label: 'nav.create', icon: 'create', path: '/crear', exact: false, badge: null },
  { label: 'nav.messages', icon: 'messages', path: '/mensajes', exact: false, badge: 'mensajes' },
  { label: 'nav.profile', icon: 'profile', path: '/perfil', exact: false, badge: null },
];
