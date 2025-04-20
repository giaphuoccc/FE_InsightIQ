import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Needed for *ngIf, *ngFor, etc.
import {
  SuperAdminService,
  TenantDetail,
} from '../../../../core/superadmin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule], // Import CommonModule for standalone
  templateUrl: './pending-tenant-details.component.html',
  styleUrls: ['./pending-tenant-details.component.css'],
})
export class PendingTenantDetailComponent implements OnInit {
  tenant: TenantDetail | null = null;
  isLoading = true; // Start in loading state
  errorMessage: string | null = null;
  tenantId: string | null = null;
  private routeSub: Subscription | null = null;
  private tenantSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute, // To get route parameters (like ID)
    private router: Router, // To navigate programmatically (e.g., after approve/reject)
    private superAdminService: SuperAdminService // Service to fetch data
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id'); // Get the 'id' from the URL path
      if (id) {
        this.loadTenantDetails(id);
      } else {
        // Handle case where ID is missing (optional)
        this.isLoading = false;
        this.showErrorPopup('Tenant ID is missing in the URL.');
        console.error('Tenant ID not found in route parameters.');
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.routeSub?.unsubscribe();
    this.tenantSub?.unsubscribe();
  }

  loadTenantDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.tenant = null; // Reset tenant data

    this.tenantSub = this.superAdminService.getTenantById(id).subscribe({
      next: (data) => {
        this.tenant = data;
        this.isLoading = false;
        console.log('Tenant data loaded:', this.tenant);
      },
      error: (err) => {
        console.error('Error loading tenant details:', err);
        this.isLoading = false;
        // Use the error message processed by the service's handleError
        const displayMessage = `Failed to load tenant information. ${
          err.message || 'Please try again later.'
        }`;
        this.showErrorPopup(displayMessage); // Show popup
        this.errorMessage = displayMessage; // Store error for potential display in template
      },
    });
  }

  // --- Action Methods ---
  approve(): void {
    if (!this.tenant) return;
    console.log('Approving tenant:', this.tenant.id);
    // Call service, handle response/error, maybe navigate back
    this.superAdminService.approveTenant(this.tenant.id).subscribe({
      next: () => {
        alert('Tenant Approved!'); // Simple feedback
        this.router.navigate(['/pendingtenant']); // Navigate back to list
      },
      error: (err) =>
        this.showErrorPopup(`Failed to approve tenant: ${err.message}`),
    });
  }

  reject(): void {
    if (!this.tenant) return;
    console.log('Rejecting tenant:', this.tenant.id);
    // Call service, handle response/error, maybe navigate back
    this.superAdminService.rejectTenant(this.tenant.id).subscribe({
      next: () => {
        alert('Tenant Rejected!'); // Simple feedback
        this.router.navigate(['/pendingtenant']); // Navigate back to list
      },
      error: (err) =>
        this.showErrorPopup(`Failed to reject tenant: ${err.message}`),
    });
  }

  // --- Error Popup ---
  showErrorPopup(message: string): void {
    // Using basic browser alert as requested for simplicity
    window.alert(message);
    // In a real app, use a dedicated Modal/Toast/Snackbar component service
  }

  // --- Helper to go back (optional) ---
  goBack(): void {
    this.router.navigate(['/pendingtenant']); // Navigate back to the list view
  }
}
