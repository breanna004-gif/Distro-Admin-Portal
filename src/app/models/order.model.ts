export interface Order {

  id: string;

  orderNumber?: string;

  customerName: string;

  customerEmail?: string;

  organizationName?: string;

  organizationId?: string;

  totalAmount: number;

  itemCount: number;

  orderDate: string;

  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';

  paymentStatus:
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED';

  deliveryStatus:
    | 'PENDING'
    | 'ASSIGNED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'FAILED';

  deliveryAddress?: string;

  createdAt?: string;

  updatedAt?: string;
}
