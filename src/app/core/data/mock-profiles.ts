import { CreatorProfile, VideoClip } from '../models/feed';
import { seededRandom } from '../util/noise';
import { clipSources, CREATORS, MOCK_CLIPS, track } from './mock-feed';

/**
 * Perfiles y biblioteca de publicaciones.
 *
 * Es un módulo aparte de `mock-feed` porque son dos consultas distintas en
 * cualquier backend: «Para ti» es un ranking y la parrilla de un perfil es un
 * listado por autor. Sustituir cada uno por su endpoint no toca al otro.
 */

/**
 * Perfil propio por defecto: los contadores y la biblioteca de demostración
 * sobre los que la sesión escribe la identidad real (handle, nombre y avatar).
 * El handle cumple el mismo formato que exige la pantalla de identidad, para
 * que el valor de ejemplo no sea uno que la aplicación rechazaría.
 */
export const CURRENT_PROFILE: CreatorProfile = {
  id: 'me',
  handle: '@tu.perfil',
  displayName: 'Tu Perfil',
  avatar: { from: '#00F5D4', to: '#7C5CFF' },
  badge: null,
  followers: 1_284,
  following: 312,
  likes: 18_400,
  bio: 'Trasteando con shaders por las noches. Aquí van los experimentos que sobreviven.',
  link: 'yaph.app/tu',
};

interface ProfileExtras {
  readonly bio: string;
  readonly link: string | null;
  readonly following: number;
  readonly likes: number;
  readonly posts: number;
}

const EXTRAS: Readonly<Record<string, ProfileExtras>> = {
  'c-nyx': {
    bio: 'Render en tiempo real. Shaders, raymarching y mucha paciencia con el perfilador.',
    link: 'nyxrender.dev',
    following: 184,
    likes: 4_820_000,
    posts: 9,
  },
  'c-mira': {
    bio: 'Audio reactivo y síntesis modular. En directo los jueves desde el estudio.',
    link: 'mirasynth.live',
    following: 96,
    likes: 21_400_000,
    posts: 12,
  },
  'c-kaze': {
    bio: 'VFX baratos que parecen caros. Tutoriales en los comentarios.',
    link: null,
    following: 441,
    likes: 1_960_000,
    posts: 8,
  },
  'c-volt': {
    bio: 'Motion y vectores desde Buenos Aires. Directo casi todas las noches.',
    link: 'voltaje.sur',
    following: 1_204,
    likes: 684_000,
    posts: 7,
  },
  'c-lumen': {
    bio: 'Degradados, dithering y obsesión por el peso de los archivos.',
    link: 'lumen.ray',
    following: 208,
    likes: 912_000,
    posts: 10,
  },
  'c-orbe': {
    bio: 'Autómatas celulares y cosas que se mueven solas.',
    link: null,
    following: 57,
    likes: 243_000,
    posts: 6,
  },
};

export const MOCK_PROFILES: readonly CreatorProfile[] = [
  CURRENT_PROFILE,
  ...Object.values(CREATORS).map((creator) => ({ ...creator, ...EXTRAS[creator.id] })),
];

/** Ficheros de video disponibles; las publicaciones los rotan. */
const CLIP_FILES = [
  'neon-grid',
  'pulse-wave',
  'holo-drift',
  'data-rain',
  'spectral-bloom',
  'vector-dusk',
] as const;

const ACCENTS = [
  { from: '#00F5D4', to: '#1B9AFF' },
  { from: '#FF2A85', to: '#7C5CFF' },
  { from: '#7C5CFF', to: '#00F5D4' },
  { from: '#FFB020', to: '#FF2A85' },
  { from: '#00F5D4', to: '#FF2A85' },
  { from: '#FF2A85', to: '#FFB020' },
] as const;

const TITLES = [
  'Prueba de ruido azul a 24 fps',
  'Loop de 3 segundos que costó dos tardes',
  'Mismo shader, otro mapeo de color',
  'Experimento con trazado por distancia',
  'Boceto de transición para el próximo',
  'Versión descartada, pero me gusta',
  'Respuesta a @pix.el sobre el dithering',
  'Render nocturno sin postproceso',
  'Pasada rápida antes de dormir',
  'Prueba de carga: 2000 partículas',
  'Degradado en una sola textura',
  'Lo que pasa si subes el mold a 40',
];

/**
 * Publicaciones de un creador, deterministas a partir de su id.
 *
 * Se generan en vez de escribirse a mano porque la rejilla necesita docenas de
 * entradas y lo único que cambia entre ellas son las métricas. Con
 * `Math.random()` el orden y las cifras cambiarían en cada render y en cada
 * test; con una semilla, la parrilla de un perfil es siempre la misma.
 */
function libraryFor(profile: CreatorProfile): readonly VideoClip[] {
  const extras = EXTRAS[profile.id];
  const total = extras?.posts ?? 6;
  const next = seededRandom(`library:${profile.id}`);

  // El clip que el creador tiene en «Para ti» encabeza su perfil: ver el mismo
  // video en los dos sitios es lo que hace creíble la navegación.
  const featured = MOCK_CLIPS.filter((clip) => clip.creator.id === profile.id);

  const generated = Array.from({ length: Math.max(total - featured.length, 0) }, (_, index) => {
    const file = CLIP_FILES[(index + profile.id.length) % CLIP_FILES.length];
    const accent = ACCENTS[(index + 2) % ACCENTS.length];
    const views = Math.round(2_000 + next() * 1_800_000);

    return {
      id: `post-${profile.id}-${index}`,
      kind: 'short',
      liveViewers: null,
      creator: profile,
      description: TITLES[(index * 3 + profile.id.length) % TITLES.length],
      hashtags: ['#archivo', '#proceso'],
      audio: track(`a-${profile.id}-${index}`, 'Sonido original', profile.displayName, views),
      accent,
      sources: clipSources(file),
      durationSeconds: 8,
      metrics: {
        views,
        likes: Math.round(views * (0.04 + next() * 0.08)),
        comments: Math.round(views * 0.002 * next()),
        shares: Math.round(views * 0.004 * next()),
        saves: Math.round(views * 0.01 * next()),
      },
      location: null,
    } satisfies VideoClip;
  });

  return [...featured, ...generated];
}

/** Publicaciones por id de creador. */
export const MOCK_LIBRARY: Readonly<Record<string, readonly VideoClip[]>> = Object.fromEntries(
  MOCK_PROFILES.map((profile) => [profile.id, libraryFor(profile)]),
);
