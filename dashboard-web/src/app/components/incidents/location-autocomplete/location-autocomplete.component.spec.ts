import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { LocationSearchService } from '../../../services/incidents/location-search.service';
import { LocationAutocompleteComponent } from './location-autocomplete.component';

describe('LocationAutocompleteComponent', () => {
  let fixture: ComponentFixture<LocationAutocompleteComponent>;
  let control: FormControl<string>;
  let locationSearch: { search: jest.Mock };
  const suggestions = [
    {
      label: 'Main Street, Krakow, Poland',
      latitude: 50.0614,
      longitude: 19.9366,
    },
  ];

  beforeEach(async () => {
    control = new FormControl('', { nonNullable: true });
    locationSearch = { search: jest.fn().mockReturnValue(of(suggestions)) };

    await TestBed.configureTestingModule({
      imports: [
        LocationAutocompleteComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { incidents: { location: 'Location' } } },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        { provide: LocationSearchService, useValue: locationSearch },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationAutocompleteComponent);
    fixture.componentRef.setInput('control', control);
    fixture.detectChanges();
  });

  it('searches after the user enters at least three characters', async () => {
    control.setValue('Main Street');

    await new Promise((resolve) => setTimeout(resolve, 350));
    fixture.detectChanges();

    expect(locationSearch.search).toHaveBeenCalledWith('Main Street');
    expect(fixture.componentInstance.suggestions()).toEqual(suggestions);
  });

  it('applies the selected address to the form and emits its coordinates', () => {
    const selected = jest.fn();
    fixture.componentInstance.selected.subscribe(selected);

    fixture.componentInstance.choose(suggestions[0]);

    expect(control.value).toBe(suggestions[0].label);
    expect(selected).toHaveBeenCalledWith(suggestions[0]);
    expect(fixture.componentInstance.suggestions()).toEqual([]);
  });
});
