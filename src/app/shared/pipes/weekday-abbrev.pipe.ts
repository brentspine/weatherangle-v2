import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'weekdayAbbrev' })
export class WeekdayAbbrevPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = new Date(value);
    return new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date).slice(0, 2);
  }
}
