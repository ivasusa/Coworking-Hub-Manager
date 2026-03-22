import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ManagerReservationsComponent } from './reservations';

describe('ManagerReservationsComponent', () => {
  let component: ManagerReservationsComponent;
  let fixture: ComponentFixture<ManagerReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerReservationsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagerReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
