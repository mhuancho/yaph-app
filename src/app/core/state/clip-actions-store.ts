import { inject, Service, signal } from '@angular/core';
import { VideoClip } from '../models/feed';
import { FeedStore } from './feed-store';
import { ShareService } from './share-service';
import { ToastStore } from './toast-store';

/**
 * Menú de acciones de un clip, el que abre la pulsación larga.
 *
 * El estado vive en un store y no en el componente porque el menú se abre
 * desde el reproductor pero lo dibuja el armazón: así no queda uno por cada
 * clip montado.
 */
@Service()
export class ClipActionsStore {
  private readonly feed = inject(FeedStore);
  private readonly toasts = inject(ToastStore);
  private readonly sharing = inject(ShareService);

  readonly clip = signal<VideoClip | null>(null);

  /** Clips que el usuario ha marcado como no interesantes. */
  readonly muted = signal<ReadonlySet<string>>(new Set<string>());

  open(clip: VideoClip): void {
    this.clip.set(clip);
  }

  close(): void {
    this.clip.set(null);
  }

  toggleSave(): void {
    const clip = this.clip();
    if (!clip) return;

    this.feed.toggleSave(clip.id);
    this.toasts.show(this.feed.isSaved(clip.id) ? 'Guardado' : 'Quitado de guardados', 'ok');
    this.close();
  }

  share(): void {
    const clip = this.clip();
    if (!clip) return;

    void this.sharing.share({
      title: `${clip.creator.displayName} en YAPH`,
      text: clip.description,
      path: `/perfil/${clip.creator.handle}`,
    });
    this.close();
  }

  notInterested(): void {
    const clip = this.clip();
    if (!clip) return;

    this.muted.update((ids) => new Set(ids).add(clip.id));
    this.toasts.show('Verás menos clips como este', 'ok');
    this.close();
  }
}
