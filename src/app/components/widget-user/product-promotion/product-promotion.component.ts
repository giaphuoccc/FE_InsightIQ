import { Component, Input } from '@angular/core'; // 👈 Thêm Input
import { CommonModule } from '@angular/common'; // 👈 Thêm CommonModule

// 👇 Định nghĩa cấu trúc dữ liệu cho thông tin khuyến mãi sản phẩm
export interface ProductPromotionData {
  productName: string;
  promotionDescription: string;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  gift?: string;
  validUntil?: Date | string;
  conditions?: string;
  productImageUrl?: string;
}

@Component({
  selector: 'product-promotion',
  standalone: true, // 👈 Đảm bảo có dòng này (nếu CLI chưa tự thêm)
  imports: [CommonModule], // 👈 Thêm CommonModule vào đây
  templateUrl: './product-promotion.component.html',
  styleUrl: './product-promotion.component.css' // styleUrl là đúng với Angular mới
})
export class ProductPromotionComponent {
  // 👇 Input property để nhận dữ liệu từ component cha
  @Input() promotionData!: ProductPromotionData;

  // 👇 (Tùy chọn) Hàm trợ giúp để kiểm tra ngày tháng
  isValidDate(date: any): boolean {
    // Kiểm tra xem date có tồn tại và có thể chuyển đổi thành một đối tượng Date hợp lệ hay không
    return date && !isNaN(new Date(date).getTime());
  }
}