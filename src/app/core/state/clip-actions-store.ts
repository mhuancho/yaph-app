import { inject, Service, signal } from '@angular/core';
import { VideoClip } from '../models/feed';
import { FeedStore } from './feed-store';
import { ModerationStore, ReportReason } from './moderation-store';
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
  readonly moderation = inject(ModerationStore);

  readonly clip = signal<VideoClip | null>(null);
  /** La hoja muestra la lista de motivos en lugar de las acciones. */
  readonly reporting = signal(false);

  open(clip: VideoClip): void {
    this.clip.set(clip);
    this.reporting.set(false);
  }

  close(): void {
    this.clip.set(null);
    this.reporting.set(false);
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

    this.moderation.hide(clip.id);
    this.toasts.show('Verás menos clips como este', 'ok');
    this.close();
  }

  startReport(): void {
    this.reporting.set(true);
  }

  /**
   * Enviar la denuncia oculta el clip además de registrarlo: quien denuncia
   * algo no quiere seguir viéndolo mientras se revisa.
   */
  sendReport(reason: ReportReason): void {
    const clip = this.clip();
    if (!clip) return;

    this.moderation.report(clip.id);
    this.moderation.hide(clip.id);
    this.toasts.show(`Denuncia enviada: ${reason.toLowerCase()}`, 'ok');
    this.close();
  }

  toggleBlock(): void {
    const clip = this.clip();
    if (!clip) return;

    const creator = clip.creator;
    this.moderation.toggleBlock(creator.id);
    this.toasts.show(
      this.moderation.isBlocked(creator.id)
        ? `${creator.handle} bloqueado`
        : `${creator.handle} desbloqueado`,
      'ok',
    );
    this.close();
  }
}
