export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
  lowStockThreshold: number;
  category: string;
  taxExempt: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Discount {
  id: number;
  productId: number;
  percentage: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Category {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt?: Date;
}
