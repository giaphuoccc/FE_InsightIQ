import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, map } from 'rxjs/operators';
import {
  SuperAdminService,
  TenantDetail,
  TenantUserDto,
} from '../../../service/authentication/validateTenant.service';

@Component({
  selector: 'app-pending-tenant-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendingTenantDetails.component.html',
  styleUrls: ['./pendingTenantDetails.component.css'],
})
export class PendingTenantDetailsComponent implements OnInit {
  tenantId: string | null = null;
  tenant:
    | (TenantDetail & { email: string; phone: string; taxCode?: string })
    | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  showNotification = false;
  notificationMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private superAdminService: SuperAdminService
  ) {}

  ngOnInit(): void {
    this.tenantId = this.route.snapshot.paramMap.get('id');
    if (!this.tenantId) {
      this.errorMessage = 'No tenant ID provided.';
      return;
    }
    this.loadTenantDetails(this.tenantId);
  }

  loadTenantDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.superAdminService
      .getTenantById(id)
      .pipe(
        switchMap((detail) =>
          this.superAdminService.getUser(detail.userId).pipe(
            map((user: TenantUserDto) => ({
              ...detail,
              email: user.email,
              phone: user.phoneNumber,
              taxId: detail.taxId, // explicitly include taxCode
            }))
          )
        )
      )
      .subscribe({
        next: (merged) => {
          this.tenant = merged;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to load tenant details.';
          this.isLoading = false;
        },
      });
  }

  approve(): void {
    if (!this.tenant) return;
    this.superAdminService
      .updateTenantStatus(this.tenant.id, 'Approved')
      .subscribe({
        next: () => {
          this.tenant!.status = 'Approved';
          this.notificationMessage = 'Approved';
          this.showNotification = true;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to approve tenant.';
        },
      });
  }

  reject(): void {
    if (!this.tenant) return;
    this.superAdminService
      .updateTenantStatus(this.tenant.id, 'Rejected')
      .subscribe({
        next: () => {
          this.tenant!.status = 'Rejected';
          this.notificationMessage = 'Rejected';
          this.showNotification = true;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to reject tenant.';
        },
      });
  }

  closeNotification(): void {
    this.showNotification = false;
    this.router.navigate(['/pendingtenant']);
  }

  goBack(): void {
    this.router.navigate(['/pendingtenant']);
  }
}
