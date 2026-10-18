/**
 * Preparación común de las pruebas.
 *
 * 1. Los stores persisten en `localStorage`, que en jsdom vive durante todo el
 *    fichero: sin limpiarlo, un test heredaría los «me gusta» del anterior y
 *    los fallos aparecerían según el orden de ejecución.
 * 2. El idioma se fija a español. `I18nStore` lo deduce de `navigator.language`
 *    cuando no hay preferencia guardada, y jsdom se identifica como `en-US`:
 *    sin fijarlo, las aserciones sobre texto dependerían del locale de la
 *    máquina que ejecuta las pruebas.
 */
beforeEach(() => {
  try {
    localStorage.clear();
    localStorage.setItem('yaph:v1:locale', JSON.stringify('es'));
  } catch {
    // Sin almacenamiento no hay nada que preparar.
  }
});
