import { Component, ElementRef, inject, output, signal } from '@angular/core';
import { Icon } from './icon';

interface Emoji {
  readonly char: string;
  /** Nombre leído por el lector de pantalla; sin él el botón sería mudo. */
  readonly name: string;
}

interface EmojiGroup {
  readonly label: string;
  readonly emojis: readonly Emoji[];
}

/**
 * Selección corta y curada en vez del catálogo Unicode completo: un selector
 * exhaustivo necesita índice de búsqueda, datos de tonos de piel y carga
 * diferida, y en un composer de comentarios casi nadie baja del primer grupo.
 */
const GROUPS: readonly EmojiGroup[] = [
  {
    label: 'Reacciones',
    emojis: [
      { char: '🔥', name: 'fuego' },
      { char: '❤️', name: 'corazón' },
      { char: '😂', name: 'risa' },
      { char: '👏', name: 'aplauso' },
      { char: '🙌', name: 'celebración' },
      { char: '💯', name: 'cien' },
      { char: '✨', name: 'brillos' },
      { char: '🤯', name: 'alucinando' },
    ],
  },
  {
    label: 'Caras',
    emojis: [
      { char: '😀', name: 'sonrisa' },
      { char: '😅', name: 'sonrisa nerviosa' },
      { char: '😍', name: 'ojos de corazón' },
      { char: '🥹', name: 'emoción contenida' },
      { char: '😎', name: 'gafas de sol' },
      { char: '🤔', name: 'pensando' },
      { char: '😴', name: 'durmiendo' },
      { char: '🥳', name: 'fiesta' },
    ],
  },
  {
    label: 'Gestos',
    emojis: [
      { char: '👍', name: 'pulgar arriba' },
      { char: '👌', name: 'perfecto' },
      { char: '🤝', name: 'apretón de manos' },
      { char: '🙏', name: 'por favor' },
      { char: '💪', name: 'fuerza' },
      { char: '🫶', name: 'corazón con las manos' },
      { char: '👀', name: 'ojos' },
      { char: '🫡', name: 'saludo militar' },
    ],
  },
  {
    label: 'Creación',
    emojis: [
      { char: '🎧', name: 'auriculares' },
      { char: '🎬', name: 'claqueta' },
      { char: '🎹', name: 'teclado musical' },
      { char: '🎨', name: 'paleta' },
      { char: '⚡', name: 'rayo' },
      { char: '🛠️', name: 'herramientas' },
      { char: '📈', name: 'gráfica al alza' },
      { char: '🧊', name: 'hielo' },
    ],
  },
  {
    label: 'Símbolos',
    emojis: [
      { char: '💜', name: 'corazón morado' },
      { char: '💙', name: 'corazón azul' },
      { char: '💚', name: 'corazón verde' },
      { char: '🧡', name: 'corazón naranja' },
      { char: '⭐', name: 'estrella' },
      { char: '🌙', name: 'luna' },
      { char: '🚀', name: 'cohete' },
      { char: '🌈', name: 'arcoíris' },
    ],
  },
];

/**
 * Selector de emojis del composer.
 *
 * No usa la Popover API: un `popover` vive en la capa superior y su colocación
 * junto al disparador depende de CSS Anchor Positioning, que todavía no está
 * en todos los motores. Un panel absoluto dentro de un contenedor relativo se
 * coloca igual en todas partes y funciona también dentro del `<dialog>` modal
 * de la hoja móvil, donde la capa superior ya está ocupada.
 *
 * El fondo es opaco y no `glass`: el panel flota sobre texto y, anidado dentro
 * de otra superficie con `backdrop-filter`, el desenfoque deja de aislar lo que
 * hay debajo. Opaco también ahorra una capa de composición.
 */
@Component({
  selector: 'app-emoji-picker',
  imports: [Icon],
  host: {
    class: 'relative',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(keydown.escape)': 'close()',
  },
  template: `
    <button
      type="button"
      class="grid size-9 place-items-center rounded-full border border-white/12 text-ink-muted transition-[color,border-color] duration-200 hover:border-neon-cyan/50 hover:text-neon-cyan"
      [class.border-neon-cyan]="open()"
      [class.text-neon-cyan]="open()"
      [attr.aria-expanded]="open()"
      aria-label="Insertar emoji"
      (click)="open.set(!open())"
    >
      <app-icon name="emoji" class="size-[1.15rem]" />
    </button>

    @if (open()) {
      <div
        class="absolute right-0 bottom-11 z-50 w-64 rounded-glass border border-white/12 bg-carbon p-2 shadow-hud"
        role="group"
        aria-label="Emojis"
      >
        <div class="scrollbar-none max-h-56 overflow-y-auto overscroll-contain">
          @for (group of groups; track group.label) {
            <p
              class="metric px-1 pt-1.5 pb-1 text-[0.5625rem] tracking-[0.16em] text-ink-faint uppercase"
            >
              {{ group.label }}
            </p>
            <div class="grid grid-cols-8 gap-0.5">
              @for (emoji of group.emojis; track emoji.char) {
                <button
                  type="button"
                  class="grid size-7 place-items-center rounded-lg text-base transition-colors duration-150 hover:bg-white/10"
                  [attr.aria-label]="emoji.name"
                  (click)="choose(emoji.char)"
                >
                  {{ emoji.char }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class EmojiPicker {
  /** Emoji elegido. Quien lo recibe decide dónde insertarlo. */
  readonly pick = output<string>();

  protected readonly open = signal(false);
  protected readonly groups = GROUPS;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected choose(char: string): void {
    this.pick.emit(char);
    this.close();
  }

  protected close(): void {
    this.open.set(false);
  }

  /**
   * `pointerdown` y no `click`: al pulsar fuera, el panel debe cerrarse antes
   * de que el navegador mueva el foco, o el textarea perdería la posición del
   * cursor que se necesita para insertar.
   */
  protected onDocumentPointerDown(event: Event): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
