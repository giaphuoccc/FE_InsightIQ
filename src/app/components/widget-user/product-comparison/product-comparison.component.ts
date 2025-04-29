import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Đảm bảo interface này khớp với ProductComparisonData trong widget-user.component.ts
// Hoặc import interface dùng chung từ một file khác
interface ProductComparisonDataInput {
  intro: string;
  products: {
    name: string;
    sku: string;
    category: string;
    shortDescription: string;
    specifications: { label: string; value: string }[];
    warranty: string;
    price: number;
    priceString?: string; // Thêm nếu bạn muốn hiển thị chuỗi giá gốc
    promotion: string;
    stockStatus: string;
    policies: {
      return: string;
      shipping: string;
      payment: string;
    };
    // manufacturer?: string; // Thêm nếu cần
  }[];
  conclusion: string;
}


@Component({
  selector: 'app-product-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-comparison.component.html',
  styleUrls: ['./product-comparison.component.css']
})
export class ProductComparisonComponent {
  // Sử dụng interface đã định nghĩa hoặc giữ nguyên kiểu dữ liệu trực tiếp
  @Input() data!: ProductComparisonDataInput;

  // Có thể thêm hàm render markdown ở đây nếu cần cho các trường text dài như description
  renderMarkdown(text: string | undefined): string {
    if (!text) return '';
    // Đơn giản chỉ thay **bold** bằng <strong>
    // Có thể mở rộng để hỗ trợ các markdown khác nếu cần
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}