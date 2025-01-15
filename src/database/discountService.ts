import knex from './db';
import { Discount } from '../shared/types/product';

export async function createDiscount(discount: Omit<Discount, 'id'>): Promise<number> {
  const [id] = await knex('discounts').insert(discount);
  if (!id) {
    throw new Error('Failed to create discount');
  }
  return id;
}

export async function getActiveDiscounts(): Promise<Discount[]> {
  const now = new Date();
  const results = await knex('discounts')
    .where('startDate', '<=', now)
    .andWhere('endDate', '>=', now);
  return results.map(mapDiscount);
}

export async function getDiscountForProduct(productId: number): Promise<Discount | null> {
  const now = new Date();
  const result = await knex('discounts')
    .where('productId', productId)
    .andWhere('startDate', '<=', now)
    .andWhere('endDate', '>=', now)
    .first();
  return result ? mapDiscount(result) : null;
}

export async function updateDiscount(discount: Discount): Promise<void> {
  const { id, ...updateData } = discount;
  await knex('discounts').where('id', id).update(updateData);
}

export async function deleteDiscount(id: number): Promise<void> {
  await knex('discounts').where('id', id).delete();
}

function mapDiscount(result: any): Discount {
  return {
    id: result.id,
    productId: result.productId,
    percentage: result.percentage,
    startDate: result.startDate,
    endDate: result.endDate,
  };
}
