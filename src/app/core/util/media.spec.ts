import { pickPlayableSource } from './media';
import { VideoSource } from '../models/feed';

const MP4: VideoSource = { src: 'clips/a.mp4', type: 'video/mp4; codecs="avc1.4D401F, mp4a.40.2"' };
const WEBM: VideoSource = { src: 'clips/a.webm', type: 'video/webm; codecs="vp9, opus"' };

/**
 * jsdom responde '' a cualquier `canPlayType`, así que las preferencias se
 * simulan parcheando el prototipo: es la misma rama que ejecuta un Chromium
 * sin códecs propietarios.
 */
function withCanPlayType(answer: (type: string) => CanPlayTypeResult, run: () => void): void {
  const original = HTMLMediaElement.prototype.canPlayType;
  HTMLMediaElement.prototype.canPlayType = function (type: string) {
    return answer(type);
  };
  try {
    run();
  } finally {
    HTMLMediaElement.prototype.canPlayType = original;
  }
}

describe('pickPlayableSource', () => {
  it('devuelve cadena vacía sin fuentes', () => {
    expect(pickPlayableSource([])).toBe('');
  });

  it('prefiere la fuente que el navegador declara reproducible', () => {
    withCanPlayType(
      (type) => (type.includes('webm') ? 'probably' : ''),
      () => expect(pickPlayableSource([MP4, WEBM])).toBe(WEBM.src),
    );
  });

  it('acepta un "maybe" cuando nadie contesta "probably"', () => {
    withCanPlayType(
      (type) => (type.includes('mp4') ? 'maybe' : ''),
      () => expect(pickPlayableSource([WEBM, MP4])).toBe(MP4.src),
    );
  });

  it('cae a la primera fuente si el navegador no reconoce ninguna', () => {
    withCanPlayType(
      () => '',
      () => expect(pickPlayableSource([MP4, WEBM])).toBe(MP4.src),
    );
  });
});
