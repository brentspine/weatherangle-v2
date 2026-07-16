import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MetricUnit, MetricValuePipe } from '../../pipes/metric-value.pipe';

export interface MetricItem {
  icon: string;
  value: number | string | Date | undefined;
  unit: MetricUnit;
  label: string;
}

@Component({
  selector: 'app-metric-grid',
  imports: [MetricValuePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metric-grid.html',
  styleUrl: './metric-grid.scss',
})
export class MetricGrid {
  readonly metrics = input<MetricItem[]>([]);
}
