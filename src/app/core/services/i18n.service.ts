import { Injectable, signal } from '@angular/core';
import { Language, TRANSLATIONS, TranslationKey } from '../i18n/translations';

const STORAGE_KEY = 'wa_lang';

function detectLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'de' || stored === 'en') {
    return stored;
  }
  return navigator.language.startsWith('de') ? 'de' : 'en';
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly currentLang = signal<Language>(detectLanguage());

  translate(key: TranslationKey): string {
    return TRANSLATIONS[this.currentLang()][key] ?? key;
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }
}
