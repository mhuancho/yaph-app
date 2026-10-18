import { Component, computed, input } from '@angular/core';

/**
 * Set de iconos inline.
 *
 * Van en el bundle como datos de path en vez de como sprite externo o fuente de
 * iconos: un solo componente, sin petición extra, sin FOUC y `currentColor`
 * hereda el acento neón de cada contexto.
 */
export type IconName =
  | 'home'
  | 'explore'
  | 'create'
  | 'messages'
  | 'profile'
  | 'heart'
  | 'comment'
  | 'share'
  | 'bookmark'
  | 'music'
  | 'volume-on'
  | 'volume-off'
  | 'play'
  | 'pause'
  | 'verified'
  | 'trend-up'
  | 'search'
  | 'chevron-down'
  | 'activity'
  | 'users'
  | 'hash'
  | 'bolt'
  | 'close'
  | 'send'
  | 'pin'
  | 'emoji'
  | 'reply'
  | 'viewers'
  | 'edit'
  | 'grid';

const PATHS: Readonly<Record<IconName, readonly string[]>> = {
  home: ['M3.5 11 12 3.8 20.5 11', 'M6 9.6V20.2h12V9.6', 'M10 20.2v-4.6h4v4.6'],
  explore: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M15.8 8.2l-2.2 5.4-5.4 2.2 2.2-5.4 5.4-2.2Z'],
  create: ['M12 5v14', 'M5 12h14'],
  messages: ['M20 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.3A8 8 0 1 1 20 12Z'],
  profile: [
    'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M4.6 20.6c1.4-3.4 4.1-5.1 7.4-5.1s6 1.7 7.4 5.1',
  ],
  heart: ['M12 20.4 4.6 13a4.9 4.9 0 0 1 6.9-6.9l.5.5.5-.5A4.9 4.9 0 0 1 19.4 13L12 20.4Z'],
  comment: ['M20 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.3A8 8 0 1 1 20 12Z', 'M9 11.5h6'],
  share: ['M21 3 10.6 13.4', 'M21 3 14.3 21l-3.7-7.6L3 9.7 21 3Z'],
  bookmark: ['M6.5 3.5h11v17L12 16.5 6.5 20.5v-17Z'],
  music: [
    'M9 18.4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
    'M20 15.9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
    'M9 18.4V6.1L20 3.6v12.3',
  ],
  'volume-on': [
    'M4 9.5h3L12 5v14l-5-4.5H4v-5Z',
    'M16 9.2a4 4 0 0 1 0 5.6',
    'M18.6 6.6a7.6 7.6 0 0 1 0 10.8',
  ],
  'volume-off': ['M4 9.5h3L12 5v14l-5-4.5H4v-5Z', 'M16.4 9.6l5 4.8', 'M21.4 9.6l-5 4.8'],
  play: ['M8 5.4 19 12 8 18.6V5.4Z'],
  pause: ['M9.2 5.5v13', 'M14.8 5.5v13'],
  verified: [
    'M12 2.8l2.3 1.7 2.8-.2.9 2.7 2.2 1.7-.9 2.7.9 2.7-2.2 1.7-.9 2.7-2.8-.2L12 21.2l-2.3-1.7-2.8.2-.9-2.7L3.8 15.3l.9-2.7-.9-2.7L6 8.2l.9-2.7 2.8.2L12 2.8Z',
    'M8.9 12.1l2.3 2.3 4.1-4.6',
  ],
  'trend-up': ['M3.5 17 9 11.4l3.4 3.4L20.5 6.7', 'M15 6.7h5.5v5.5'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'M16.1 16.1 21 21'],
  'chevron-down': ['M6 9.6 12 15.6 18 9.6'],
  activity: ['M3 12h3.6l2.4-7 4 14 2.4-7H21'],
  users: [
    'M10.4 13.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z',
    'M3.6 20.5c1.1-2.8 3.6-4.3 6.8-4.3s5.7 1.5 6.8 4.3',
    'M17 7.3a3.1 3.1 0 0 1 0 6',
    'M19 20.5a7.6 7.6 0 0 0-1-2.8',
  ],
  hash: ['M9.4 3.6 7.2 20.4', 'M16.8 3.6 14.6 20.4', 'M4.4 9h15.2', 'M3.8 15h15.2'],
  bolt: ['M13.6 3 6 13.6h4.6L10 21l7.6-10.6H13L13.6 3Z'],
  close: ['M6.2 6.2l11.6 11.6', 'M17.8 6.2 6.2 17.8'],
  send: ['M4 11.6 20.4 4l-7.6 16.4-2.6-6.2L4 11.6Z', 'M10.2 14.2 20.4 4'],
  pin: ['M9.4 3.6h5.2l-.8 5.4 3.2 3.2H7l3.2-3.2-.8-5.4Z', 'M12 11.8v8.6'],
  emoji: [
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
    'M8.6 14.2a4.2 4.2 0 0 0 6.8 0',
    'M9.2 9.4h.01',
    'M14.8 9.4h.01',
  ],
  reply: ['M9.4 7 4.6 11.6 9.4 16.2', 'M4.6 11.6h8.6a5.8 5.8 0 0 1 5.8 5.8v1.4'],
  viewers: [
    'M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  edit: ['M4 20h4.2L19 9.2a2.1 2.1 0 0 0-3-3L5.2 17v3Z', 'M14.4 6.6l3 3'],
  grid: ['M4 4h7v7H4V4Z', 'M13 4h7v7h-7V4Z', 'M4 13h7v7H4v-7Z', 'M13 13h7v7h-7v-7Z'],
};

@Component({
  selector: 'app-icon',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      class="size-full"
      [attr.fill]="filled() ? 'currentColor' : 'none'"
      [attr.stroke-width]="strokeWidth()"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  /** Relleno sólido para los estados activos (corazón con like, guardado). */
  readonly filled = input(false);
  readonly strokeWidth = input(1.6);

  protected readonly paths = computed(() => PATHS[this.name()]);
}
