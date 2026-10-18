import { DestroyRef, Directive, inject, output } from '@angular/core';

/** Desplazamiento mínimo para considerar que hubo gesto y no un toque. */
const SWIPE_PX = 60;
/** Movimiento que cancela la pulsación larga. */
const DRAG_TOLERANCE_PX = 10;
const LONG_PRESS_MS = 500;
/** Ventana para encadenar dos toques. */
const DOUBLE_TAP_MS = 280;

export interface TapPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Gestos del reproductor: toque, doble toque, pulsación larga y deslizamiento
 * horizontal.
 *
 * Va en una directiva y no dentro del componente porque es lógica de entrada
 * pura —temporizadores y umbrales— sin nada que ver con el video.
 *
 * El toque simple se retrasa `DOUBLE_TAP_MS`: es el precio inevitable de
 * distinguirlo del doble toque, y es lo que hace cualquier feed vertical. Por
 * eso la directiva emite `tap` ya desambiguado en vez de dejar que el
 * anfitrión escuche `click`.
 *
 * Usa eventos de puntero, así que cubre ratón, táctil y lápiz con un solo
 * camino.
 */
@Directive({
  selector: '[appClipGestures]',
  host: {
    '(pointerdown)': 'onDown($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)': 'onUp($event)',
    '(pointercancel)': 'onCancel()',
  },
})
export class ClipGestures {
  readonly tap = output<void>();
  readonly doubleTap = output<TapPoint>();
  readonly longPress = output<TapPoint>();
  readonly swipeLeft = output<void>();
  readonly swipeRight = output<void>();

  private startX = 0;
  private startY = 0;
  private consumed = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTap: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected onDown(event: PointerEvent): void {
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.consumed = false;

    this.longPressTimer = setTimeout(() => {
      this.consumed = true;
      this.longPressTimer = null;
      this.longPress.emit({ x: this.startX, y: this.startY });
    }, LONG_PRESS_MS);
  }

  protected onMove(event: PointerEvent): void {
    if (this.longPressTimer === null) return;

    const moved =
      Math.abs(event.clientX - this.startX) > DRAG_TOLERANCE_PX ||
      Math.abs(event.clientY - this.startY) > DRAG_TOLERANCE_PX;
    if (moved) this.cancelLongPress();
  }

  protected onUp(event: PointerEvent): void {
    this.cancelLongPress();
    if (this.consumed) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    // Horizontal de verdad: con el feed desplazándose en vertical, un
    // deslizamiento ambiguo debe perder frente al scroll.
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) this.swipeLeft.emit();
      else this.swipeRight.emit();
      return;
    }
    if (Math.abs(dy) > SWIPE_PX) return;

    if (this.pendingTap !== null) {
      clearTimeout(this.pendingTap);
      this.pendingTap = null;
      this.doubleTap.emit({ x: event.clientX, y: event.clientY });
      return;
    }

    this.pendingTap = setTimeout(() => {
      this.pendingTap = null;
      this.tap.emit();
    }, DOUBLE_TAP_MS);
  }

  protected onCancel(): void {
    this.cancelLongPress();
    this.consumed = true;
  }

  private cancelLongPress(): void {
    if (this.longPressTimer === null) return;
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
  }

  private clearTimers(): void {
    this.cancelLongPress();
    if (this.pendingTap !== null) clearTimeout(this.pendingTap);
    this.pendingTap = null;
  }
}
