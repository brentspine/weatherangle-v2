import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationKey } from '../../core/i18n/translations';
import { I18nService } from '../../core/services/i18n.service';

@Pipe({ name: 'translate', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey): string {
    return this.i18n.translate(key);
  }
}
