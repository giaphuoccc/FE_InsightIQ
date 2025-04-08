// app.routes.ts (Standalone approach)
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/authentication/login/login.component';
import { RegisterComponent } from './modules/authentication/register/register.component';
import { PendingTenantComponent } from './modules/superadmin/component/pending-tenant/pending-tenant.component';
import { PendingTenantDetailComponent } from './modules/superadmin/component/pending-tenant-details/pending-tenant-details.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  //PENDING TENANT SECTION
  { path: 'pendingtenant', component: PendingTenantComponent },
  { path: 'pendingtenant/:id', component: PendingTenantDetailComponent }, // <-- NEW
  { path: '', redirectTo: '/pendingtenant', pathMatch: 'full' },
];
