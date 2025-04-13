import { Component, Input } from '@angular/core';

@Component({
  selector: 'dashboard-action-button',
  imports: [],
  templateUrl: './dashboard-action-button.component.html',
  styleUrl: './dashboard-action-button.component.css'
})
export class DashboardActionButtonComponent {
  @Input() title: string = 'Action';
  @Input() icon: string = ''; // đường dẫn ảnh icon
}
