// src/app/components/widget-user/product-info/product-data.interface.ts
// (Or place in a shared interfaces folder like src/app/core/interfaces/product-data.interface.ts)

// Interface defining the structure for single product information
// This should match the structure sent by the backend (ProductDataDto)
export interface ProductSpecification {
  label: string; // e.g., "Screen Size", "RAM"
  value: string; // e.g., "15 inches", "16GB"
}

export interface ProductData {
  intro?: string;
  name?: string; // Made optional to handle partial data gracefully
  sku?: string;
  category?: string;
  manufacturer?: string;
  shortDescription?: string;
  specifications?: ProductSpecification[];
  price?: number;
  priceString?: string;
  promotion?: string;
  stockStatus?: string;
  warranty?: string;
  imageUrl?: string;
  comment?: string;
}
