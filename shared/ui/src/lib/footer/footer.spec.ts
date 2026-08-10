import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonHeader } from './footer';

describe('CommonHeader', () => {
  let component: CommonHeader;
  let fixture: ComponentFixture<CommonHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
