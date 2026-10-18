You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Reglas propias de este proyecto (YAPH)

- **Nunca uses `backdrop-filter` en una capa que se solape con el `<video>` del
  feed.** Usa `glass-flat` o un degradado (`.scrim`). `glass` queda reservado
  para el dock y el panel HUD, que viven sobre el fondo estático de la página.
- **Solo el clip activo y sus vecinos montan `<video>`** (`FeedStore.shouldMount`).
  No amplíes la ventana sin medir: cada elemento es un decodificador.
- **Escribe las clases de Tailwind completas en cada rama**, nunca construidas
  en runtime (`'bg-' + color`): v4 detecta utilidades escaneando el código como
  texto y una clase compuesta no llega al CSS generado. Para alternar varias
  clases usa un `computed()` que devuelva la cadena completa y enlázalo con
  `[class]`: un nombre con barra (`border-white/12`) no se puede escribir como
  `[class.border-white/12]`.
- **Los valores que cambian muchas veces por segundo se animan con `transform`**
  (`scaleX`), no con `width`/`height`.
- **Las plantillas inline no pueden contener backticks**, ni siquiera dentro de
  comentarios HTML: cierran el template literal.
- `@Service()` para los stores; estado con signals, derivado con `computed()`,
  y `linkedSignal()` cuando debe reiniciarse al cambiar una fuente.
- **Comentarios de clip ≠ chat de directo.** Son tipos distintos
  (`ClipComment` persistente, `LiveComment` efímero) y lo decide `clip.kind`,
  nunca la insignia del creador. El hilo vive en `features/comments`.
- **Las respuestas se aplanan a un nivel**: responder a una respuesta cuelga
  del mismo comentario raíz.
- **Un panel flotante sobre texto va con fondo opaco**, no con `glass`: anidado
  bajo otra superficie con `backdrop-filter` el desenfoque deja de aislar.
- **Para un diálogo modal usa `<dialog>` + `showModal()`**, no un `div` con
  foco atrapado a mano.
