import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-comparison',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-comparison.component.html',
  styleUrls: ['./product-comparison.component.css']
})
export class ProductComparisonComponent {
  @Input() data!: {
    intro: string;
    products: {
      name: string;
      sku: string;
      category: string;
      shortDescription: string;
      specifications: { label: string; value: string }[];
      warranty: string;
      price: number;
      promotion: string;
      stockStatus: string;
      policies: {
        return: string;
        shipping: string;
        payment: string;
      };
    }[];
    conclusion: string;
  };
}
