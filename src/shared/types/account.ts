export type AccountType = 'receivable' | 'payable';

export interface Account {
  id: number;
  customerId?: number;
  supplierId?: number;
  type: AccountType;
  amount: number;
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date | null;
}
