import { Component, Input, Output, EventEmitter } from '@angular/core'; // ĐÃ THÊM Output, EventEmitter
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

  // Khai báo các Output emitters
  @Output() confirmAction = new EventEmitter<void>(); // <<< THÊM DÒNG NÀY
  @Output() closeAction = new EventEmitter<void>();   // <<< THÊM DÒNG NÀY

  // Hàm được gọi khi nút "Confirm" trên modal được click
  onConfirm(): void { // <<< THÊM HÀM NÀY
    this.confirmAction.emit(); // Phát ra sự kiện confirmAction
  }

  // Hàm được gọi khi nút "Close" (hoặc overlay) trên modal được click
  onClose(): void { // <<< THÊM HÀM NÀY
    this.closeAction.emit(); // Phát ra sự kiện closeAction
  }
}