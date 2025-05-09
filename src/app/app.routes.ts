import { Routes } from '@angular/router';


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

import { TenantManagementComponent } from './components/tenant/component/profile/edit-profile/TenantManagementComponent/tenant-management.component';
import { ReportManagementComponent } from './shared/reports/report-management/reportManagement.component';

import { CommentDetailComponent } from './shared/reports/comment-detail/comment-detail.component';
import { PaymentComponent } from './components/tenant/component/payment/payment.component';
import { ChangePlanComponent } from './components/tenant/component/plan/change-plan.component';
import { SubscriptionManagementComponent } from './components/tenant/component/subscription/subscription-management/subscription-management.component';
import { BillingHistoryComponent } from './components/tenant/component/billing/billing-history/billing-history.component';
import { BillingHistoryDetailComponent } from './components/tenant/component/billing/billing-history-detail/billing-history-detail.component';
import { DocumentManagementComponent } from './components/tenant/component/document-management/document-management.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  //SA Profile Section
  {path: 'dashboard_superadmin', component: MainSuperadminDashboardComponent},
  { path: 'profile', component: ProfileComponent, },
  { path: 'edit-profile', component: EditProfileComponent, },

  // PENDING TENANT SECTION
  { path: 'pendingtenant', component: PendingTenantComponent },
  { path: 'pendingtenant/:id', component: PendingTenantDetailsComponent },

  // Default Route
  // { path: '', redirectTo: '/pendingtenant', pathMatch: 'full' },

  // WIDGET
  { path: 'widget-user', component: WidgetUserComponent },

  // TENANT MANAGEMENT
  { path: 'tenant-management', component: TenantManagementComponent },
  { path: 'management', component: TenantAccountListComponent},

  // REPORTING SECTION
  { path: 'viewreport', component: ReportManagementComponent },
  { path: 'report-conversation/:id', component: CommentDetailComponent },

  // BILLING SECTION (Tenant)
  {
    path: 'billing',
    component: SubscriptionManagementComponent,
  },
  {
    path: 'billing/plans',
    component: ChangePlanComponent,
  },
  {
    path: 'billing/pay/:planId',
    component: PaymentComponent,
  },
  {
    path: 'billing/pay-invoice',
    component: PaymentComponent,
  },
  { path: 'billing/history', component: BillingHistoryComponent },
  {
    path: 'billing/history/:invoiceId',
    component: BillingHistoryDetailComponent,
  },
  { path: 'document', component: DocumentManagementComponent },

  // Dashboard
  {path: 'dashboard_tenant', component: MainTenantDashboardComponent}, // Dashboard cho Tenant

  // --- End of added routes ---

  // Optional: Add fallback route
  // { path: '**', redirectTo: '/login' }

    // DOCUMENT

];
