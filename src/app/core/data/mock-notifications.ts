import { AppNotification } from '../models/feed';
import { CREATORS } from './mock-feed';

/**
 * Actividad de demostración. En producción llega por el mismo canal que el
 * chat de los directos.
 */
export const MOCK_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'n-1',
    kind: 'like',
    actor: CREATORS.mira,
    text: 'le dio me gusta a tu clip',
    ageMinutes: 12,
    read: false,
    clipId: 'clip-neon-grid',
  },
  {
    id: 'n-2',
    kind: 'follow',
    actor: CREATORS.kaze,
    text: 'empezó a seguirte',
    ageMinutes: 48,
    read: false,
    clipId: null,
  },
  {
    id: 'n-3',
    kind: 'comment',
    actor: CREATORS.nyx,
    text: 'comentó: «el early-out cambia todo»',
    ageMinutes: 95,
    read: false,
    clipId: 'clip-neon-grid',
  },
  {
    id: 'n-4',
    kind: 'live',
    actor: CREATORS.volt,
    text: 'está emitiendo en directo',
    ageMinutes: 140,
    read: true,
    clipId: 'clip-vector-dusk',
  },
  {
    id: 'n-5',
    kind: 'mention',
    actor: CREATORS.lumen,
    text: 'te mencionó en un comentario',
    ageMinutes: 420,
    read: true,
    clipId: 'clip-holo-drift',
  },
  {
    id: 'n-6',
    kind: 'like',
    actor: CREATORS.orbe,
    text: 'y 240 personas más dieron me gusta a tu clip',
    ageMinutes: 1_500,
    read: true,
    clipId: 'clip-data-rain',
  },
];
