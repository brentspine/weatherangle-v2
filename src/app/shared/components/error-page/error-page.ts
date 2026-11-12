import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationKey } from '../../../core/i18n/translations';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface ErrorInfo {
  titleKey: TranslationKey;
  textKey: TranslationKey;
}

const ERROR_MAP: Record<number, ErrorInfo> = {
  404: { titleKey: 'error.404.title', textKey: 'error.404.text' },
  503: { titleKey: 'error.503.title', textKey: 'error.503.text' },
};

@Component({
  selector: 'app-error-page',
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage {
  readonly statusCode = input<number>(404);

  protected readonly i18n = inject(I18nService);

  protected readonly info = computed<ErrorInfo>(() => {
    return ERROR_MAP[this.statusCode()] ?? { titleKey: 'error.generic.title', textKey: 'error.generic.text' };
  });

  protected readonly imageUrl = computed(() => `/http_dogs/${this.statusCode()}.avif`);
}
