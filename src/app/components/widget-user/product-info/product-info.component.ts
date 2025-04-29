import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // Chỉ cần CommonModule
import { ProductData } from '../widget-user.component';

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [
      CommonModule // Đảm bảo CommonModule đã được import
    ],
  // KHÔNG CẦN providers: [CurrencyPipe] ở đây nếu chỉ dùng trong template
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css']
})
export class ProductInfoComponent {
  @Input() productData: Partial<ProductData> | null = null;

  // XÓA constructor hoặc để trống nếu không inject gì khác
  constructor() {}

  // Getter displayPrice không còn cần thiết nếu chỉ dùng pipe trong template
  // Bạn có thể xóa getter này đi

  get hasSpecifications(): boolean {
    return !!this.productData?.specifications && this.productData.specifications.length > 0;
  }
}