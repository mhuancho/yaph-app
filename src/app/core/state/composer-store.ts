import { computed, inject, Service, signal } from '@angular/core';
import { ALL_SOUNDS } from '../data/catalog';
import { CURRENT_PROFILE } from '../data/mock-profiles';
import { clipSources } from '../data/mock-feed';
import { AudioTrack, VideoClip } from '../models/feed';
import { FeedStore } from './feed-store';
import { ToastStore } from './toast-store';

/** Clips de muestra que hacen las veces de «galería» del dispositivo. */
export const SAMPLE_FOOTAGE = [
  { file: 'neon-grid', name: 'Rejilla neón', accent: { from: '#00F5D4', to: '#1B9AFF' } },
  { file: 'pulse-wave', name: 'Onda de pulso', accent: { from: '#FF2A85', to: '#7C5CFF' } },
  { file: 'holo-drift', name: 'Deriva holográfica', accent: { from: '#7C5CFF', to: '#00F5D4' } },
  { file: 'data-rain', name: 'Lluvia de datos', accent: { from: '#00F5D4', to: '#0E8F7A' } },
  {
    file: 'spectral-bloom',
    name: 'Floración espectral',
    accent: { from: '#FFB020', to: '#FF2A85' },
  },
  { file: 'vector-dusk', name: 'Atardecer vectorial', accent: { from: '#FF2A85', to: '#FFB020' } },
] as const;

export const DESCRIPTION_MAX_LENGTH = 180;

/**
 * Borrador de una publicación.
 *
 * Sin backend no hay subida ni transcodificación: se elige metraje de muestra
 * en lugar de un archivo del disco. Lo que sí es real es todo lo demás —
 * descripción, hashtags extraídos del texto, sonido, portada y publicación—,
 * de modo que conectar una subida real solo cambia de dónde sale `sources`.
 */
@Service()
export class ComposerStore {
  private readonly feed = inject(FeedStore);
  private readonly toasts = inject(ToastStore);

  readonly footage = signal<(typeof SAMPLE_FOOTAGE)[number]>(SAMPLE_FOOTAGE[0]);
  readonly description = signal('');
  readonly sound = signal<AudioTrack | null>(null);
  /** Fotograma elegido como portada, en segundos. */
  readonly coverSecond = signal(2);

  readonly sounds = ALL_SOUNDS.map((entry) => entry.sound).slice(0, 10);

  /** Publicaciones creadas en esta sesión; el perfil propio las muestra. */
  readonly published = signal<readonly VideoClip[]>([]);

  private sequence = 0;

  /**
   * Hashtags extraídos del propio texto, como en cualquier composer: escribir
   * `#motion` en la descripción es la forma natural de etiquetar, y un campo
   * aparte obligaría a escribirlo dos veces.
   */
  readonly hashtags = computed(() => {
    const found = this.description().match(/#[\p{L}\p{N}_]+/gu) ?? [];
    return [...new Set(found.map((tag) => tag.toLowerCase()))];
  });

  readonly remaining = computed(() => DESCRIPTION_MAX_LENGTH - this.description().length);
  readonly canPublish = computed(() => this.description().trim().length > 0);

  selectSound(id: string | null): void {
    this.sound.set(id ? (this.sounds.find((item) => item.id === id) ?? null) : null);
  }

  reset(): void {
    this.footage.set(SAMPLE_FOOTAGE[0]);
    this.description.set('');
    this.sound.set(null);
    this.coverSecond.set(2);
  }

  /** Publica el borrador y devuelve el clip creado, o `null` si no era válido. */
  publish(): VideoClip | null {
    if (!this.canPublish()) return null;

    const footage = this.footage();
    this.sequence += 1;
    const sound = this.sound();

    const clip: VideoClip = {
      id: `mine-${this.sequence}`,
      kind: 'short',
      liveViewers: null,
      creator: CURRENT_PROFILE,
      description: this.description().trim().slice(0, DESCRIPTION_MAX_LENGTH),
      hashtags: this.hashtags(),
      audio: sound ?? {
        id: `a-mine-${this.sequence}`,
        title: 'Sonido original',
        author: CURRENT_PROFILE.displayName,
        uses: 1,
        envelope: Array.from({ length: 32 }, (_, i) => 0.3 + ((i * 7) % 10) / 14),
      },
      accent: footage.accent,
      sources: clipSources(footage.file),
      durationSeconds: 8,
      metrics: { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
      location: null,
    };

    this.published.update((list) => [clip, ...list]);
    // Entra arriba del feed para que se vea publicada de inmediato.
    this.feed.prepend(clip);
    this.toasts.show('Publicado. Ya está en tu perfil.', 'ok');
    this.reset();
    return clip;
  }
}
