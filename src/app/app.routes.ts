import { Routes } from '@angular/router';

import { TripManagement } from './pages/trip-management/trip-management';
import { SharedLoads } from './pages/shared-loads/shared-loads';
import { Shipments } from './pages/shipments/shipments';
import { FleetManagement } from './pages/fleet-management/fleet-management';
import { Drivers } from './pages/drivers/drivers';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { Users } from './pages/users/users';
import { Organizations } from './pages/organizations/organizations';
import { Products } from './pages/products/products';
import { ProductCategories } from './pages/product-categories/product-categories';
import { Inventory } from './pages/inventory/inventory';
import { Orders } from './pages/orders/orders';
import { Deliveries } from './pages/deliveries/deliveries';
import { Payments } from './pages/payments/payments';
import { Notifications } from './pages/notifications/notifications';
import { Reports } from './pages/reports/reports';
import { AuditLogs } from './pages/audit-logs/audit-logs';
import { Settings } from './pages/settings/settings';
import { InviteUser } from './pages/invite-user/invite-user';
import { authGuard } from './guards/auth-guard';
import { ManufacturerDashboard } from './pages/manufacturer-dashboard/manufacturer-dashboard';
import { DistributorDashboard } from './pages/distributor-dashboard/distributor-dashboard';
import {
  distributorDashboardGuard,
  manufacturerDashboardGuard,
  organizationManagementGuard,
  userManagementGuard
} from './guards/organization-role.guard';

export const routes: Routes = [

  // =========================
  // LOGIN
  // =========================

  {
    path: 'login',
    component: Login
  },

  // =========================
  // SIGN UP
  // =========================

  {
    path: 'signup',
    component: Signup
  },

  // =========================
  // ADMIN PORTAL
  // =========================

  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: Dashboard
      },

     {
  path: 'admin/dashboard',
  redirectTo: 'dashboard',
  pathMatch: 'full'
},

      {
        path: 'users/invite',
        component: InviteUser,
        canActivate: [userManagementGuard]
      },

      {
        path: 'invite-user',
        component: InviteUser,
        canActivate: [userManagementGuard]
      },

      {
        path: 'users',
        component: Users,
        canActivate: [userManagementGuard]
      },

      {
        path: 'manufacturers',
        component: Organizations,
        canActivate: [organizationManagementGuard],
        data: { organizationType: 'MANUFACTURER' }
      },

      {
        path: 'distributors',
        component: Organizations,
        canActivate: [organizationManagementGuard],
        data: { organizationType: 'DISTRIBUTOR' }
      },

      {
        path: 'manufacturer/dashboard',
        component: ManufacturerDashboard,
        canActivate: [manufacturerDashboardGuard]
      },

      {
        path: 'distributor/dashboard',
        component: DistributorDashboard,
        canActivate: [distributorDashboardGuard]
      },

      {
        path: 'products',
        component: Products
      },

      {
        path: 'product-categories',
        component: ProductCategories,
        canActivate: [organizationManagementGuard]
      },

      {
        path: 'inventory',
        component: Inventory
      },

      {
        path: 'orders',
        component: Orders
      },

      {
  path: 'fleet',
  component: FleetManagement
},

      {
  path: 'drivers',
  component: Drivers
},
      {
        path: 'deliveries',
        component: Deliveries
      },

      {
  path: 'shipments',
  component: Shipments
},

{
  path: 'shared-loads',
  component: SharedLoads
},

{
  path: 'trips',
  component: TripManagement
},
      {
        path: 'payments',
        component: Payments
      },

      {
        path: 'notifications',
        component: Notifications
      },

      {
        path: 'reports',
        component: Reports
      },

      {
        path: 'audit-logs',
        component: AuditLogs
      },

      {
        path: 'settings',
        component: Settings
      }

          ]
  },

{
  path: 'verification',
  loadComponent: () =>
    import('./pages/verification/verification')
      .then(m => m.Verification)
},

  // =========================
  // UNKNOWN ROUTES
  // =========================

  {
    path: '**',
    redirectTo: 'login'
  }

];
