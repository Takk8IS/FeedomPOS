export interface Product {
  id: number
  name: string
  price: number
  stock: number
  barcode?: string
  lowStockThreshold: number
  category: string
  taxExempt: boolean
}

export interface Discount {
  id: number
  productId: number
  percentage: number
  startDate: Date
  endDate: Date
}

export interface Category {
  id: number
  name: string
}
