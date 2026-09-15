import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideRouter } from '@angular/router';
import { CommonHeader } from './common-header';

describe('CommonHeader', () => {
  let component: CommonHeader;
  let fixture: ComponentFixture<CommonHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonHeader,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {},
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
