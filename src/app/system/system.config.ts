import { SystemModule } from './system.models';
import { environment } from '../../environments/environment';

export const API_BASE_URL = environment.apiUrl;
export const USE_API_PROXY = !environment.production;


export const SYSTEM_MODULES: Record<string, SystemModule> = {

  auth: {
    key: 'auth',
    name: 'Authentication',
    status: 'CONNECTED',

    frontend: true,
    backend: true,

    route: '/login',
    endpoint: '/auth',

    dependsOn: [],
    usedBy: [
      'users',
      'invitations',
      'organizations',
      'products',
      'inventory',
      'orders',
      'payments',
      'deliveries'
    ]
  },


  users: {
    key: 'users',
    name: 'Users',
    status: 'IN_PROGRESS',

    frontend: true,
    backend: true,

    route: '/users',
    endpoint: '/users',

    dependsOn: [
      'auth',
      'organizations'
    ],

    usedBy: [
      'invitations',
      'organizations',
      'auditLogs'
    ]
  },


  invitations: {
    key: 'invitations',
    name: 'Invitations',
    status: 'CONNECTED',

    frontend: true,
    backend: true,

    route: '/invite-user',
    endpoint: '/invitations',

    dependsOn: [
      'auth',
      'users',
      'organizations'
    ],

    usedBy: [
      'users'
    ]
  },


  organizations: {
    key: 'organizations',
    name: 'Organizations',
    status: 'IN_PROGRESS',

    frontend: false,
    backend: false,

    route: '/organizations',
    endpoint: '/organizations',

    dependsOn: [
      'auth'
    ],

    usedBy: [
      'users',
      'invitations',
      'products',
      'inventory',
      'orders',
      'payments',
      'deliveries'
    ]
  },


  products: {
    key: 'products',
    name: 'Products',
    status: 'IN_PROGRESS',

    frontend: true,
    backend: true,

    route: '/products',
    endpoint: '/products',

    dependsOn: [
      'auth',
      'organizations'
    ],

    usedBy: [
      'inventory',
      'orders'
    ]
  },


  inventory: {
    key: 'inventory',
    name: 'Inventory',
    status: 'IN_PROGRESS',

    frontend: true,
    backend: true,

    route: '/inventory',
    endpoint: '/inventory',

    dependsOn: [
      'auth',
      'organizations',
      'products'
    ],

    usedBy: [
      'orders'
    ]
  },


  orders: {
    key: 'orders',
    name: 'Orders',
    status: 'PLANNED',

    frontend: false,
    backend: true,

    route: '/orders',
    endpoint: '/orders',

    dependsOn: [
      'auth',
      'organizations',
      'products',
      'inventory'
    ],

    usedBy: [
      'payments',
      'deliveries'
    ]
  },


  payments: {
    key: 'payments',
    name: 'Payments',
    status: 'IN_PROGRESS',

    frontend: true,
    backend: true,

    route: '/payments',
    endpoint: '/payments',

    dependsOn: [
      'auth',
      'organizations',
      'orders'
    ],

    usedBy: [
      'orders',
      'reports'
    ]
  },


  deliveries: {
    key: 'deliveries',
    name: 'Deliveries',
    status: 'IN_PROGRESS',

    frontend: true,
    backend: true,

    route: '/deliveries',
    endpoint: '/deliveries',

    dependsOn: [
      'auth',
      'organizations',
      'orders'
    ],

    usedBy: [
      'orders',
      'notifications'
    ]
  },


  notifications: {
    key: 'notifications',
    name: 'Notifications',
    status: 'PLANNED',

    frontend: false,
    backend: false,

    route: '/notifications',
    endpoint: '/notifications',

    dependsOn: [
      'auth'
    ],

    usedBy: [
      'users',
      'orders',
      'payments',
      'deliveries',
      'invitations'
    ]
  },


  reports: {
    key: 'reports',
    name: 'Reports',
    status: 'PLANNED',

    frontend: false,
    backend: false,

    route: '/reports',
    endpoint: '/reports',

    dependsOn: [
      'auth',
      'orders',
      'payments',
      'inventory'
    ],

    usedBy: []
  },


  auditLogs: {
    key: 'auditLogs',
    name: 'Audit Logs',
    status: 'PLANNED',

    frontend: false,
    backend: true,

    route: '/audit-logs',
    endpoint: '/audit-logs',

    dependsOn: [
      'auth',
      'users'
    ],

    usedBy: []
  }
};

export const API_ENDPOINTS = {

  auth: {
    base: '/auth'
  },

  users: {
    base: '/users',
    me: '/users/me'
  },

  invitations: {
    create: '/invitations'
  },

  admin: {
    dashboard: '/admin/dashboard',
    stock: '/admin/stock'
  },

  distributor: {
    dashboard: '/distributor/dashboard',
    staff: '/distributor/staff'
  },

  organizations: {
    base: '/organizations'
  },

  products: {
    base: '/products'
  },

  inventory: {
    base: '/inventory'
  },

  orders: {
    base: '/orders'
  },

  payments: {
    base: '/payments'
  },

  deliveries: {
    base: '/deliveries'
  },

  notifications: {
    base: '/notifications'
  },

  reports: {
    base: '/reports'
  },

  auditLogs: {
    base: '/audit-logs'
  }

} as const;
