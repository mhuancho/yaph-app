/**
 * Preparación común de las pruebas.
 *
 * Los stores persisten en `localStorage`, que en jsdom vive durante todo el
 * fichero: sin limpiarlo, un test heredaría los «me gusta» del anterior y los
 * fallos aparecerían según el orden de ejecución.
 */
beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    // Sin almacenamiento no hay nada que limpiar.
  }
});
