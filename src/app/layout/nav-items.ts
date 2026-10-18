import { IconName } from '../ui/icon';

export interface NavItem {
  readonly label: string;
  readonly icon: IconName;
  readonly path: string;
  /** Solo la ruta raíz debe coincidir de forma exacta. */
  readonly exact: boolean;
  readonly badge: number | null;
}

/** Fuente única de la navegación: la comparten el dock y la barra móvil. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', icon: 'home', path: '/', exact: true, badge: null },
  { label: 'Explorar', icon: 'explore', path: '/explorar', exact: false, badge: null },
  { label: 'Crear', icon: 'create', path: '/crear', exact: false, badge: null },
  { label: 'Mensajes', icon: 'messages', path: '/mensajes', exact: false, badge: 3 },
  { label: 'Perfil', icon: 'profile', path: '/perfil', exact: false, badge: null },
];
