import { Pipe, PipeTransform } from '@angular/core';
import { formatClock, formatCompact, formatDelta, formatPercent } from '../core/util/format';

/**
 * Pipes puros para las métricas del HUD. Angular los memoiza por argumento, así
 * que el formateo no se recalcula en cada ciclo de detección de cambios.
 */

@Pipe({ name: 'compact' })
export class CompactPipe implements PipeTransform {
  transform(value: number): string {
    return formatCompact(value);
  }
}

@Pipe({ name: 'clock' })
export class ClockPipe implements PipeTransform {
  transform(seconds: number): string {
    return formatClock(seconds);
  }
}

@Pipe({ name: 'delta' })
export class DeltaPipe implements PipeTransform {
  transform(percent: number): string {
    return formatDelta(percent);
  }
}

@Pipe({ name: 'pct' })
export class PercentRatioPipe implements PipeTransform {
  transform(ratio: number): string {
    return formatPercent(ratio);
  }
}
