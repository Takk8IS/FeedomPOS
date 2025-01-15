export interface Sale {
  id: number
  customerId: number
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  createdAt: Date
}

export interface SaleItem {
  productId: number
  name: string
  quantity: number
  price: number
  discount?: number
  tax: number
  subtotal: number
  total: number
}

export interface Invoice {
  saleId: number
  businessName: string
  businessAddress: string
  customerName: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  createdAt: Date
  guaranteeText: string
  customMessage: string
}
