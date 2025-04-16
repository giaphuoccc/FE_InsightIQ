// app.routes.ts (Standalone approach)
import { Routes } from '@angular/router';
import { LoginComponent } from './components/authentication/login/login.component';
import { RegisterComponent } from './components/authentication/register/register.component';
import { PendingTenantComponent } from './components/superadmin/component/pending-tenant/pending-tenant.component';
import { PendingTenantDetailComponent } from './components/superadmin/component/pending-tenant-details/pending-tenant-details.component';
import { WidgetUserComponent } from './components/widget-user/widget-user.component';
import { TenantManagementComponent } from './components/tenant/component/profile/edit-profile/TenantManagementComponent/tenant-management.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  //PENDING TENANT SECTION
  { path: 'pendingtenant', component: PendingTenantComponent },
  { path: 'pendingtenant/:id', component: PendingTenantDetailComponent }, // <-- NEW
  { path: '', redirectTo: '/pendingtenant', pathMatch: 'full' },
  {path: 'widget-user', component: WidgetUserComponent},
  {path: 'tenant-management', component: TenantManagementComponent}
];
