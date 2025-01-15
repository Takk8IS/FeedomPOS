import knex from './db'
import { Product, Discount, Category } from '../shared/types/product'

export async function getProducts(): Promise<Product[]> {
  return knex('products').select('*')
}

export async function getProductById(id: number): Promise<Product | null> {
  return knex('products').where('id', id).first()
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<number> {
  const result = await knex('products').insert(product)
  const id = result[0]
  if (!id) throw new Error('Failed to create product')
  return id
}

export async function updateProduct(product: Product): Promise<void> {
  await knex('products').where('id', product.id).update(product)
}

export async function deleteProduct(id: number): Promise<void> {
  await knex('products').where('id', id).delete()
}

export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  const query = knex('products').where('stock', '<=', knex.ref('low_stock_threshold'))

  if (threshold !== undefined) {
    query.orWhere('stock', '<=', threshold)
  }

  return query
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  return knex('products').where('category', category)
}

export async function searchProducts(term: string): Promise<Product[]> {
  return knex('products').where('name', 'like', `%${term}%`).orWhere('barcode', 'like', `%${term}%`)
}

export async function createDiscount(discount: Omit<Discount, 'id'>): Promise<number> {
  const result = await knex('discounts').insert(discount)
  const id = result[0]
  if (!id) throw new Error('Failed to create discount')
  return id
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  const now = new Date()
  return knex('discounts').where('start_date', '<=', now).andWhere('end_date', '>=', now)
}

export async function getDiscountForProduct(productId: number): Promise<Discount | null> {
  const now = new Date()
  return knex('discounts')
    .where('product_id', productId)
    .andWhere('start_date', '<=', now)
    .andWhere('end_date', '>=', now)
    .first()
}

export async function updateProductStock(productId: number, quantity: number): Promise<void> {
  await knex('products').where('id', productId).increment('stock', quantity)
}

export async function generateBarcode(): Promise<string> {
  // Generate a unique 13-digit EAN barcode
  const prefix = '200' // Example prefix for in-store products
  const randomDigits = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0')
  const barcode = prefix + randomDigits
  const checkDigit = calculateEANCheckDigit(barcode)
  return barcode + checkDigit
}

function calculateEANCheckDigit(barcode: string): string {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = barcode[i]
    if (digit === undefined) throw new Error('Invalid barcode length')
    sum += parseInt(digit) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit.toString()
}

export async function getCategories(): Promise<Category[]> {
  return knex('categories').select('*')
}

export async function createCategory(name: string): Promise<number> {
  const result = await knex('categories').insert({ name })
  const id = result[0]
  if (!id) throw new Error('Failed to create category')
  return id
}

export async function updateCategory(category: Category): Promise<void> {
  await knex('categories').where('id', category.id).update(category)
}

export async function deleteCategory(id: number): Promise<void> {
  await knex('categories').where('id', id).delete()
}
