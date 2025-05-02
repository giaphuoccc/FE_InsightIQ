import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule],
  templateUrl: './tenantAccountList.component.html',
  styleUrls: ['./tenantAccountList.component.css']
})
export class TenantAccountListComponent {
  tenants: Tenant[] = [
    { id: 1, name: 'John Doe',    email: 'abc123@gmail.com',      phone: '0903331312', businessName: 'ABC Group',         isBlocked: false },
    { id: 2, name: 'Alice Smith', email: 'alice.smith@abc.com',   phone: '0912345678', businessName: 'TechPro Solutions', isBlocked: false },
    { id: 3, name: 'Emily Tran',  email: 'emily.tran@yahoo.com',   phone: '0987654321', businessName: "Tran's Boutique",   isBlocked: true  },
    { id: 4, name: 'Henry Lee',   email: 'henry.lee@supplies.com', phone: '0932123456', businessName: 'Lee Supplies Co.',   isBlocked: true  },
    { id: 5, name: 'Sarah Kim',   email: 'sarah.kim@provider.net', phone: '0823456789', businessName: 'Kim Logistics',     isBlocked: true  },
  ];

  // --- State cho 2 modal ---
  showConfirmModal = false;
  showResultModal  = false;

  selectedTenant: Tenant | null = null;
  actionType: 'block' | 'unblock' | 'delete' = 'block';
  resultMessage = '';

  /**
   * Mở modal xác nhận cho cả 3 hành động: block, unblock, delete
   */
  openConfirm(tenant: Tenant, action: 'block' | 'unblock' | 'delete') {
    this.selectedTenant = tenant;
    this.actionType     = action;
    this.showConfirmModal = true;
  }

  /**
   * Khi user bấm nút Confirm/Delete trên modal xác nhận
   */
  confirmAction() {
    if (!this.selectedTenant) return;

    switch (this.actionType) {
      case 'block':
        this.selectedTenant.isBlocked = true;
        this.resultMessage = `Tenant Account to "Inactive".`;
        break;

      case 'unblock':
        this.selectedTenant.isBlocked = false;
        this.resultMessage = `Tenant Account to "Active".`;
        break;

      case 'delete':
        // Xóa tenant khỏi danh sách
        this.tenants = this.tenants.filter(
          t => t.id !== this.selectedTenant!.id
        );
        this.resultMessage = `The tenant account has been deleted.`;
        break;
    }

    // Đóng confirm modal, mở result modal
    this.showConfirmModal = false;
    this.showResultModal  = true;
  }

  /** Đóng modal xác nhận mà không làm gì */
  closeConfirm() {
    this.showConfirmModal = false;
  }

  /** Đóng modal kết quả */
  closeResult() {
    this.showResultModal = false;
    this.selectedTenant = null;
  }
}
