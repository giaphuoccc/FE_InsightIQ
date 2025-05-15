import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

import {
  SuperAdminService,
  TenantListRaw,
  TenantListItem,
} from '../../../service/authentication/validateTenant.service';

@Component({
  selector: 'app-pending-tenant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pendingTenant.component.html',
  styleUrls: ['./pendingTenant.component.css'],
})
export class PendingTenantComponent implements OnInit, OnDestroy {
  tenants: TenantListItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  private tenantsSub: Subscription | null = null;

  constructor(
    private router: Router,
    private superAdminService: SuperAdminService
  ) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.tenantsSub = this.superAdminService
      .getTenants()
      .pipe(
        switchMap((rawList: TenantListRaw[]) => {
          // For each raw tenant, fetch its user info:
          const detailCalls = rawList.map((raw) =>
            this.superAdminService.getUser(raw.userId).pipe(
              map(
                (user) =>
                  ({
                    tenantId: raw.id,
                    userId: raw.userId,
                    name: raw.fullName,
                    businessName: raw.companyName,
                    status: raw.status,
                    email: user.email,
                    phone: user.phoneNumber,
                  } as TenantListItem)
              )
            )
          );
          return forkJoin(detailCalls);
        }),
        catchError((err) => {
          throw err; // pass to subscriber
        })
      )
      .subscribe({
        next: (result) => {
          this.tenants = result;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to load tenants';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.tenantsSub?.unsubscribe();
  }

  /** CSS class for row status dot/color */
  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'PENDING':
        return 'status-pending';
      default:
        return '';
    }
  }

  /** Now accepts the tenantId string directly */
  viewDetails(tenantId: string): void {
    if (tenantId) {
      this.router.navigate(['/pendingtenant', tenantId]);
    } else {
      console.error('Missing tenantId for navigation');
    }
  }
}
