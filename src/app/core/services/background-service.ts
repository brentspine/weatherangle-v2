import {Injectable, signal} from '@angular/core';

export interface BackgroundInfo {
  imageUrl: string;
  authorName: string;
  authorLink: string;
  weatherDescription?: WeatherDescription;
}

export interface WeatherDescription {
  season?: Season;
  isSunny?: boolean;
  isRainy?: boolean;
  isFoggy?: boolean;
  isSnowy?: boolean;
  timePeriodOfDay?: TimePeriodOfDay
}

export enum TimePeriodOfDay {
  sunrise = 'sunrise',
  morning = 'morning',
  noon = 'noon',
  evening = 'evening',
  sunset = 'sunset',
  night = 'night'
}

export enum Season {
  winter = 'winter',
  spring = 'spring',
  summer = 'summer',
  autumn = "autumn"
}

export enum ColorFamily {
  blue = 'blue',
  green = 'green',
  yellow = 'yellow',
  black = 'black',
  white = 'white',
  purple = 'purple'
}

@Injectable({
  providedIn: 'root',
})
export class BackgroundService {

  private readonly ALL_BACKGROUNDS: BackgroundInfo[] = [
    {
      imageUrl: "/images/bg/mainbg_chicago_at_night_2k.jpg",
      authorName: "Burst - Pexels",
      authorLink: "https://www.pexels.com/photo/gray-high-rise-building-at-night-373893/",
      weatherDescription: {
        isSunny: false,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.night
      }
    },
    {
      imageUrl: "/images/bg/mainbg_fischerinsel_berlin_2k.jpg",
      authorName: "abbilder - flickr",
      authorLink: "https://www.flickr.com/people/21617436@N00",
      weatherDescription: {
        isSunny: true,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.evening
      }
    },
    {
      imageUrl: "/images/bg/mainbg_foggy_city_2k.jpg",
      authorName: "Future_SAKMei - Pixabay",
      authorLink: "https://pixabay.com/photos/fog-cloudy-day-building-city-7889146/",
      weatherDescription: {
        isSunny: false,
        isRainy: false,
        isFoggy: true,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.noon
      }
    },
    {
      imageUrl: "/images/bg/mainbg_frankfurt_skyline_2k.jpg",
      authorName: "Philippsaal - Pixabay",
      authorLink: "https://pixabay.com/de/photos/frankfurt-city-skyline-3917054/",
      weatherDescription: {
        isSunny: false,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.night
      }
    },
    {
      imageUrl: "/images/bg/mainbg_london_pickle_skyline_2k.jpg",
      authorName: "kloniwotski - flickr",
      authorLink: "https://www.flickr.com/photos/kloniwotski/11517125946/",
      weatherDescription: {
        isSunny: true,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.morning
      }
    },
    {
      imageUrl: "/images/bg/mainbg_pixlr_rainy_day_city_1k.jpg",
      authorName: "Luca via Pixlr (AI)",
      authorLink: "https://pixlr.com/de/",
      weatherDescription: {
        isSunny: false,
        isRainy: true,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.evening
      }
    },
    {
      imageUrl: "/images/bg/mainbg_rvwiesbaden1_2k.jpg",
      authorName: "BESCO: Berliner Steincontor",
      authorLink: "https://besco-gmbh.de/en/projekt/wiesbaden-vorplatz-der-rv-versicherung/",
      weatherDescription: {
        isSunny: true,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.noon
      }
    },
    {
      imageUrl: "/images/bg/mainbg_shanghai_skyline_2k.jpg",
      authorName: "Adi Constantin",
      authorLink: "https://sc.wikipedia.org/wiki/File:Shanghai_skyline_unsplash.jpg",
      weatherDescription: {
        isSunny: false,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.sunset
      }
    },
    {
      imageUrl: "/images/bg/mainbg_sunset_5k.jpg",
      authorName: "Myriams-Fotos - Pixabay",
      authorLink: "https://pixabay.com/de/photos/sonnenaufgang-sonne-morgenrot-1513802/",
      weatherDescription: {
        isSunny: true,
        isRainy: false,
        isFoggy: false,
        isSnowy: false,
        timePeriodOfDay: TimePeriodOfDay.sunrise
      }
    }
  ];

  private readonly defaultBackground: BackgroundInfo = this.ALL_BACKGROUNDS[3];
  private readonly authBackground: BackgroundInfo = this.ALL_BACKGROUNDS[8];

  readonly currentBackground = signal<BackgroundInfo>(this.defaultBackground);

  updateBackgroundByWeather(currentWeather: WeatherDescription) {
    let bestMatch: BackgroundInfo = this.ALL_BACKGROUNDS[0];
    let highestScore = -1;

    for (const bg of this.ALL_BACKGROUNDS) {
      if (!bg.weatherDescription) continue;

      let score = 0;
      const bgWeather = bg.weatherDescription;

      if (bgWeather.season && bgWeather.season === currentWeather.season) score += 2;
      if (bgWeather.timePeriodOfDay && bgWeather.timePeriodOfDay === currentWeather.timePeriodOfDay) score += 2;

      if (bgWeather.isSunny !== undefined && bgWeather.isSunny === currentWeather.isSunny) score += 1;
      if (bgWeather.isRainy !== undefined && bgWeather.isRainy === currentWeather.isRainy) score += 1;
      if (bgWeather.isFoggy !== undefined && bgWeather.isFoggy === currentWeather.isFoggy) score += 1;
      if (bgWeather.isSnowy !== undefined && bgWeather.isSnowy === currentWeather.isSnowy) score += 1;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = bg;
      }
    }

    this.currentBackground.set(bestMatch);
  }

  // Manuelle Methode (z.B. für die Login-Seite, die immer das gleiche Bild will)
  setNewBackground(info: BackgroundInfo) {
    this.currentBackground.set(info);
  }

  setAuthBackground(): void {
    this.currentBackground.set(this.authBackground);
  }

  resetToDefault(): void {
    this.currentBackground.set(this.defaultBackground);
  }

}
