/**
 * Modelo de dominio del feed. Todo es `readonly`: el estado mutable vive en los
 * stores (signals) y nunca dentro de las entidades, de modo que una vista no
 * pueda alterar datos compartidos por accidente.
 */

export type BadgeTier = 'creator' | 'partner' | 'pioneer' | 'live';

export interface Creator {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly followers: number;
  /** Par de colores para el avatar generado; evita depender de un CDN de imágenes. */
  readonly avatar: AccentPair;
  readonly badge: BadgeTier | null;
}

export interface AccentPair {
  readonly from: string;
  readonly to: string;
}

export interface AudioTrack {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly uses: number;
  /**
   * Envolvente de amplitud normalizada (0..1), 32 muestras, calculada en
   * ingesta. El visualizador la dibuja con CSS en vez de analizar el audio en
   * cliente: un `AnalyserNode` por clip exige CORS en el media, un
   * `AudioContext` tras gesto del usuario y re-enruta el audio del `<video>`.
   */
  readonly envelope: readonly number[];
}

export interface VideoSource {
  readonly src: string;
  readonly type: string;
}

export interface ClipMetrics {
  readonly likes: number;
  readonly comments: number;
  readonly shares: number;
  readonly saves: number;
  readonly views: number;
}

export interface VideoClip {
  readonly id: string;
  readonly creator: Creator;
  readonly description: string;
  readonly hashtags: readonly string[];
  readonly audio: AudioTrack;
  /**
   * Acento del resplandor ambiental. Se resuelve en ingesta (promedio de color
   * de los keyframes) y viaja como metadato: muestrear el frame en cliente con
   * `drawImage` exige media con CORS, cuesta CPU en cada frame y se rompe en
   * cuanto el video llega por HLS cifrado.
   */
  readonly accent: AccentPair;
  readonly sources: readonly VideoSource[];
  readonly durationSeconds: number;
  readonly metrics: ClipMetrics;
  readonly location: string | null;
}

export type HeatLevel = 'rising' | 'hot' | 'steady';

export interface TrendingTag {
  readonly tag: string;
  readonly posts: number;
  readonly deltaPercent: number;
  readonly heat: HeatLevel;
  /** Serie normalizada (0..1) para el sparkline del HUD. */
  readonly series: readonly number[];
}

export interface SuggestedCreator {
  readonly creator: Creator;
  readonly reason: string;
  readonly mutuals: number;
}

export interface LiveComment {
  readonly id: string;
  readonly handle: string;
  readonly body: string;
  readonly accent: string;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

/** Telemetría real del elemento de video activo (no son cifras decorativas). */
export interface PlaybackTelemetry {
  readonly state: PlaybackState;
  readonly width: number;
  readonly height: number;
  readonly currentTime: number;
  readonly duration: number;
  /** Fracción 0..1 del clip ya en buffer por delante del cabezal. */
  readonly bufferAhead: number;
  readonly droppedFrames: number;
  readonly decodedFrames: number;
}

export const EMPTY_TELEMETRY: PlaybackTelemetry = {
  state: 'idle',
  width: 0,
  height: 0,
  currentTime: 0,
  duration: 0,
  bufferAhead: 0,
  droppedFrames: 0,
  decodedFrames: 0,
};
