import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'dashboard-action-button-tenant',
  imports: [],
  templateUrl: './dashboard-action-button-tenant.component.html',
  styleUrl: './dashboard-action-button-tenant.component.css'
})
export class DashboardActionButtonComponentTenant {
  @Input() title: string = 'Action';
  @Input() icon: string = ''; // đường dẫn ảnh icon
  @Output() pressed = new EventEmitter<void>();
}
