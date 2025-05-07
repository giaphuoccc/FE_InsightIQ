import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  @Input() message: string = 'Default';
  @Input() showConfirmButton: boolean = true; // Mặc định hiển thị nút Confirm
  @Input() confirmButtonText: string = 'Confirm'; // Cho phép tùy chỉnh text nút Confirm
  @Input() showCancelButton: boolean = false; // <<< THÊM: Mặc định không hiển thị nút Cancel
  @Input() cancelButtonText: string = 'Cancel'; // <<< THÊM: Cho phép tùy chỉnh text nút Cancel

  @Output() confirmAction = new EventEmitter<void>();
  @Output() closeAction = new EventEmitter<void>(); // Sự kiện khi đóng bằng nút '×' hoặc overlay
  @Output() cancelAction = new EventEmitter<void>(); // <<< THÊM: Sự kiện khi nhấn nút Cancel

  onConfirm(): void {
    this.confirmAction.emit();
  }

  onClose(): void { // Dùng cho nút '×' và click overlay
    this.closeAction.emit();
  }

  onCancel(): void { // <<< THÊM HÀM NÀY
    this.cancelAction.emit();
  }
}