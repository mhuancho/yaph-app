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
 *
 * Devuelve `null` cuando no hay nada que reproducir o cuando no hay navegador
 * a quien preguntar, que es el caso del prerender en servidor.
 */
let probe: HTMLVideoElement | null = null;

export function pickPlayableSource(sources: readonly VideoSource[]): string | null {
  const first = sources[0];
  if (!first) return null;

  // Sin DOM —el prerender en servidor— no hay a quién preguntar, y elegir una
  // fuente «por defecto» es peor que no elegir ninguna: el HTML saldría con un
  // `src` que el navegador empieza a descargar antes de hidratar; si ese
  // contenedor no es el que soporta, el `error` anterior a la hidratación se
  // reproduce sobre el componente (hay replay de eventos) y lo deja en fallo
  // permanente aunque el códec correcto estuviera disponible.
  if (typeof document === 'undefined') return null;

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
