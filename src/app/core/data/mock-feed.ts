import {
  AudioTrack,
  Creator,
  LiveComment,
  SuggestedCreator,
  TrendingTag,
  VideoClip,
  VideoSource,
} from '../models/feed';
import { seededSeries } from '../util/noise';

/**
 * Datos de demostración.
 *
 * Seam para el backend real: `FeedStore` solo consume `MOCK_CLIPS`; sustituir
 * este módulo por un `resource()` que pegue al API deja el resto de la UI
 * intacta. Los clips son 540x960 procedurales generados con `scripts/gen-clips.sh`
 * y versionados en `public/clips/` para que la demo no dependa de la red
 * (los buckets públicos de video de muestra de Google ya responden 403).
 */
const CLIP_BASE = 'clips';

/**
 * Los `codecs=` van declarados a propósito: sin ellos `canPlayType` responde
 * "maybe" a cualquier contenedor y `pickPlayableSource` no podría descartar
 * H.264 en los navegadores que no lo traen.
 */
const MP4_TYPE = 'video/mp4; codecs="avc1.4D401F, mp4a.40.2"';
const WEBM_TYPE = 'video/webm; codecs="vp9, opus"';

function clipSources(name: string): readonly VideoSource[] {
  return [
    { src: `${CLIP_BASE}/${name}.mp4`, type: MP4_TYPE },
    { src: `${CLIP_BASE}/${name}.webm`, type: WEBM_TYPE },
  ];
}

function track(id: string, title: string, author: string, uses: number): AudioTrack {
  return { id, title, author, uses, envelope: seededSeries(`audio:${id}`, 32) };
}

const CREATORS = {
  nyx: {
    id: 'c-nyx',
    handle: '@nyx.render',
    displayName: 'Nyx Render',
    followers: 482_000,
    avatar: { from: '#00F5D4', to: '#7C5CFF' },
    badge: 'partner',
  },
  kaze: {
    id: 'c-kaze',
    handle: '@kaze.loop',
    displayName: 'Kaze Loop',
    followers: 128_400,
    avatar: { from: '#FF2A85', to: '#FFB020' },
    badge: 'creator',
  },
  volt: {
    id: 'c-volt',
    handle: '@voltaje.sur',
    displayName: 'Voltaje Sur',
    followers: 76_900,
    avatar: { from: '#7C5CFF', to: '#00F5D4' },
    badge: 'live',
  },
  mira: {
    id: 'c-mira',
    handle: '@mira.synth',
    displayName: 'Mira Synth',
    followers: 1_240_000,
    avatar: { from: '#00F5D4', to: '#FF2A85' },
    badge: 'pioneer',
  },
  orbe: {
    id: 'c-orbe',
    handle: '@orbe.data',
    displayName: 'Orbe Data',
    followers: 34_100,
    avatar: { from: '#FFB020', to: '#FF2A85' },
    badge: null,
  },
  lumen: {
    id: 'c-lumen',
    handle: '@lumen.ray',
    displayName: 'Lumen Ray',
    followers: 208_700,
    avatar: { from: '#7C5CFF', to: '#FF2A85' },
    badge: 'creator',
  },
} as const satisfies Record<string, Creator>;

export const MOCK_CLIPS: readonly VideoClip[] = [
  {
    id: 'clip-neon-grid',
    kind: 'short',
    liveViewers: null,
    creator: CREATORS.nyx,
    description:
      'Rejilla infinita renderizada en tiempo real. Sin postproceso, todo sale del shader: 14 pases de raymarching a 60 fps en una GPU de portátil.',
    hashtags: ['#shader', '#webgl', '#neón', '#tiempoReal'],
    audio: track('a-grid', 'Grid Collapse', 'Nyx Render', 48_200),
    accent: { from: '#00F5D4', to: '#1B9AFF' },
    sources: clipSources('neon-grid'),
    durationSeconds: 8,
    metrics: { likes: 184_300, comments: 2_940, shares: 11_200, saves: 32_800, views: 2_410_000 },
    location: 'Lima, PE',
  },
  {
    id: 'clip-pulse-wave',
    kind: 'live',
    liveViewers: 18_400,
    creator: CREATORS.mira,
    description:
      'Autómata celular reaccionando al kick del track. Cada célula viva sube un semitono: la música literalmente dibuja la imagen.',
    hashtags: ['#generativo', '#audioReactivo', '#synth'],
    audio: track('a-pulse', 'Pulse Wave 03', 'Mira Synth', 312_000),
    accent: { from: '#FF2A85', to: '#7C5CFF' },
    sources: clipSources('pulse-wave'),
    durationSeconds: 8,
    metrics: {
      likes: 962_400,
      comments: 18_700,
      shares: 74_100,
      saves: 221_000,
      views: 14_800_000,
    },
    location: null,
  },
  {
    id: 'clip-holo-drift',
    kind: 'short',
    liveViewers: null,
    creator: CREATORS.lumen,
    description:
      'Degradados holográficos a 540p y 180 kB. El truco no es la resolución, es el dithering: mismo peso, cero banding.',
    hashtags: ['#holograma', '#dithering', '#diseño'],
    audio: track('a-drift', 'Drift Protocol', 'Lumen Ray', 9_430),
    accent: { from: '#7C5CFF', to: '#00F5D4' },
    sources: clipSources('holo-drift'),
    durationSeconds: 8,
    metrics: { likes: 54_900, comments: 1_180, shares: 3_420, saves: 9_870, views: 712_000 },
    location: 'CDMX, MX',
  },
  {
    id: 'clip-data-rain',
    kind: 'short',
    liveViewers: null,
    creator: CREATORS.orbe,
    description:
      'Lluvia de datos sobre la regla 110. Es Turing-completa, así que técnicamente este fondo podría ejecutar la app.',
    hashtags: ['#regla110', '#automata', '#código'],
    audio: track('a-rain', 'Data Rain', 'Orbe Data', 2_104),
    accent: { from: '#00F5D4', to: '#0E8F7A' },
    sources: clipSources('data-rain'),
    durationSeconds: 8,
    metrics: { likes: 12_600, comments: 408, shares: 920, saves: 4_310, views: 183_000 },
    location: 'Bogotá, CO',
  },
  {
    id: 'clip-spectral-bloom',
    kind: 'short',
    liveViewers: null,
    creator: CREATORS.kaze,
    description:
      'Floración espectral: bloom falso hecho con dos blurs y una resta. Pesa menos que una textura y corre en cualquier móvil.',
    hashtags: ['#bloom', '#vfx', '#optimización'],
    audio: track('a-bloom', 'Spectral Bloom', 'Kaze Loop', 76_500),
    accent: { from: '#FFB020', to: '#FF2A85' },
    sources: clipSources('spectral-bloom'),
    durationSeconds: 8,
    metrics: { likes: 231_800, comments: 5_610, shares: 18_900, saves: 61_200, views: 3_940_000 },
    location: 'Santiago, CL',
  },
  {
    id: 'clip-vector-dusk',
    kind: 'live',
    liveViewers: 2_740,
    creator: CREATORS.volt,
    description:
      'Atardecer vectorial en directo desde el estudio. Pregunten por el pipeline, lo explico en los comentarios.',
    hashtags: ['#vector', '#enVivo', '#motion'],
    audio: track('a-dusk', 'Vector Dusk', 'Voltaje Sur', 18_300),
    accent: { from: '#FF2A85', to: '#FFB020' },
    sources: clipSources('vector-dusk'),
    durationSeconds: 8,
    metrics: { likes: 41_200, comments: 3_870, shares: 2_140, saves: 7_650, views: 528_000 },
    location: 'Buenos Aires, AR',
  },
];

export const MOCK_TRENDING: readonly TrendingTag[] = [
  {
    tag: '#shaderTok',
    posts: 184_000,
    deltaPercent: 42.6,
    heat: 'hot',
    series: seededSeries('t1', 16),
  },
  {
    tag: '#audioReactivo',
    posts: 96_400,
    deltaPercent: 18.2,
    heat: 'rising',
    series: seededSeries('t2', 16),
  },
  {
    tag: '#glassmorphism',
    posts: 61_200,
    deltaPercent: 7.4,
    heat: 'rising',
    series: seededSeries('t3', 16),
  },
  {
    tag: '#regla110',
    posts: 12_900,
    deltaPercent: -2.1,
    heat: 'steady',
    series: seededSeries('t4', 16),
  },
  {
    tag: '#motionDiario',
    posts: 348_000,
    deltaPercent: 11.9,
    heat: 'hot',
    series: seededSeries('t5', 16),
  },
];

export const MOCK_SUGGESTED: readonly SuggestedCreator[] = [
  { creator: CREATORS.mira, reason: 'Sigue a 3 creadores que tú sigues', mutuals: 3 },
  { creator: CREATORS.kaze, reason: 'Publica sobre #vfx', mutuals: 12 },
  { creator: CREATORS.volt, reason: 'En directo ahora', mutuals: 1 },
];

/**
 * Cola de mensajes que `TrendsStore` va soltando con un temporizador para
 * simular el chat de un directo. En producción esto llega por WebSocket/SSE.
 */
function chat(id: string, handle: string, body: string, accent: string): LiveComment {
  return { id, handle, body, accent, own: false };
}

export const MOCK_LIVE_COMMENTS: readonly LiveComment[] = [
  chat('lc-1', '@pix.el', 'el dithering en el segundo 4 👌', '#00F5D4'),
  chat('lc-2', '@rae.synth', '¿qué sampler usaste para el kick?', '#FF2A85'),
  chat('lc-3', '@nullptr', '540p y se ve mejor que mi 4K, injusto', '#7C5CFF'),
  chat('lc-4', '@kuri.dev', 'guardado para el proyecto del viernes', '#FFB020'),
  chat('lc-5', '@vera.loop', 'la transición del loop es perfecta', '#00F5D4'),
  chat('lc-6', '@hex.mode', 'tutorial cuándo 🙏', '#FF2A85'),
  chat('lc-7', '@sol.aria', 'esto en una pantalla OLED debe ser ilegal', '#7C5CFF'),
  chat('lc-8', '@mod.ular', 'el panel de telemetría es un detallazo', '#00F5D4'),
  chat('lc-9', '@pix.el', '¿cuántos espectadores llevas? 🔥', '#1B9AFF'),
  chat('lc-10', '@kuri.dev', 'saluda a los del turno de noche 🌙', '#FFB020'),
];
