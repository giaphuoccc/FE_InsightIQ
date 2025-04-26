// Import Angular core và CommonModule để hỗ trợ *ngIf, *ngFor, pipe,...
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Bắt buộc khi dùng Angular standalone component

// --- Interface định nghĩa cấu trúc dữ liệu sản phẩm ---
// Bạn nên dùng interface này ở nơi khác nữa để thống nhất định dạng dữ liệu
export interface ProductData {
  name: string; // Tên sản phẩm
  sku?: string; // Mã sản phẩm (tuỳ chọn)
  category?: string; // Danh mục sản phẩm
  shortDescription?: string; // Mô tả ngắn
  specifications?: { label: string; value: string }[]; // Danh sách thông số kỹ thuật
  warranty?: string; // Thời gian bảo hành
  price: number; // Giá sản phẩm
  promotion?: string; // Thông tin khuyến mãi (nếu có)
  stockStatus?: string; // Tình trạng hàng còn hay hết
  policies?: { // Chính sách liên quan
    return?: string;
    shipping?: string;
    payment?: string;
  };
  comment?: string;  // Thêm trường comment
}

@Component({
  selector: 'app-product-info', // Tag dùng trong HTML: <app-product-info>
  standalone: true, // Đây là component độc lập, không cần khai báo trong module
  imports: [CommonModule], // Import để dùng *ngIf, *ngFor và pipe
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css']
})
export class ProductInfoComponent {
  // Nhận dữ liệu từ component cha truyền xuống
  @Input() productData: ProductData | any;

  constructor() {}
}
