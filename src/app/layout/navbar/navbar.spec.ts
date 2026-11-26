import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../services/auth';
import { NotificationsService } from '../../services/notifications';
import { ThemeService } from '../../services/theme';
import { Navbar } from './navbar';

describe('Navbar', () => {
  it('shows the unread notification count on the bell', async () => {
    const unreadCount = new BehaviorSubject<number | null>(null);

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { logout: vi.fn() }
        },
        {
          provide: ThemeService,
          useValue: {
            isDarkMode: () => false,
            toggleTheme: vi.fn()
          }
        },
        {
          provide: NotificationsService,
          useValue: {
            unreadCount$: unreadCount.asObservable(),
            refreshUnreadCount: vi.fn(() => {
              unreadCount.next(4);
              return of(4);
            })
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.notification-badge')
        ?.textContent.trim()
    ).toBe('4');

    fixture.destroy();
  });
});
