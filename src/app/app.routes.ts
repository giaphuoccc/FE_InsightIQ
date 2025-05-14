import { Routes } from '@angular/router';
//import { AuthGuard } from './core/auth.guard';

import { LoginComponent } from './components/authentication/login/login.component';
import { RegisterComponent } from './components/authentication/register/register.component';

import { MainSuperadminDashboardComponent } from './components/superadmin/dashboard-superadmin/main-superadmin-dashboard.component';
import { ProfileComponent } from './components/superadmin/profile/profile.component';
import { EditProfileComponent } from './components/superadmin/editProfile/editProfile.component'

import { PendingTenantComponent } from './components/superadmin/pendingTenant/pendingTenant.component';
import { PendingTenantDetailsComponent } from './components/superadmin/pendingTenantDetails/pendingTenantDetails.component';

import { WidgetUserComponent } from './components/widget-user/widget-user.component';

import { MainTenantDashboardComponent } from './components/tenant/component/dashboard-tenant/main-tenant-dashboard.component';
import { TenantAccountListComponent } from './components/superadmin/tenantAccountList/tenantAccountList.component';

//import { TenantManagementComponent } from './components/tenant/component/profile/edit-profile/TenantManagementComponent/tenant-management.component';
import { ReportManagementComponent } from './shared/reports/report-management/reportManagement.component';

import { CommentDetailComponent } from './shared/reports/comment-detail/comment-detail.component';
import { PaymentComponent } from './components/tenant/component/payment/payment.component';
import { ChangePlanComponent } from './components/tenant/component/plan/change-plan.component';
import { SubscriptionManagementComponent } from './components/tenant/component/subscription/subscription-management/subscription-management.component';
import { BillingHistoryComponent } from './components/tenant/component/billing/billing-history/billing-history.component';
import { BillingHistoryDetailComponent } from './components/tenant/component/billing/billing-history-detail/billing-history-detail.component';
import { DocumentManagementComponent } from './components/tenant/component/document-management/document-management.component';


export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  //SA Profile Section
  { path: 'dashboard_superadmin', component: MainSuperadminDashboardComponent,
    //canActivate: [AuthGuard]
  },
  { path: 'profile', component: ProfileComponent, 
    //canActivate: [AuthGuard]
  },
  { path: 'edit-profile', component: EditProfileComponent, 
    //canActivate: [AuthGuard]
  },

  // PENDING TENANT SECTION
  { path: 'pendingtenant', component: PendingTenantComponent, 
    //canActivate: [AuthGuard]
  },

  { path: 'pendingtenant/:id', component: PendingTenantDetailsComponent,
    //canActivate: [AuthGuard]
  },

  // TENANT SECTION
  {path: 'dashboard_tenant', component: MainTenantDashboardComponent,
    //canActivate: [AuthGuard]
  },

  // TENANT MANAGEMENT
  { path: 'tenant-management', component: TenantAccountListComponent },
  //{ path: 'management', component: TenantAccountListComponent},


  // BILLING SECTION (Tenant)
  {
    path: 'billing', component: SubscriptionManagementComponent,
    //canActivate: [AuthGuard]
  },

  {
    path: 'billing/plans', component: ChangePlanComponent,
    //canActivate: [AuthGuard]
  },

  {
    path: 'billing/pay/:planId', component: PaymentComponent,
    //canActivate: [AuthGuard]
  },

  {
    path: 'billing/pay-invoice', component: PaymentComponent,
    //canActivate: [AuthGuard]
  },

  { path: 'billing/history', component: BillingHistoryComponent, 
    //canActivate: [AuthGuard]
  },

  {
    path: 'billing/history/:invoiceId', component: BillingHistoryDetailComponent,
    //canActivate: [AuthGuard]
  },


  // REPORTING SECTION
  { path: 'viewreport', component: ReportManagementComponent },
  { path: 'report-conversation/:id', component: CommentDetailComponent },




  // WIDGET
  { path: 'widget-user', component: WidgetUserComponent },


  

  { path: 'document', component: DocumentManagementComponent,
    //canActivate: [AuthGuard]
  },


  // --- End of added routes ---

  // Optional: Add fallback route
  // { path: '**', redirectTo: '/login' }

    // DOCUMENT

];
