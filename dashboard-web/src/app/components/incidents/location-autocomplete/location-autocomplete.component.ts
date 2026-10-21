import {
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import {
  LocationSearchService,
  LocationSuggestion,
} from '../../../services/incidents/location-search.service';

@Component({
  selector: 'app-location-autocomplete',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective],
  templateUrl: './location-autocomplete.component.html',
  styleUrl: './location-autocomplete.component.scss',
})
export class LocationAutocompleteComponent {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input('location-autocomplete-input');
  readonly selected = output<LocationSuggestion>();
  readonly queryChanged = output<void>();
  readonly suggestions = signal<LocationSuggestion[]>([]);
  readonly searching = signal(false);
  readonly searchFailed = signal(false);
  readonly focused = signal(false);

  private readonly locationSearch = inject(LocationSearchService);

  constructor() {
    effect((onCleanup) => {
      const subscription = this.control()
        .valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((query) => {
            this.searchFailed.set(false);
            const normalizedQuery = query.trim();
            if (normalizedQuery.length < 3) {
              this.suggestions.set([]);
              this.searching.set(false);
              return of([]);
            }

            this.searching.set(true);
            return this.locationSearch.search(normalizedQuery).pipe(
              catchError(() => {
                this.searchFailed.set(true);
                return of([]);
              }),
            );
          }),
        )
        .subscribe((suggestions) => {
          this.suggestions.set(suggestions);
          this.searching.set(false);
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  choose(suggestion: LocationSuggestion): void {
    this.control().setValue(suggestion.label, { emitEvent: false });
    this.suggestions.set([]);
    this.focused.set(false);
    this.selected.emit(suggestion);
  }
}
