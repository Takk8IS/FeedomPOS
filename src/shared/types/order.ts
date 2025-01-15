export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  items: OrderItem[];
  tableNumber: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  notes?: string;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}
