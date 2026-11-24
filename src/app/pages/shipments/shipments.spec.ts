import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Shipments } from './shipments';
import { OrganizationService } from '../../services/organization';
import { ShipmentManagementService } from '../../services/shipment-management.service';
import { AuthService } from '../../services/auth';

describe('Shipments', () => {
  let component: Shipments;
  let fixture: ComponentFixture<Shipments>;
  let shipmentService: {
    getShipments: ReturnType<typeof vi.fn>;
    getCargoCategories: ReturnType<typeof vi.fn>;
    getHandlingRequirements: ReturnType<typeof vi.fn>;
    updateShipmentStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    shipmentService = {
      getShipments: vi.fn().mockReturnValue(of([])),
      getCargoCategories: vi.fn().mockReturnValue([]),
      getHandlingRequirements: vi.fn().mockReturnValue([]),
      updateShipmentStatus: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Shipments],
      providers: [
        { provide: ShipmentManagementService, useValue: shipmentService },
        {
          provide: OrganizationService,
          useValue: { getBusinessOrganizations: vi.fn().mockReturnValue(of([])) }
        },
        {
          provide: AuthService,
          useValue: {
            isPlatformAdmin: () => true,
            isOrganizationAdmin: () => false
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Shipments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends a status update to the server', () => {
    const shipment = {
      id: 'shipment-1',
      referenceNumber: 'SHP-001',
      status: 'READY'
    } as Shipments['shipments'][number];
    shipmentService.updateShipmentStatus.mockReturnValue(of({
      ...shipment,
      status: 'CANCELLED'
    }));
    component.shipments = [shipment];
    component.selectedShipment = shipment;

    component.changeStatus(shipment, 'CANCELLED');

    expect(shipmentService.updateShipmentStatus).toHaveBeenCalledWith('shipment-1', 'CANCELLED');
  });
});
