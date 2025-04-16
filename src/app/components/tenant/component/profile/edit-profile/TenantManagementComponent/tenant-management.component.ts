import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantHeaderComponent } from '../TenantHeaderComponent/tenant-header.component';
import { TenantDetailsComponent } from '../TenantDetailsComponent/tenant-details.component';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [
    CommonModule,
    TenantHeaderComponent, // <-- import bắt buộc
    TenantDetailsComponent, // <-- import nếu dùng <app-tenant-details>
  ],
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.css'],
})
export class TenantManagementComponent {}
