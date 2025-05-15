import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DashboardActionButtonComponentTenant } from './dashboard-action-button-tenant/dashboard-action-button-tenant.component';
import { TenantServiceService } from '../../../../service/tenant/tenantService.service';

@Component({
  selector: 'main-tenant-dashboard',
  standalone: true,
  imports: [RouterModule, DashboardActionButtonComponentTenant],
  templateUrl: './main-tenant-dashboard.component.html',
  styleUrl: './main-tenant-dashboard.component.css',
})
export class MainTenantDashboardComponent implements OnInit {
  tenantFullName: string = 'Tenant';

  constructor(
    private router: Router,
    private tenantService: TenantServiceService
  ) {}

  ngOnInit(): void {
    this.tenantService.getTenantFullName().subscribe({
      next: (fullName) => {
        this.tenantFullName = fullName;
      },
      error: (err) => {
        console.error('Không lấy được tên tenant:', err);
        this.tenantFullName = 'Tenant'; // fallback khi lỗi
      },
    });
  }

  goto(path: string): void {
    this.router.navigate([path]);
  }
}
