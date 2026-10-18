import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClipGestures, TapPoint } from './clip-gestures';

@Component({
  imports: [ClipGestures],
  template: `
    <button
      appClipGestures
      (tap)="log('tap')"
      (doubleTap)="onDouble($event)"
      (longPress)="log('long')"
      (swipeLeft)="log('left')"
      (swipeRight)="log('right')"
    ></button>
  `,
})
class Host {
  readonly events = signal<string[]>([]);
  readonly lastPoint = signal<TapPoint | null>(null);

  log(name: string): void {
    this.events.update((list) => [...list, name]);
  }

  onDouble(point: TapPoint): void {
    this.lastPoint.set(point);
    this.log('double');
  }
}

function pointer(type: string, x: number, y: number): PointerEvent {
  return new PointerEvent(type, { clientX: x, clientY: y, bubbles: true });
}

describe('ClipGestures', () => {
  let host: Host;
  let target: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    host = fixture.componentInstance;
    target = fixture.nativeElement.querySelector('button')!;
  });

  afterEach(() => vi.useRealTimers());

  function tapAt(x = 10, y = 10): void {
    target.dispatchEvent(pointer('pointerdown', x, y));
    target.dispatchEvent(pointer('pointerup', x, y));
  }

  it('emite un toque simple solo tras la ventana del doble toque', () => {
    tapAt();
    expect(host.events()).toEqual([]);

    vi.advanceTimersByTime(300);
    expect(host.events()).toEqual(['tap']);
  });

  it('emite doble toque con el punto y sin el toque simple', () => {
    tapAt(40, 60);
    vi.advanceTimersByTime(100);
    tapAt(40, 60);

    expect(host.events()).toEqual(['double']);
    expect(host.lastPoint()).toEqual({ x: 40, y: 60 });

    // Y pasada la ventana no llega ningún toque suelto.
    vi.advanceTimersByTime(500);
    expect(host.events()).toEqual(['double']);
  });

  it('emite pulsación larga y descarta el toque posterior', () => {
    target.dispatchEvent(pointer('pointerdown', 10, 10));
    vi.advanceTimersByTime(600);
    target.dispatchEvent(pointer('pointerup', 10, 10));
    vi.advanceTimersByTime(500);

    expect(host.events()).toEqual(['long']);
  });

  it('cancela la pulsación larga si el dedo se mueve', () => {
    target.dispatchEvent(pointer('pointerdown', 10, 10));
    target.dispatchEvent(pointer('pointermove', 60, 10));
    vi.advanceTimersByTime(600);

    expect(host.events()).not.toContain('long');
  });

  it('distingue el deslizamiento horizontal', () => {
    target.dispatchEvent(pointer('pointerdown', 200, 100));
    target.dispatchEvent(pointer('pointerup', 100, 110));
    vi.advanceTimersByTime(500);
    expect(host.events()).toEqual(['left']);

    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointerup', 200, 110));
    vi.advanceTimersByTime(500);
    expect(host.events()).toEqual(['left', 'right']);
  });

  it('ignora un arrastre vertical: ahí manda el scroll del feed', () => {
    target.dispatchEvent(pointer('pointerdown', 100, 100));
    target.dispatchEvent(pointer('pointerup', 110, 300));
    vi.advanceTimersByTime(500);

    expect(host.events()).toEqual([]);
  });
});
