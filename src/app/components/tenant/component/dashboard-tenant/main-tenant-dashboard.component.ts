import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DashboardActionButtonComponentTenant } from './dashboard-action-button-tenant/dashboard-action-button-tenant.component';
@Component({
  selector: 'main-tenant-dashboard',
  standalone: true,
  imports: [RouterModule, DashboardActionButtonComponentTenant],
  templateUrl: './main-tenant-dashboard.component.html',
  styleUrl: './main-tenant-dashboard.component.css'
})
export class MainTenantDashboardComponent {
  constructor(private router: Router) {}

  goto(path: string): void {
    this.router.navigate([path]);
  }
}
