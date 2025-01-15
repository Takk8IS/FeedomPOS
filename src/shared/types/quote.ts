export interface Quote {
  id: number
  customerId: number
  items: QuoteItem[]
  subtotal: number
  tax: number
  total: number
  expirationDate: Date
  notes?: string
  createdAt: Date
}

export interface QuoteItem {
  productId: number
  name: string
  quantity: number
  unitPrice: number
  discount?: number
  subtotal: number
}
