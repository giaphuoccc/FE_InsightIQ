import { Routes } from '@angular/router';
import { LoginComponent } from './components/authentication/login/login.component';
import { RegisterComponent } from './components/authentication/register/register.component';
import { PendingTenantComponent } from './components/superadmin/component/pending-tenant/pending-tenant.component';
import { PendingTenantDetailComponent } from './components/superadmin/component/pending-tenant-details/pending-tenant-details.component';
import { WidgetUserComponent } from './components/widget-user/widget-user.component';
import { ReportManagementComponent } from './shared/reports/report-management/report-management.component';
import { CommentDetailComponent } from './shared/reports/comment-detail/comment-detail.component';
import { PaymentComponent } from './components/tenant/component/payment/payment.component';
import { ChangePlanComponent } from './components/tenant/component/plan/change-plan.component';
import { SubscriptionManagementComponent } from './components/tenant/component/subscription/subscription-management/subscription-management.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // PENDING TENANT SECTION
  { path: 'pendingtenant', component: PendingTenantComponent },
  { path: 'pendingtenant/:id', component: PendingTenantDetailComponent },

  { path: 'widget-user', component: WidgetUserComponent },

  // REPORTING SECTION
  { path: 'viewreport', component: ReportManagementComponent },
  { path: 'report-conversation/:id', component: CommentDetailComponent },

  // BILLING SECTION (Tenant) - Nested approach
  {
    path: 'billing', // Main entry point for billing section
    component: SubscriptionManagementComponent, // Loads the dashboard showing current sub & action buttons
  },
  {
    path: 'billing/plans', // Page to view/select available plans
    component: ChangePlanComponent,
  },
  {
    path: 'billing/pay/:planId', // Page to confirm/pay for a NEW plan selection (Scenario 2)
    component: PaymentComponent,
  },
  {
    path: 'billing/pay-invoice', // Page to confirm/pay for the CURRENT outstanding invoice (Scenario 1)
    component: PaymentComponent,
  },

  // {
  //   path: 'billing', // Parent path
  //   // component: SubscriptionManagementComponent, // Optional: Use a layout component
  //   children: [
  //     // { path: '', redirectTo: 'plans', pathMatch: 'full' }, // Default redirect within billing
  //     { path: 'plans', component: ChangePlanComponent }, // Becomes /billing/plans
  //     { path: 'pay-invoice', component: PaymentComponent },
  //     { path: 'pay/:planId', component: PaymentComponent }, // Becomes /billing/pay/:planId
  //     // Add other billing routes here (e.g., history)
  //   ],
  // },

  // Fallback or default route if needed
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  // { path: '**', redirectTo: '/login' } // Or a NotFoundComponent
];
