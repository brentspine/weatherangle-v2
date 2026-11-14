import { computed, Injectable, signal } from '@angular/core';
import { de } from '../i18n/de';
import { en } from '../i18n/en';

export type Language = 'en' | 'de';

export type TranslationKey = keyof typeof en;
type TranslationMap = Record<TranslationKey, string>;

const translationMap: Record<Language, TranslationMap> = { en, de };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Language>(this.detectLanguage());

  readonly lang = this._lang.asReadonly();

  private readonly translations = computed<TranslationMap>(() => translationMap[this._lang()]);

  t(key: TranslationKey): string {
    return this.translations()[key];
  }

  setLanguage(lang: Language): void {
    this._lang.set(lang);
  }

  private detectLanguage(): Language {
    const browserLang = navigator.language?.split('-')[0];
    return browserLang === 'de' ? 'de' : 'en';
  }
}
