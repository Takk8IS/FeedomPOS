export interface Quote {
  id: number;
  customerId: number;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  expirationDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface QuoteItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
}
