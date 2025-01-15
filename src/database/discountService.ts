import knex from './db'
import { Discount } from '../shared/types/product'

export async function createDiscount(discount: Omit<Discount, 'id'>): Promise<number> {
  const result = await knex('discounts').insert(discount)
  if (!result[0]) {
    throw new Error('Failed to create discount')
  }
  return result[0]
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

export async function updateDiscount(discount: Discount): Promise<void> {
  await knex('discounts').where('id', discount.id).update(discount)
}

export async function deleteDiscount(id: number): Promise<void> {
  await knex('discounts').where('id', id).delete()
}
