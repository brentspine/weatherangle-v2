import { Pipe, PipeTransform } from '@angular/core';

export type MetricUnit = 'time' | 'durationSeconds' | 'kmh' | 'mm' | 'percent' | 'index' | 'celsius';

@Pipe({ name: 'metricValue' })
export class MetricValuePipe implements PipeTransform {
  transform(value: number | string | Date | undefined, unit: MetricUnit): string {
    if (value === undefined || value === null) {
      return '–';
    }

    switch (unit) {
      case 'time':
        return this.formatTime(new Date(value));
      case 'durationSeconds':
        return this.formatDuration(Number(value));
      case 'kmh':
        return `${this.round(value)} km/h`;
      case 'mm':
        return `${this.round(value)} mm`;
      case 'percent':
        return `${this.round(value)} %`;
      case 'celsius':
        return `${value}°`;
      case 'index':
        return `${this.round(value)}`;
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatDuration(seconds: number): string {
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  private round(value: number | string | Date): number {
    return Math.round(Number(value));
  }
}
