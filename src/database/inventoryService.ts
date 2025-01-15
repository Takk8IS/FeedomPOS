import knex from './db';
import { Product } from '../shared/types/product';
import * as XLSX from 'xlsx';
import { Transaction } from 'knex';

type Dict<T> = { [key: string | number]: T };

export async function importProductsFromXLS(filePath: string): Promise<void> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const products: Product[] = XLSX.utils.sheet_to_json(sheet);

  await knex.transaction(async (trx) => {
    for (const product of products) {
      await trx('products').insert(product);
    }
  });
}

export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  const query = knex('products').where('stock', '<=', knex.raw('lowStockThreshold'));

  if (threshold !== undefined) {
    query.orWhere('stock', '<=', threshold);
  }

  const results = await query;
  return results.map(mapProduct);
}

export async function updateProductStock(
  productId: number,
  quantity: number,
  trx?: Transaction,
): Promise<void> {
  const query = knex('products').where('id', productId).increment('stock', quantity);

  if (trx) {
    await query.transacting(trx);
  } else {
    await query;
  }
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
