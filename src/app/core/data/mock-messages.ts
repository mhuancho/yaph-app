import { Conversation, DirectMessage } from '../models/feed';
import { CREATORS } from './mock-feed';

/**
 * Bandeja de demostración.
 *
 * Los hilos arrancan con conversación real para que la pantalla no dependa de
 * que el usuario escriba algo antes de verse como una bandeja.
 */
function message(id: string, mine: boolean, body: string, ageMinutes: number): DirectMessage {
  return { id, mine, body, ageMinutes };
}

export const MOCK_CONVERSATIONS: readonly Conversation[] = [
  {
    id: 'dm-nyx',
    peer: CREATORS.nyx,
    unread: 2,
    messages: [
      message('dm-nyx-1', false, '¿Viste el pase de raymarching del último clip?', 180),
      message('dm-nyx-2', true, 'Sí, el early-out cambia todo. ¿Qué distancia usas?', 150),
      message('dm-nyx-3', false, '0.001 con 14 iteraciones máximo.', 42),
      message('dm-nyx-4', false, 'Te paso el shader el finde 📦', 38),
    ],
  },
  {
    id: 'dm-mira',
    peer: CREATORS.mira,
    unread: 1,
    messages: [
      message('dm-mira-1', true, 'El directo de ayer sonó enorme', 600),
      message('dm-mira-2', false, '¡Gracias! Compresión paralela en el bus de batería.', 540),
      message('dm-mira-3', false, 'El jueves pruebo el autómata reaccionando al side-chain 🎛️', 95),
    ],
  },
  {
    id: 'dm-kaze',
    peer: CREATORS.kaze,
    unread: 0,
    messages: [
      message('dm-kaze-1', false, '¿Te sirvió el truco del doble blur?', 1_500),
      message('dm-kaze-2', true, 'Muchísimo, pesa la mitad que el bloom real', 1_440),
      message('dm-kaze-3', false, 'Justo de eso iba 😄', 1_400),
    ],
  },
  {
    id: 'dm-volt',
    peer: CREATORS.volt,
    unread: 0,
    messages: [
      message('dm-volt-1', false, 'Hoy hay directo a las 22, pásate', 2_900),
      message('dm-volt-2', true, 'Ahí estaré', 2_880),
    ],
  },
];
