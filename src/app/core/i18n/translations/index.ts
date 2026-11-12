import { DE_TRANSLATIONS } from './de';
import { EN_TRANSLATIONS, TranslationKey } from './en';

export type { TranslationKey };
export type Language = 'en' | 'de';

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = {
  en: EN_TRANSLATIONS,
  de: DE_TRANSLATIONS,
};
