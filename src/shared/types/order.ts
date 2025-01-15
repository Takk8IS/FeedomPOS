export interface Order {
  id: number
  items: OrderItem[]
  tableNumber: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: Date
}

export interface OrderItem {
  id: number
  productId: number
  name: string
  quantity: number
  notes?: string
  unitPrice: number
  subtotal: number
  tax: number
  total: number
}
