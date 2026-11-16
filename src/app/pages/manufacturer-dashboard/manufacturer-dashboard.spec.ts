import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ManufacturerDashboard } from './manufacturer-dashboard';

describe('ManufacturerDashboard', () => {
  let component: ManufacturerDashboard;
  let fixture: ComponentFixture<ManufacturerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManufacturerDashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ManufacturerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
