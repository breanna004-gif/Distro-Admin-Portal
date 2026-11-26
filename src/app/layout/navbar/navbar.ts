import {
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, interval, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationsService } from '../../services/notifications';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  profileMenuOpen = false;
  isDarkMode = false;
  unreadNotificationCount: number | null = null;

  constructor() {
    this.isDarkMode = this.themeService.isDarkMode();
  }

  ngOnInit(): void {
    this.notificationsService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => {
        this.unreadNotificationCount = count;
      });

    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.notificationsService.refreshUnreadCount().pipe(
            catchError(error => {
              console.error('Failed to refresh notification count:', error);
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

 logout(): void {
  this.closeProfileMenu();
  this.authService.logout();
}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.profile-wrapper')) {
      this.profileMenuOpen = false;
    }
  }
}
