export interface Delivery {

  id: string;

  orderId: string;

  customerName: string;

  customerPhone?: string;

  deliveryAddress: string;

  driverName?: string;

  driverId?: string;

  vehicleNumber?: string;

  status:
    | 'PENDING'
    | 'ASSIGNED'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'FAILED'
    | 'CANCELLED';

  estimatedDelivery?: string;

  deliveredAt?: string;

  createdAt?: string;

  updatedAt?: string;

  trackingStatus?: string;

  currentLocation?: string;

}
