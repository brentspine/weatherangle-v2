import { WeekdayAbbrevPipe } from './weekday-abbrev.pipe';

describe('WeekdayAbbrevPipe', () => {
  const pipe = new WeekdayAbbrevPipe();

  it('formats a Date to a 2-letter German weekday abbreviation', () => {
    // 2026-07-13 ist ein Montag
    expect(pipe.transform(new Date('2026-07-13T12:00:00'))).toBe('Mo');
  });

  it('accepts an ISO date string', () => {
    expect(pipe.transform('2026-07-14T12:00:00')).toBe('Di');
  });
});
