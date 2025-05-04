import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// Import the interface from its new location
import { ProductData } from './ProductInterface';

@Component({
  selector: 'app-product-info',
  standalone: true,
  imports: [
    CommonModule, // Needed for *ngIf, pipes, etc. in the template
  ],
  templateUrl: './product-info.component.html',
  styleUrls: ['./product-info.component.css'],
})
export class ProductInfoComponent {
  // Use the imported interface, allow null or partial data
  @Input() productData: Partial<ProductData> | null = null;

  constructor() {}

  // Getter to safely check if specifications exist and have items
  get hasSpecifications(): boolean {
    return (
      !!this.productData?.specifications &&
      this.productData.specifications.length > 0
    );
  }

  // You might add other getters here for safe access or computed properties
  // Example:
  get displayPrice(): string | null {
    if (this.productData?.priceString) {
      return this.productData.priceString;
    }
    // Optionally format the numeric price if priceString is missing
    // Requires CurrencyPipe injection or manual formatting
    // if (this.productData?.price) {
    //    return this.currencyPipe.transform(this.productData.price, 'VND', 'symbol', '1.0-0');
    // }
    return null;
  }
}
