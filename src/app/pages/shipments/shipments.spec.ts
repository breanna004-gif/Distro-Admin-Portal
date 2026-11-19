import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Shipments } from './shipments';
import { OrganizationService } from '../../services/organization';
import { ShipmentManagementService } from '../../services/shipment-management.service';

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

  it('updates shipment status locally without calling the backend', () => {
    const shipment = {
      id: 'shipment-1',
      referenceNumber: 'SHP-001',
      status: 'READY'
    } as Shipments['shipments'][number];
    component.shipments = [shipment];
    component.selectedShipment = shipment;

    component.changeStatus(shipment, 'DISPATCHED');

    expect(component.shipments[0].status).toBe('DISPATCHED');
    expect(component.selectedShipment?.status).toBe('DISPATCHED');
    expect(component.errorMessage).toBe('');
    expect(shipmentService.updateShipmentStatus).not.toHaveBeenCalled();
  });
});
