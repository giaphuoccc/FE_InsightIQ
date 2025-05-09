import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';  // for ngModel binding

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  isBlocked: boolean;
}

@Component({
  selector: 'app-tenant-account-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenantAccountList.component.html',
  styleUrls: ['./tenantAccountList.component.css']
})
export class TenantAccountListComponent {
  tenants: Tenant[] = [
    { id: 1, name: 'John Doe',    email: 'abc123@gmail.com',    phone: '0903331312', businessName: 'ABC Group',         isBlocked: false },
    { id: 2, name: 'Alice Smith', email: 'alice.smith@abc.com', phone: '0912345678', businessName: 'TechPro Solutions', isBlocked: false },
    { id: 3, name: 'Emily Tran',  email: 'emily.tran@yahoo.com', phone: '0987654321', businessName: "Tran's Boutique",   isBlocked: true  },
    { id: 4, name: 'Henry Lee',   email: 'henry.lee@supplies.com', phone: '0932123456', businessName: 'Lee Supplies Co.',   isBlocked: true  },
    { id: 5, name: 'Sarah Kim',   email: 'sarah.kim@provider.net', phone: '0823456789', businessName: 'Kim Logistics',     isBlocked: true  },
  ];

  // for search
  searchTerm: string = '';

  get filteredTenants(): Tenant[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.tenants;
    return this.tenants.filter(t =>
      t.name.toLowerCase().includes(term) ||
      t.email.toLowerCase().includes(term) ||
      t.businessName.toLowerCase().includes(term) ||
      t.phone.includes(term)
    );
  }

  // --- modal state ---
  showConfirmModal = false;
  showResultModal  = false;

  selectedTenant: Tenant | null = null;
  actionType: 'block' | 'unblock' | 'delete' = 'block';
  resultMessage = '';

  openConfirm(tenant: Tenant, action: 'block' | 'unblock' | 'delete') {
    this.selectedTenant   = tenant;
    this.actionType       = action;
    this.showConfirmModal = true;
  }

  confirmAction() {
    if (!this.selectedTenant) return;

    switch (this.actionType) {
      case 'block':
        this.selectedTenant.isBlocked = true;
        this.resultMessage = `Tenant Account set to Inactive.`;
        break;

      case 'unblock':
        this.selectedTenant.isBlocked = false;
        this.resultMessage = `Tenant Account set to Active.`;
        break;

      case 'delete':
        this.resultMessage = `Showing details for ${this.selectedTenant.name}.`;
        break;
    }

    this.showConfirmModal = false;
    this.showResultModal  = true;
  }

  closeConfirm() {
    this.showConfirmModal = false;
  }

  closeResult() {
    this.showResultModal = false;
    this.selectedTenant = null;
  }
}
