// src/app/modules/superadmin/component/pending-tenant/pending-tenant.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Import OnInit, OnDestroy
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs'; // Import Subscription for cleanup

// Import the service and the list item interface
import {
  SuperAdminService,
  TenantListItem,
} from '../../../../core/superadmin.service';

@Component({
  selector: 'app-pending-tenant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-tenant.component.html',
  styleUrls: ['./pending-tenant.component.css'],
})
// Implement OnInit and OnDestroy
export class PendingTenantComponent implements OnInit, OnDestroy {
  // Remove hardcoded data, initialize as empty array
  tenants: TenantListItem[] = [];
  // Add loading and error states
  isLoading = true;
  errorMessage: string | null = null;
  // To hold the subscription
  private tenantsSub: Subscription | null = null;

  // Inject Router AND TenantService
  constructor(
    private router: Router,
    private superAdminService: SuperAdminService // Inject the service
  ) {}

  // Runs when the component is initialized
  ngOnInit(): void {
    this.loadTenants(); // Call the function to load data
  }

  // Function to load tenants from the service
  loadTenants(): void {
    this.isLoading = true; // Start loading
    this.errorMessage = null; // Clear previous errors

    // Call the service method and subscribe
    this.tenantsSub = this.superAdminService.getTenants().subscribe({
      next: (data) => {
        this.tenants = data; // Assign fetched data to the component property
        this.isLoading = false; // Stop loading
        console.log('Pending tenants loaded:', this.tenants);
      },
      error: (err) => {
        console.error('Error loading pending tenants:', err);
        // Use the error message processed by the service's handleError
        this.errorMessage =
          err.message || 'Failed to load tenant list. Please try again.';
        this.isLoading = false; // Stop loading
      },
    });
  }

  // Runs just before the component is destroyed
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.tenantsSub?.unsubscribe();
  }

  // Keep existing methods
  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';
      case 'Rejected':
        return 'status-rejected';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  }

  viewDetails(tenant: TenantListItem): void {
    // Use TenantListItem type here
    if (tenant.id) {
      // Note: Ensure your route for details matches how it was defined
      // Assuming it was '/pendingtenant/:id'
      this.router.navigate(['/pendingtenant', tenant.id]);
    } else {
      console.error('Cannot navigate: Tenant ID is missing.', tenant);
    }
  }
}
