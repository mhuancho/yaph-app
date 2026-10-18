import { computed, effect, inject, Service } from '@angular/core';
import { PersistentState } from '../state/persistent-state';
import { EN, ES, MessageKey } from './messages';

export const LOCALES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
] as const;

export type Locale = (typeof LOCALES)[number]['id'];

const DICTIONARIES: Record<Locale, Partial<Record<MessageKey, string>>> = { es: ES, en: EN };

/**
 * Traducción en tiempo de ejecución.
 *
 * No usa `@angular/localize`, que compila un paquete por idioma: aquí el
 * idioma se cambia desde Ajustes sin recargar, y para eso hace falta que el
 * diccionario sea un dato y no una constante horneada en el build.
 *
 * La traducción se consume llamando `i18n.t('clave')` en la plantilla y no con
 * un pipe: un pipe puro no se recalcularía al cambiar el idioma, y uno impuro
 * se ejecutaría en cada ciclo de detección. El método lee el signal del
 * idioma, así que la vista se actualiza sola y solo cuando toca.
 */
@Service()
export class I18nStore {
  private readonly store = inject(PersistentState);

  readonly locale = this.store.signal<Locale>('locale', detectLocale());
  readonly locales = LOCALES;

  private readonly dictionary = computed(() => DICTIONARIES[this.locale()]);

  constructor() {
    // El idioma del documento importa para los lectores de pantalla y para la
    // separación silábica del navegador.
    effect(() => {
      if (typeof document !== 'undefined') document.documentElement.lang = this.locale();
    });
  }

  /** Clave ausente en el idioma activo → español, nunca la clave en crudo. */
  t(key: MessageKey): string {
    return this.dictionary()[key] ?? ES[key];
  }
}

/**
 * Idioma inicial cuando no hay preferencia guardada.
 *
 * Comprueba `window` y no `navigator`: Node expone un `navigator` global desde
 * la v21, así que el prerender habría tomado el idioma del proceso servidor en
 * lugar del de nadie. Las páginas prerenderizadas salen en español —el idioma
 * base— y el cliente aplica la preferencia real al hidratar.
 */
function detectLocale(): Locale {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'es';
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}
