import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Notification } from '../../models/notification.model';
import { NotificationsService } from '../../services/notifications';
import { Notifications } from './notifications';

describe('Notifications', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;
  let approveAccessRequest: ReturnType<typeof vi.fn>;
  let getNotifications: ReturnType<typeof vi.fn>;
  let getAccessRequest: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getNotifications = vi.fn(() => of([]));
    getAccessRequest = vi.fn(() => of({ status: 'APPROVED' }));
    approveAccessRequest = vi.fn(() =>
      throwError(() => ({
        error: {
          message: 'Access request has already been approved'
        }
      }))
    );

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [{
        provide: NotificationsService,
        useValue: {
          approveAccessRequest,
          getNotifications,
          getAccessRequest
        }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('indicates when an access-request user has already been approved', () => {
    const notification: Notification = {
      id: 'notification-1',
      title: 'Organization access request',
      message: 'Review the submitted organization request.',
      type: 'ACCESS_REQUEST',
      priority: 'HIGH',
      status: 'UNREAD',
      referenceId: 'request-1',
      createdAt: '2026-01-01T00:00:00Z'
    };
    component.selectedNotification = notification;

    component.approveAccessRequest();

    expect(approveAccessRequest).toHaveBeenCalledWith('request-1');
    expect(component.accessRequestApproved).toBe(true);
    expect(component.actionSuccess).toBe(
      'This user has already been approved.'
    );
    expect(component.actionError).toBe('');
  });

  it('shows approval status for each already-approved access request notification', () => {
    const notifications: Notification[] = ['request-1', 'request-2'].map(
      (referenceId, index) => ({
        id: `notification-${index + 1}`,
        title: 'Organization access request',
        message: 'Review the submitted organization request.',
        type: 'ACCESS_REQUEST',
        priority: 'HIGH',
        status: 'READ',
        referenceId,
        createdAt: '2026-01-01T00:00:00Z'
      })
    );
    getNotifications.mockReturnValue(of(notifications));

    fixture.detectChanges();

    expect(getAccessRequest).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelectorAll('.approved-label')
    ).toHaveLength(2);
  });
});
