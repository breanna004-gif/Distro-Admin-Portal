export interface Payment {

  id: string;

  orderId: string;

  customerName: string;

  organizationName?: string;

  amount: number;

  currency: string;

  method:
    | 'MPESA'
    | 'CARD'
    | 'BANK_TRANSFER'
    | 'CASH'
    | 'OTHER';

  status:
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED'
    | 'CANCELLED';

  transactionReference?: string;

  paymentDate?: string;

  createdAt?: string;

  updatedAt?: string;

  failureReason?: string;

}
