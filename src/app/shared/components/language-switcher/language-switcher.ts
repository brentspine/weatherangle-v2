import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Language } from '../../../core/i18n/translations';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);

  protected setLanguage(lang: Language): void {
    this.i18n.setLanguage(lang);
  }
}
