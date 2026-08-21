import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommonHeader } from './common-header';

describe('CommonHeader', () => {
  let component: CommonHeader;
  let fixture: ComponentFixture<CommonHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonHeader],
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
