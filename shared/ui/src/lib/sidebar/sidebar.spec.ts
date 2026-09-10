import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the collapsed state', () => {
    expect(component.expanded).toBe(true);

    component.toggle();
    expect(component.expanded).toBe(false);

    component.toggle();
    expect(component.expanded).toBe(true);
  });

  it('should emit a logout request', () => {
    const logoutSpy = jest.fn();
    component.logoutRequested.subscribe(logoutSpy);

    component.logout();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
