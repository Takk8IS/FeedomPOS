import knex from './db';
import { Product, Discount, Category } from '../shared/types/product';

export async function getProducts(): Promise<Product[]> {
  const results = await knex('products').select('*');
  return results.map(mapProduct);
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await knex('products').where('id', id).first();
  return result ? mapProduct(result) : null;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<number> {
  const [id] = await knex('products').insert(product);
  if (!id) throw new Error('Failed to create product');
  return id;
}

export async function updateProduct(product: Product): Promise<void> {
  await knex('products').where('id', product.id).update(product);
}

export async function deleteProduct(id: number): Promise<void> {
  await knex('products').where('id', id).delete();
}

export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  const query = knex('products').where('stock', '<=', knex.ref('lowStockThreshold'));

  if (threshold !== undefined) {
    query.orWhere('stock', '<=', threshold);
  }

  const results = await query;
  return results.map(mapProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const results = await knex('products').where('category', category);
  return results.map(mapProduct);
}

export async function searchProducts(term: string): Promise<Product[]> {
  const results = await knex('products')
    .where('name', 'like', `%${term}%`)
    .orWhere('barcode', 'like', `%${term}%`);
  return results.map(mapProduct);
}

export async function createDiscount(discount: Omit<Discount, 'id'>): Promise<number> {
  const [id] = await knex('discounts').insert(discount);
  if (!id) throw new Error('Failed to create discount');
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

export async function updateProductStock(productId: number, quantity: number): Promise<void> {
  await knex('products').where('id', productId).increment('stock', quantity);
}

export async function generateBarcode(): Promise<string> {
  const prefix = '200'; // Example prefix for in-store products
  const randomDigits = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');
  const barcode = prefix + randomDigits;
  const checkDigit = calculateEANCheckDigit(barcode);
  return barcode + checkDigit;
}

function calculateEANCheckDigit(barcode: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = barcode[i];
    if (digit === undefined) throw new Error('Invalid barcode length');
    sum += parseInt(digit) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

export async function getCategories(): Promise<Category[]> {
  const results = await knex('categories').select('*');
  return results.map(mapCategory);
}

export async function createCategory(name: string): Promise<number> {
  const [id] = await knex('categories').insert({ name });
  if (!id) throw new Error('Failed to create category');
  return id;
}

export async function updateCategory(category: Category): Promise<void> {
  await knex('categories').where('id', category.id).update(category);
}

export async function deleteCategory(id: number): Promise<void> {
  await knex('categories').where('id', id).delete();
}

function mapProduct(result: any): Product {
  return {
    id: result.id,
    name: result.name,
    barcode: result.barcode,
    price: result.price,
    stock: result.stock,
    lowStockThreshold: result.lowStockThreshold,
    category: result.category,
    taxExempt: result.taxExempt,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
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

function mapCategory(result: any): Category {
  return {
    id: result.id,
    name: result.name,
  };
}
