import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DailyWeather } from '../../../core/models/weather.models';
import { DayMonthPipe } from '../../pipes/day-month.pipe';
import { WeatherIconUrlPipe } from '../../pipes/weather-icon-url.pipe';
import { WeekdayAbbrevPipe } from '../../pipes/weekday-abbrev.pipe';

const CARD_WIDTH_PX = 120;
const CARD_GAP_PX = 12;
const DAY_STEP = 3;

@Component({
  selector: 'app-day-nav',
  imports: [WeekdayAbbrevPipe, DayMonthPipe, WeatherIconUrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-nav.html',
  styleUrl: './day-nav.scss',
})
export class DayNav {
  readonly days = input<DailyWeather[]>([]);
  readonly selectedIndex = input(0);

  readonly daySelected = output<number>();

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportWidth = signal(0);

  protected readonly startIndex = signal(0);
  private readonly cardStep = CARD_WIDTH_PX + CARD_GAP_PX;

  // Wie viele Karten gleichzeitig sichtbar sind
  private readonly visibleCount = computed(() =>
    Math.max(1, Math.floor((this.viewportWidth() + CARD_GAP_PX) / (CARD_WIDTH_PX + CARD_GAP_PX))),
  );

  private readonly maxStartIndex = computed(() =>
    Math.max(0, this.days().length - this.visibleCount()),
  );

  protected readonly canGoPrev = computed(() => this.startIndex() > 0);
  protected readonly canGoNext = computed(() => this.startIndex() < this.maxStartIndex() && this.startIndex() * (this.cardStep) < this.viewportWidth() * (this.maxStartIndex() - this.startIndex()));

  protected readonly trackTransform = computed(
    () => {
      let transformX = this.startIndex() * (this.cardStep);
      if(!this.canGoNext) {
        transformX = this.maxStartIndex() * (CARD_WIDTH_PX + CARD_GAP_PX) - this.viewportWidth();
      }
      return "translateX(-" + transformX + "px)";
    }
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.viewport()?.nativeElement;
      if (!element) return;

      const observer = new ResizeObserver(([entry]) => {
        this.viewportWidth.set(entry.contentRect.width);
      });
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    effect(() => {
      const max = this.maxStartIndex();
      if (this.startIndex() > max) {
        this.startIndex.set(max);
      }
    });
  }

  protected goPrev(): void {
    this.startIndex.update((i) => Math.max(0, i - DAY_STEP));
  }

  protected goNext(): void {
    this.startIndex.update((i) => Math.min(this.maxStartIndex(), i + DAY_STEP));
  }

  protected selectDay(index: number): void {
    this.daySelected.emit(index);
  }
}
