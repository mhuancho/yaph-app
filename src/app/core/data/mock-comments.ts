import { ClipComment, CommentAuthor } from '../models/feed';

/**
 * Hilos de comentarios de demostración, indexados por id de clip.
 *
 * Seam hacia el backend: `CommentsStore` solo lee de aquí, así que cambiar
 * este módulo por una llamada paginada (`resource()` + cursor) no toca la UI.
 */

/** Quien usa la app: autor de los comentarios que se publican desde el panel. */
export const CURRENT_USER: CommentAuthor = {
  id: 'me',
  handle: '@tú',
  displayName: 'Tu Perfil',
  avatar: { from: '#00F5D4', to: '#7C5CFF' },
  badge: null,
};

const AUTHORS = {
  pix: {
    id: 'u-pix',
    handle: '@pix.el',
    displayName: 'Pix El',
    avatar: { from: '#00F5D4', to: '#1B9AFF' },
    badge: null,
  },
  rae: {
    id: 'u-rae',
    handle: '@rae.synth',
    displayName: 'Rae Synth',
    avatar: { from: '#FF2A85', to: '#FFB020' },
    badge: 'creator',
  },
  nullptr: {
    id: 'u-nullptr',
    handle: '@nullptr',
    displayName: 'Null Ptr',
    avatar: { from: '#7C5CFF', to: '#00F5D4' },
    badge: null,
  },
  kuri: {
    id: 'u-kuri',
    handle: '@kuri.dev',
    displayName: 'Kuri Dev',
    avatar: { from: '#FFB020', to: '#FF2A85' },
    badge: null,
  },
  vera: {
    id: 'u-vera',
    handle: '@vera.loop',
    displayName: 'Vera Loop',
    avatar: { from: '#00F5D4', to: '#FF2A85' },
    badge: 'partner',
  },
  hex: {
    id: 'u-hex',
    handle: '@hex.mode',
    displayName: 'Hex Mode',
    avatar: { from: '#7C5CFF', to: '#FF2A85' },
    badge: null,
  },
  sol: {
    id: 'u-sol',
    handle: '@sol.aria',
    displayName: 'Sol Aria',
    avatar: { from: '#FFB020', to: '#00F5D4' },
    badge: null,
  },
} as const satisfies Record<string, CommentAuthor>;

function comment(
  id: string,
  author: CommentAuthor,
  body: string,
  ageMinutes: number,
  likes: number,
  extra: Partial<Pick<ClipComment, 'pinned' | 'replies'>> = {},
): ClipComment {
  return {
    id,
    author,
    body,
    ageMinutes,
    likes,
    pinned: extra.pinned ?? false,
    replies: extra.replies ?? 0,
    own: false,
  };
}

export const MOCK_COMMENTS: Readonly<Record<string, readonly ClipComment[]>> = {
  'clip-neon-grid': [
    comment(
      'cm-ng-1',
      AUTHORS.vera,
      '14 pases y va a 60. ¿Haces early-out en el raymarch o es fuerza bruta?',
      42,
      1_284,
      { pinned: true, replies: 6 },
    ),
    comment('cm-ng-2', AUTHORS.pix, 'el detalle del borde en el segundo 4 es brutal 👌', 96, 418),
    comment('cm-ng-3', AUTHORS.nullptr, 'me lo guardo para estudiarlo con calma', 180, 97),
    comment('cm-ng-4', AUTHORS.kuri, '¿compartes el shader o es secreto de estado?', 320, 54, {
      replies: 2,
    }),
    comment('cm-ng-5', AUTHORS.hex, 'tutorial cuándo 🙏', 1_440, 31),
  ],
  'clip-pulse-wave': [
    comment('cm-pw-1', AUTHORS.rae, '¿qué sampler usaste para el kick? suena enorme', 25, 2_940, {
      pinned: true,
      replies: 11,
    }),
    comment('cm-pw-2', AUTHORS.sol, 'cada célula un semitono es una idea preciosa', 70, 806),
    comment('cm-pw-3', AUTHORS.pix, 'esto en una pantalla OLED debe ser ilegal', 210, 512),
    comment(
      'cm-pw-4',
      AUTHORS.nullptr,
      'la sincronía con el beat está perfecta, nada de drift',
      540,
      188,
    ),
  ],
  'clip-holo-drift': [
    comment('cm-hd-1', AUTHORS.kuri, '540p y se ve mejor que mi 4K, injusto', 15, 640, {
      pinned: true,
    }),
    comment('cm-hd-2', AUTHORS.hex, '¿dithering ordenado o error diffusion?', 88, 274, {
      replies: 3,
    }),
    comment('cm-hd-3', AUTHORS.vera, '180 kB. ahí está el truco de verdad', 300, 151),
  ],
  'clip-data-rain': [
    comment(
      'cm-dr-1',
      AUTHORS.nullptr,
      'la regla 110 es Turing-completa, el chiste se cuenta solo',
      35,
      412,
      { pinned: true, replies: 4 },
    ),
    comment('cm-dr-2', AUTHORS.pix, 'me recuerda a los fondos de las demos de los 90', 150, 96),
    comment('cm-dr-3', AUTHORS.rae, 'pon esto en loop y no me muevo en una hora', 600, 48),
  ],
  'clip-spectral-bloom': [
    comment('cm-sb-1', AUTHORS.sol, 'dos blurs y una resta. no hace falta más', 20, 1_120, {
      pinned: true,
      replies: 8,
    }),
    comment('cm-sb-2', AUTHORS.kuri, 'guardado para el proyecto del viernes', 130, 345),
    comment('cm-sb-3', AUTHORS.vera, 'en el móvil de mi hermana va liso, confirmado', 420, 162),
    comment('cm-sb-4', AUTHORS.hex, '¿qué radio de blur en el segundo pase?', 900, 73, {
      replies: 1,
    }),
  ],
  'clip-vector-dusk': [
    comment('cm-vd-1', AUTHORS.rae, 'el pipeline por favor, lo pediste tú 😄', 8, 208, {
      pinned: true,
      replies: 5,
    }),
    comment('cm-vd-2', AUTHORS.pix, 'la transición del loop es perfecta', 45, 134),
    comment('cm-vd-3', AUTHORS.nullptr, 'directo guardado, me lo veo esta noche', 260, 61),
  ],
};
