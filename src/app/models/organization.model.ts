export interface Organization {

  id: string;

  name: string;

  type:
    | 'MANUFACTURER'
    | 'DISTRIBUTOR'
    | 'LOGISTICS'
    | 'RETAILER'
    | 'OTHER';

  email?: string;

  phone?: string;

  address?: string;

  location?: string;

  city?: string;

  country?: string;

  userCount?: number;

  productCount?: number;

  inventoryCount?: number;

  status:
    | 'ACTIVE'
    | 'INACTIVE'
    | 'PENDING'
    | 'SUSPENDED';

  createdAt?: string;

  updatedAt?: string;

}
