import knex from './db';
import { Quote, QuoteItem } from '../shared/types/quote';

export async function createQuote(quote: Omit<Quote, 'id' | 'createdAt'>): Promise<number> {
  const [id] = await knex.transaction(async (trx) => {
    const [quoteId] = await trx('quotes').insert({
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expirationDate: quote.expirationDate,
      notes: quote.notes,
      createdAt: new Date(),
    });

    await trx('quoteItems').insert(
      quote.items.map((item) => ({
        quoteId: quoteId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
    );

    return [quoteId];
  });

  if (!id) {
    throw new Error('Failed to create quote');
  }

  return id;
}

export async function getQuoteById(id: number): Promise<Quote | null> {
  const quote = await knex('quotes').where('id', id).first();
  if (!quote) return null;

  const items = await knex('quoteItems')
    .where('quoteId', id)
    .join('products', 'quoteItems.productId', 'products.id')
    .select('quoteItems.*', 'products.name');

  return {
    ...mapQuote(quote),
    items: items.map(mapQuoteItem),
  };
}

export async function updateQuote(quote: Quote): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('quotes').where('id', quote.id).update({
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expirationDate: quote.expirationDate,
      notes: quote.notes,
    });

    await trx('quoteItems').where('quoteId', quote.id).delete();
    await trx('quoteItems').insert(
      quote.items.map((item) => ({
        quoteId: quote.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
    );
  });
}

export async function deleteQuote(id: number): Promise<void> {
  await knex.transaction(async (trx) => {
    await trx('quoteItems').where('quoteId', id).delete();
    await trx('quotes').where('id', id).delete();
  });
}

export async function getQuotesByCustomer(customerId: number): Promise<Quote[]> {
  const quotes = await knex('quotes').where('customerId', customerId);
  const quoteIds = quotes.map((q) => q.id);

  const items = await knex('quoteItems')
    .whereIn('quoteId', quoteIds)
    .join('products', 'quoteItems.productId', 'products.id')
    .select('quoteItems.*', 'products.name');

  return quotes.map((quote) => ({
    ...mapQuote(quote),
    items: items.filter((item) => item.quoteId === quote.id).map(mapQuoteItem),
  }));
}

function mapQuote(result: any): Omit<Quote, 'items'> {
  return {
    id: result.id,
    customerId: result.customerId,
    subtotal: result.subtotal,
    tax: result.tax,
    total: result.total,
    expirationDate: result.expirationDate,
    notes: result.notes,
    createdAt: result.createdAt,
  };
}

function mapQuoteItem(result: any): QuoteItem {
  return {
    productId: result.productId,
    name: result.name,
    quantity: result.quantity,
    unitPrice: result.unitPrice,
    discount: result.discount,
  };
}
