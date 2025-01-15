export type RefundStatus = 'pending' | 'completed' | 'cancelled';
export type RefundMethod = 'cash' | 'card' | 'store_credit';

export interface RefundItem {
  itemId: string;
  quantity: number;
  amount: number;
}

export interface Refund {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  reason: string;
  items?: RefundItem[];
  status: RefundStatus;
  refundMethod: RefundMethod;
  createdAt: Date;
  processedAt?: Date;
  employeeId: string;
  notes?: string;
  updatedAt?: Date;
}
