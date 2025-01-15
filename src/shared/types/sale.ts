export type PaymentMethod = 'cash' | 'card' | 'store_credit';

export interface Sale {
  id: number;
  customerId: number;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt?: Date;
  status: 'completed' | 'refunded' | 'partially_refunded';
}

export interface SaleItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
}

export interface Invoice {
  id: number;
  saleId: number;
  businessName: string;
  businessAddress: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: Date;
  updatedAt?: Date;
  guaranteeText: string;
  customMessage: string;
  dueDate?: Date;
  isPaid: boolean;
}
