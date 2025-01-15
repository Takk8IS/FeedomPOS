export interface Account {
  id: number
  customerId?: number
  supplierId?: number
  type: 'receivable' | 'payable'
  amount: number
  dueDate: Date
  createdAt: Date
  paidAt?: Date
}
