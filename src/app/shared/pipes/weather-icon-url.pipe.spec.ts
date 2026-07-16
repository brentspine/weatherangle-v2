import { WeatherIconUrlPipe } from './weather-icon-url.pipe';

describe('WeatherIconUrlPipe', () => {
  const pipe = new WeatherIconUrlPipe();

  it('builds a day icon url', () => {
    expect(pipe.transform(3, true)).toBe('/images/wc/weathercode_3.png');
  });

  it('appends _night only for codes with a night variant', () => {
    expect(pipe.transform(1, false)).toBe('/images/wc/weathercode_1_night.png');
  });

  it('does not append _night for codes without a night variant', () => {
    expect(pipe.transform(61, false)).toBe('/images/wc/weathercode_61.png');
  });

  it('defaults isDay to true', () => {
    expect(pipe.transform(2)).toBe('/images/wc/weathercode_2.png');
  });
});
