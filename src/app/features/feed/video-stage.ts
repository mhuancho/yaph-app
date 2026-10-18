import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { EMPTY_TELEMETRY, PlaybackState, VideoClip } from '../../core/models/feed';
import { FeedStore } from '../../core/state/feed-store';
import { pickPlayableSource } from '../../core/util/media';
import { PlaybackTelemetryStore } from '../../core/state/playback-telemetry-store';
import { Icon } from '../../ui/icon';
import { ClockPipe } from '../../ui/metric-pipes';
import { ClipOverlay } from './clip-overlay';
import { InteractionRail } from './interaction-rail';

/**
 * Un clip del feed: marco 9:16, resplandor ambiental, capas de información y
 * el `<video>` cuando toca.
 *
 * Reglas que gobiernan este componente:
 *
 * 1. El `<video>` solo existe si `mounted` es cierto (el activo y sus vecinos).
 *    Un elemento de video es un decodificador: con el feed completo montado el
 *    navegador empieza a reciclar decodificadores a media lista y los clips se
 *    quedan en negro.
 * 2. Ninguna capa que se solape con el video usa `backdrop-filter`. El
 *    desenfoque de fondo obliga al compositor a releer el frame del video en
 *    cada repintado; con el video a 30 fps eso es trabajo de GPU constante.
 *    En su lugar hay un degradado (`.scrim`), que se compone una sola vez.
 * 3. El resplandor sale del metadato `accent` del clip, no de muestrear el
 *    frame con canvas: eso exigiría media con CORS, costaría CPU por frame y
 *    dejaría de funcionar con HLS cifrado.
 */
@Component({
  selector: 'app-video-stage',
  imports: [ClipOverlay, InteractionRail, Icon, ClockPipe],
  host: {
    class: 'relative block h-full w-full snap-start snap-always',
    role: 'article',
    '[style.--glow-from]': 'clip().accent.from',
    '[style.--glow-to]': 'clip().accent.to',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-posinset]': 'index() + 1',
    '[attr.aria-setsize]': 'total()',
  },
  styles: `
    /* Alto reservado por la barra inferior móvil. Todas las capas ancladas al
     * borde inferior del marco se suben con esta variable para no quedar
     * tapadas; en escritorio no hay barra y vale 0. */
    :host {
      --bottom-inset: calc(4.5rem + env(safe-area-inset-bottom));
    }

    @media (min-width: 48rem) {
      :host {
        --bottom-inset: 0px;
      }
    }

    /* Resplandor ambiental. Oculto en móvil: a pantalla completa no hay margen
     * donde verlo y es una capa desenfocada grande que no paga su coste. */
    .glow {
      background:
        radial-gradient(55% 45% at 50% 22%, var(--glow-from), transparent 70%),
        radial-gradient(65% 50% at 50% 86%, var(--glow-to), transparent 72%);
      filter: blur(44px);
      opacity: 0.45;
      transition: opacity 700ms ease;
      will-change: opacity;
    }

    .glow-live {
      opacity: 0.85;
    }

    /* El fondo lo pone la utilidad clip-poster, compartida con la parrilla
     * del perfil. Aquí solo se añaden las líneas de barrido, que son propias
     * del reproductor: sobre el video en reproducción un blend por frame
     * cuesta demasiado, por eso van únicamente en esta capa estática. */
    .poster::after {
      content: '';
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(
        0deg,
        rgb(255 255 255 / 0.05) 0 1px,
        transparent 1px 3px
      );
      opacity: 0.45;
    }

    .scrim {
      background: linear-gradient(
        to top,
        rgb(5 5 8 / 0.94) 0%,
        rgb(5 5 8 / 0.62) 26%,
        rgb(5 5 8 / 0.1) 54%,
        transparent 72%
      );
    }
  `,
  template: `
    <div class="flex h-full w-full items-center justify-center gap-4 md:px-6 md:py-5">
      <!-- Caja que fija la relación 9:16 en escritorio; a pantalla completa en
           móvil, igual que el resto de feeds verticales. -->
      <div class="relative h-full w-full md:aspect-[9/16] md:w-auto">
        <div
          class="glow pointer-events-none absolute -inset-8 hidden md:block"
          [class.glow-live]="isPlaying()"
        ></div>

        <div
          class="relative z-10 h-full w-full overflow-hidden bg-carbon md:rounded-stage md:border md:border-white/10"
        >
          <div class="poster clip-poster absolute inset-0"></div>

          @if (mounted() && !failed()) {
            <video
              #video
              class="absolute inset-0 size-full object-cover"
              loop
              playsinline
              [src]="primarySource()"
              [muted]="feed.muted()"
              [attr.preload]="active() ? 'auto' : 'metadata'"
              (loadedmetadata)="onProbe('loading')"
              (playing)="onPlaying()"
              (pause)="onPause()"
              (waiting)="onProbe('loading')"
              (timeupdate)="onProbe()"
              (progress)="onProbe()"
              (error)="onError()"
            ></video>
          }

          <!-- Degradado de legibilidad. Lleva pointer-events-none para no robar el
               clic al control de reproducción que está justo debajo. -->
          <div class="scrim pointer-events-none absolute inset-x-0 bottom-0 h-2/5"></div>

          <!-- Control de reproducción a pantalla completa. Es un <button> real:
               aporta el objetivo táctil grande y, de paso, el control de pausa
               que exige WCAG 2.2.2 para contenido que arranca solo. -->
          <button
            type="button"
            class="absolute inset-0 z-10 cursor-default"
            [attr.aria-label]="isPlaying() ? 'Pausar clip' : 'Reproducir clip'"
            (click)="feed.togglePlayback()"
          >
            @if (active() && !isPlaying()) {
              <span
                class="glass-flat pointer-events-none absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 text-ink shadow-neon-cyan"
              >
                <app-icon name="play" class="size-7" [filled]="true" [strokeWidth]="1" />
              </span>
            }
          </button>

          @if (failed()) {
            <p
              class="metric absolute top-1/2 left-1/2 w-56 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neon-magenta/40 bg-abyss/80 p-3 text-center text-[0.6875rem] text-ink-muted"
            >
              No se pudo cargar el clip. Se muestra la portada.
            </p>
          }

          <!-- Información del clip -->
          <app-clip-overlay
            class="absolute inset-x-0 bottom-0 z-20 px-4 pt-6 pr-20 pb-[calc(var(--bottom-inset)+1.25rem)] md:pr-6 md:pb-7"
            [clip]="clip()"
            [active]="active()"
            [playing]="isPlaying()"
          />

          <!-- Progreso: scaleX en vez de width para que el navegador lo
               resuelva en el compositor y no haga layout 4 veces por segundo. -->
          <div class="absolute inset-x-0 bottom-[var(--bottom-inset)] z-30 h-[3px] bg-white/10">
            <div
              class="h-full origin-left bg-[linear-gradient(90deg,var(--glow-from),var(--glow-to))]"
              [style.transform]="'scaleX(' + progress() + ')'"
            ></div>
          </div>

          @if (active()) {
            <span
              class="metric absolute right-3 bottom-[calc(var(--bottom-inset)+0.625rem)] z-30 text-[0.625rem] text-ink-muted tabular-nums"
            >
              @if (clip().kind === 'live') {
                en directo
              } @else {
                {{ telemetry.currentTime() | clock }} / {{ clip().durationSeconds | clock }}
              }
            </span>
          }
        </div>
      </div>

      <app-interaction-rail [clip]="clip()" />
    </div>
  `,
})
export class VideoStage {
  readonly clip = input.required<VideoClip>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  /** El clip visible en reposo: el único que reproduce y reporta telemetría. */
  readonly active = input(false);
  /** Si el `<video>` debe existir en el DOM. */
  readonly mounted = input(false);

  protected readonly feed = inject(FeedStore);
  protected readonly telemetry = inject(PlaybackTelemetryStore);

  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected readonly isPlaying = signal(false);
  protected readonly failed = signal(false);

  protected readonly primarySource = computed(() => pickPlayableSource(this.clip().sources));

  protected readonly ariaLabel = computed(
    () => `Clip de ${this.clip().creator.displayName}: ${this.clip().description}`,
  );

  protected readonly progress = computed(() => (this.active() ? this.telemetry.progress() : 0));

  private readonly shouldPlay = computed(
    () => this.active() && !this.feed.paused() && !this.failed(),
  );

  constructor() {
    effect(() => {
      const video = this.videoRef()?.nativeElement;

      if (!video) {
        // El clip pasó a activo antes de que exista su `<video>` (primer
        // render, o vecino recién montado). Se marca "cargando" para que el
        // panel HUD no siga mostrando la telemetría del clip anterior.
        if (this.active()) this.telemetry.report({ ...EMPTY_TELEMETRY, state: 'loading' });
        return;
      }

      // `muted` debe estar puesto como propiedad antes de `play()`: el binding
      // del template lo hace, pero el orden entre binding y efecto no está
      // garantizado y un `play()` con sonido se rechaza.
      video.muted = this.feed.muted();

      if (this.shouldPlay()) {
        void this.start(video);
      } else {
        video.pause();
      }

      // Refresca el HUD al cambiar de clip sin esperar al primer `timeupdate`.
      this.probe();
    });
  }

  protected onPlaying(): void {
    this.isPlaying.set(true);
    this.probe('playing');
  }

  protected onPause(): void {
    this.isPlaying.set(false);
    this.probe('paused');
  }

  protected onError(): void {
    this.isPlaying.set(false);
    this.failed.set(true);
    if (this.active()) this.telemetry.report({ state: 'error' });
  }

  protected onProbe(state?: PlaybackState): void {
    this.probe(state);
  }

  private async start(video: HTMLVideoElement): Promise<void> {
    try {
      await video.play();
    } catch (error) {
      const name = (error as DOMException | undefined)?.name;
      // AbortError: un `pause()` posterior interrumpió este `play()`. Es el
      // caso normal al pasar de clip rápido, no un fallo.
      if (name === 'AbortError') return;
      // NotAllowedError: política de autoplay del navegador. El clip queda
      // pausado y el botón central invita a reproducir.
      this.isPlaying.set(false);
      if (this.active()) this.telemetry.report({ state: 'paused' });
    }
  }

  /** Vuelca el estado real del elemento al store de telemetría. */
  private probe(state?: PlaybackState): void {
    const video = this.videoRef()?.nativeElement;
    if (!video || !this.active()) return;

    const quality =
      typeof video.getVideoPlaybackQuality === 'function' ? video.getVideoPlaybackQuality() : null;
    const duration = Number.isFinite(video.duration) ? video.duration : 0;

    this.telemetry.report({
      state: state ?? (video.paused ? 'paused' : 'playing'),
      width: video.videoWidth,
      height: video.videoHeight,
      currentTime: video.currentTime,
      duration,
      bufferAhead: bufferAheadRatio(video, duration),
      droppedFrames: quality?.droppedVideoFrames ?? 0,
      decodedFrames: quality?.totalVideoFrames ?? 0,
    });
  }
}

/** Fracción del clip ya descargada por delante del cabezal de reproducción. */
function bufferAheadRatio(video: HTMLVideoElement, duration: number): number {
  if (duration <= 0) return 0;
  const { buffered, currentTime } = video;

  for (let i = 0; i < buffered.length; i++) {
    if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
      return Math.min(1, (buffered.end(i) - currentTime) / duration);
    }
  }
  return 0;
}
