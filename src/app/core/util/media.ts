import { VideoSource } from '../models/feed';

/**
 * Elige la fuente a reproducir consultando al propio navegador.
 *
 * Cada clip se publica en MP4 (H.264/AAC) y WebM (VP9/Opus). No es
 * redundancia: los builds de Chromium sin códecs propietarios y algunas
 * compilaciones de Firefox en Linux no decodifican H.264, y ahí el feed se
 * quedaría en la portada. Con los `codecs=` declarados, `canPlayType` distingue
 * los casos; sin ellos todo responde "maybe" y la consulta no sirve de nada.
 *
 * Se elige en TS y no con varios `<source>` porque el elemento de media no
 * emite `error` cuando se agotan los `<source>` (lo emite el último `<source>`),
 * y sin ese evento no se puede mostrar el estado de fallo.
 */
let probe: HTMLVideoElement | null = null;

export function pickPlayableSource(sources: readonly VideoSource[]): string {
  const first = sources[0];
  if (!first) return '';
  if (typeof document === 'undefined') return first.src;

  probe ??= document.createElement('video');

  let fallback: VideoSource | null = null;
  for (const source of sources) {
    const verdict = probe.canPlayType(source.type);
    if (verdict === 'probably') return source.src;
    if (verdict === 'maybe') fallback ??= source;
  }

  // `canPlayType` es orientativo, no normativo: si nadie contesta "probably"
  // se prueba igualmente, y si falla queda el póster y el aviso de error.
  return (fallback ?? first).src;
}
