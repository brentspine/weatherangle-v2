import { MetricValuePipe } from './metric-value.pipe';

describe('MetricValuePipe', () => {
  const pipe = new MetricValuePipe();

  it('formats a time value', () => {
    expect(pipe.transform(new Date('2026-07-13T06:05:00'), 'time')).toBe('06:05');
  });

  it('formats a duration in seconds as hours and minutes', () => {
    expect(pipe.transform(3661 * 4, 'durationSeconds')).toBe('4h 4m');
  });

  it('formats kmh, mm, percent, celsius, index units', () => {
    expect(pipe.transform(12.4, 'kmh')).toBe('12 km/h');
    expect(pipe.transform(5.6, 'mm')).toBe('6 mm');
    expect(pipe.transform(40, 'percent')).toBe('40 %');
    expect(pipe.transform(18.2, 'celsius')).toBe('18°');
    expect(pipe.transform(7, 'index')).toBe('7');
  });

  it('renders a dash for missing values', () => {
    expect(pipe.transform(undefined, 'celsius')).toBe('–');
  });
});
