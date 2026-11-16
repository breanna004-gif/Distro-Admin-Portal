import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedLoads } from './shared-loads';

describe('SharedLoads', () => {
  let component: SharedLoads;
  let fixture: ComponentFixture<SharedLoads>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedLoads],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedLoads);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
