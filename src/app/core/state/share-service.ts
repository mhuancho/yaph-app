import { inject, Service } from '@angular/core';
import { ToastStore } from './toast-store';

export interface SharePayload {
  readonly title: string;
  readonly text: string;
  /** Ruta de la app; se convierte en absoluta antes de compartir. */
  readonly path: string;
}

/**
 * Compartir con la hoja nativa y, si no la hay, copiando el enlace.
 *
 * `navigator.share` solo existe en contexto seguro y exige un gesto del
 * usuario; `navigator.clipboard` tiene las mismas condiciones. Por eso hay
 * tres niveles: hoja nativa, portapapeles y, como último recurso, mostrar el
 * enlace en un aviso para que se pueda copiar a mano.
 */
@Service()
export class ShareService {
  private readonly toasts = inject(ToastStore);

  async share(payload: SharePayload): Promise<void> {
    const url = this.absolute(payload.path);

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: payload.title, text: payload.text, url });
        return;
      } catch (error) {
        // El usuario cerró la hoja: no es un fallo y no merece un aviso.
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        this.toasts.show('Enlace copiado al portapapeles', 'ok');
        return;
      } catch {
        // Sin permiso de portapapeles: se cae al último nivel.
      }
    }

    this.toasts.show(`Copia el enlace: ${url}`);
  }

  private absolute(path: string): string {
    if (typeof location === 'undefined') return path;
    return new URL(path, location.origin).toString();
  }
}
