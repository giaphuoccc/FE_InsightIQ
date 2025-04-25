import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {

  // Thêm input để truyền từ bên ngoài vào
  @Input() message: string = 'Default'; // Đặt giá trị mặc định

  
}
