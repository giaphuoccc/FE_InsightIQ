import { Component } from '@angular/core';
//import { MainSuperadminDashboardComponent } from '../../../superadmin/component/dashboard-superadmin/main-superadmin-dashboard/main-superadmin-dashboard.component';
import { MainTenantDashboardComponent } from "./main-tenant-dashboard/main-tenant-dashboard.component";
@Component({
  selector: 'app-dashboard',
  imports: [MainTenantDashboardComponent],
  templateUrl: './dashboard-tenant.component.html',
  styleUrl: './dashboard-tenant.component.css'
})
export class DashboardComponent {

}
