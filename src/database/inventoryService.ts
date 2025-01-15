import knex from './db'
import { Product } from '../shared/types/product'
import * as XLSX from 'xlsx'
import { Transaction } from 'knex'

// Define o tipo Dict genérico
type Dict<T> = { [key: string | number]: T }

/**
 * Importa produtos de um arquivo XLS
 * @param filePath Caminho do arquivo XLS
 */
export async function importProductsFromXLS(filePath: string): Promise<void> {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const products: Product[] = XLSX.utils.sheet_to_json(sheet)

  await knex.transaction(async (trx) => {
    for (const product of products) {
      await trx('products').insert(product)
    }
  })
}

/**
 * Obtém produtos com estoque baixo
 * @param threshold Limite opcional de estoque
 */
export async function getLowStockProducts(threshold?: number): Promise<Product[]> {
  const query = knex('products').where('stock', '<=', knex.raw('low_stock_threshold'))

  if (threshold !== undefined) {
    query.orWhere('stock', '<=', threshold)
  }

  return await query
}

/**
 * Atualiza o estoque de um produto
 * @param productId ID do produto
 * @param quantity Quantidade a ser incrementada/decrementada
 * @param trx Transação opcional
 */
export async function updateProductStock(
  productId: number,
  quantity: number,
  trx?: Transaction
): Promise<void> {
  const query = knex('products').where('id', productId).increment('stock', quantity)

  if (trx) {
    await query.transacting(trx)
  } else {
    await query
  }
}
