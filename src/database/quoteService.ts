import knex from './db'
import { Quote } from '../shared/types/quote'

export async function createQuote(quote: Omit<Quote, 'id' | 'createdAt'>): Promise<number> {
  const [id] = await knex.transaction(async (trx) => {
    const [quoteId] = await trx('quotes').insert({
      customer_id: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expiration_date: quote.expirationDate,
      notes: quote.notes,
      created_at: new Date(),
    })

    await trx('quote_items').insert(
      quote.items.map((item) => ({
        quote_id: quoteId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
      }))
    )

    return [quoteId]
  })

  if (!id) {
    throw new Error('Failed to create quote')
  }

  return id
}

export async function getQuoteById(id: number): Promise<Quote | null> {
  const quote = await knex('quotes').where('id', id).first()
  if (!quote) return null

  const items = await knex('quote_items')
    .where('quote_id', id)
    .join('products', 'quote_items.product_id', 'products.id')
    .select('quote_items.*', 'products.name')

  return {
    ...quote,
    items: items.map((item) => ({
      productId: item.product_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discount: item.discount,
    })),
  }
}

export async function updateQuote(quote: Quote): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('quotes').where('id', quote.id).update({
      customer_id: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expiration_date: quote.expirationDate,
      notes: quote.notes,
    })

    await trx('quote_items').where('quote_id', quote.id).delete()
    await trx('quote_items').insert(
      quote.items.map((item) => ({
        quote_id: quote.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
      }))
    )
  })
}

export async function deleteQuote(id: number): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('quote_items').where('quote_id', id).delete()
    await trx('quotes').where('id', id).delete()
  })
}

export async function getQuotesByCustomer(customerId: number): Promise<Quote[]> {
  const quotes = await knex('quotes').where('customer_id', customerId)
  const quoteIds = quotes.map((q) => q.id)

  const items = await knex('quote_items')
    .whereIn('quote_id', quoteIds)
    .join('products', 'quote_items.product_id', 'products.id')
    .select('quote_items.*', 'products.name')

  return quotes.map((quote) => ({
    ...quote,
    items: items
      .filter((item) => item.quote_id === quote.id)
      .map((item) => ({
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discount: item.discount,
      })),
  }))
}
