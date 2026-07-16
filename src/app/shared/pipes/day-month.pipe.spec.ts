import { DayMonthPipe } from './day-month.pipe';

describe('DayMonthPipe', () => {
  const pipe = new DayMonthPipe();

  it('zero-pads day and month without a year', () => {
    expect(pipe.transform(new Date('2026-04-09T00:00:00'))).toBe('09.04');
  });

  it('accepts an ISO date string', () => {
    expect(pipe.transform('2026-12-01T00:00:00')).toBe('01.12');
  });
});
