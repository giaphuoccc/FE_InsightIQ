// src/app/modules/superadmin/component/pending-tenant/pending-tenant-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <-- Import Router

// Assume Tenant interface includes an 'id' field
interface Tenant {
  id: string; // Make sure your tenant data has an ID
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}

@Component({
  selector: 'app-pending-tenant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-tenant.component.html',
  styleUrls: ['./pending-tenant.component.css'],
})
export class PendingTenantComponent implements OnInit {
  // Sample Data (Ensure tenants have unique IDs)
  tenants: Tenant[] = [
    {
      id: 't1',
      name: 'John Doe',
      email: 'abc123@gmail.com',
      phone: '0903331312',
      businessName: 'ABC Group',
      status: 'Approved',
    },
    {
      id: 't2',
      name: 'Alice Smith',
      email: 'alice.smith@abc.com',
      phone: '0912345678',
      businessName: 'TechPro Solutions',
      status: 'Rejected',
    },
    {
      id: 't3',
      name: 'Emily Tran',
      email: 'emily.tran@yahoo.com',
      phone: '0987654321',
      businessName: "Tran's Boutique",
      status: 'Pending',
    },
    // ... Add other tenants with unique IDs
    {
      id: 'trigger-error',
      name: 'Test Error',
      email: 'error@test.com',
      phone: '0000000000',
      businessName: 'Error Inc.',
      status: 'Pending',
    }, // For testing error handling
  ];

  constructor(private router: Router) {} // <-- Inject Router

  ngOnInit(): void {
    // Load tenant list data if not hardcoded
  }

  getStatusClass(status: string): string {
    // (Keep existing implementation)
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

  viewDetails(tenant: Tenant): void {
    console.log('Navigating to details for tenant ID:', tenant.id);
    if (tenant.id) {
      // Navigate to the detail route, passing the tenant's ID
      this.router.navigate(['/pendingtenant', tenant.id]); // <-- Use router.navigate
    } else {
      console.error(
        'Cannot navigate to details: Tenant ID is missing.',
        tenant
      );
      alert('Cannot view details for this tenant: ID is missing.');
    }
  }
}
