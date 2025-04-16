import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-tenant-header',
  templateUrl: './tenant-header.component.html',
  styleUrls: ['./tenant-header.component.css'],
  standalone: true,
})
export class TenantHeaderComponent {
  @Input() title = '';
}
