import { Sale, Invoice, SaleItem } from '../shared/types/sale';
import { Quote, QuoteItem } from '../shared/types/quote';
import { Refund } from '../shared/types/refund';
import knex from './db';
import { getSettings } from './settingsService';
import { updateProductStock } from './inventoryService';
import { Customer } from '../shared/types/customer';
import { Knex } from 'knex';

export async function createSale(sale: Omit<Sale, 'id'>): Promise<number> {
  const [saleId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('sales').insert({
      total: sale.total,
      subtotal: sale.subtotal,
      tax: sale.tax,
      paymentMethod: sale.paymentMethod,
      createdAt: new Date(),
      customerId: sale.customerId,
    });

    await trx('saleItems').insert(
      sale.items.map((item) => ({
        saleId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        taxAmount: item.tax,
        subtotal: item.subtotal,
        total: item.total,
      })),
    );

    for (const item of sale.items) {
      await updateProductStock(item.productId, -item.quantity, trx);
    }

    return [id];
  });

  return saleId;
}

export async function getSaleById(saleId: number): Promise<Sale | null> {
  const saleData = await knex('sales').where('id', saleId).first();

  if (!saleData) return null;

  const saleItems = await knex('saleItems')
    .join('products', 'saleItems.productId', 'products.id')
    .where('saleId', saleId)
    .select('saleItems.*', 'products.name');

  const sale: Sale = {
    id: saleData.id,
    total: Number(saleData.total),
    subtotal: Number(saleData.subtotal),
    tax: Number(saleData.tax),
    paymentMethod: saleData.paymentMethod,
    customerId: saleData.customerId,
    createdAt: new Date(saleData.createdAt),
    items: saleItems.map(
      (item): SaleItem => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        discount: Number(item.discount),
        tax: Number(item.taxAmount),
        subtotal: Number(item.subtotal),
        total: Number(item.total),
      }),
    ),
  };

  return sale;
}

export async function getTodaySales(): Promise<{ count: number; total: number }> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await knex('sales')
    .where('createdAt', '>=', startOfDay)
    .count('* as count')
    .sum('total as total')
    .first();

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  };
}

export async function getWeeklySales(): Promise<{ count: number; total: number }> {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const result = await knex('sales')
    .where('createdAt', '>=', startOfWeek)
    .count('* as count')
    .sum('total as total')
    .first();

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  };
}

export async function getMonthlySales(): Promise<{ count: number; total: number }> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await knex('sales')
    .where('createdAt', '>=', startOfMonth)
    .count('* as count')
    .sum('total as total')
    .first();

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  };
}

export async function getYearlySales(): Promise<{ count: number; total: number }> {
  const startOfYear = new Date();
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const result = await knex('sales')
    .where('createdAt', '>=', startOfYear)
    .count('* as count')
    .sum('total as total')
    .first();

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  };
}

export async function generateInvoice(saleId: number): Promise<Invoice> {
  const sale = await getSaleById(saleId);
  if (!sale) {
    throw new Error('Sale not found');
  }

  const settings = await getSettings();
  let customer: Customer | null = null;

  if (sale.customerId) {
    customer = await knex('customers').where('id', sale.customerId).first();
  }

  return {
    saleId: sale.id,
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    customerName: customer?.name || '',
    items: sale.items,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt,
    guaranteeText: settings.guaranteeText || '',
    customMessage: settings.invoiceCustomMessage || '',
  };
}

export async function getTopSellingProducts(
  limit = 10,
): Promise<Array<{ productId: number; name: string; totalSold: number }>> {
  const topProducts = await knex('saleItems')
    .join('products', 'saleItems.productId', 'products.id')
    .select('saleItems.productId', 'products.name')
    .sum('saleItems.quantity as totalSold')
    .groupBy('saleItems.productId', 'products.name')
    .orderBy('totalSold', 'desc')
    .limit(limit);

  return topProducts.map((p) => ({
    productId: p.productId,
    name: p.name,
    totalSold: Number(p.totalSold),
  }));
}

export async function getLeastSellingProducts(
  limit = 10,
): Promise<Array<{ productId: number; name: string; totalSold: number }>> {
  const leastProducts = await knex('saleItems')
    .join('products', 'saleItems.productId', 'products.id')
    .select('saleItems.productId', 'products.name')
    .sum('saleItems.quantity as totalSold')
    .groupBy('saleItems.productId', 'products.name')
    .orderBy('totalSold', 'asc')
    .limit(limit);

  return leastProducts.map((p) => ({
    productId: p.productId,
    name: p.name,
    totalSold: Number(p.totalSold),
  }));
}

export async function createQuote(quote: Omit<Quote, 'id'>): Promise<number> {
  const [quoteId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('quotes').insert({
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
      notes: quote.notes,
    });

    await trx('quoteItems').insert(
      quote.items.map((item: QuoteItem) => ({
        quoteId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      })),
    );

    return [id];
  });

  return quoteId;
}

export async function getQuoteById(quoteId: number): Promise<Quote | null> {
  const quoteData = await knex('quotes').where('id', quoteId).first();

  if (!quoteData) {
    return null;
  }

  const quoteItems = await knex('quoteItems')
    .join('products', 'quoteItems.productId', 'products.id')
    .where('quoteId', quoteId)
    .select('quoteItems.*', 'products.name');

  return {
    id: quoteData.id,
    customerId: quoteData.customerId,
    subtotal: Number(quoteData.subtotal),
    tax: Number(quoteData.tax),
    total: Number(quoteData.total),
    createdAt: new Date(quoteData.createdAt),
    expiresAt: new Date(quoteData.expiresAt),
    notes: quoteData.notes,
    items: quoteItems.map(
      (item): QuoteItem => ({
        productId: item.productId,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        discount: Number(item.discount || 0),
        subtotal: Number(item.price) * Number(item.quantity),
        total: Number(item.price) * Number(item.quantity) - Number(item.discount || 0),
      }),
    ),
  };
}

export async function updateQuote(quote: Quote): Promise<void> {
  await knex.transaction(async (trx: Knex.Transaction) => {
    await trx('quotes').where('id', quote.id).update({
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expiresAt: quote.expiresAt,
      notes: quote.notes,
    });

    await trx('quoteItems').where('quoteId', quote.id).delete();

    await trx('quoteItems').insert(
      quote.items.map((item) => ({
        quoteId: quote.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      })),
    );
  });
}

export async function deleteQuote(quoteId: number): Promise<void> {
  await knex.transaction(async (trx: Knex.Transaction) => {
    await trx('quoteItems').where('quoteId', quoteId).delete();
    await trx('quotes').where('id', quoteId).delete();
  });
}

export async function createRefund(refund: Omit<Refund, 'id'>): Promise<number> {
  const [refundId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('refunds').insert({
      saleId: refund.saleId,
      amount: refund.amount,
      reason: refund.reason,
      createdAt: refund.createdAt,
    });

    await trx('sales').where('id', refund.saleId).decrement('total', refund.amount);

    const sale = await getSaleById(refund.saleId);
    if (sale) {
      for (const item of sale.items) {
        await updateProductStock(item.productId, item.quantity, trx);
      }
    }

    return [id];
  });

  return refundId;
}

export async function getRefundById(refundId: number): Promise<Refund | null> {
  const refund = await knex('refunds').where('id', refundId).first();
  return refund
    ? {
        ...refund,
        amount: Number(refund.amount),
        createdAt: new Date(refund.createdAt),
      }
    : null;
}

export async function getRefundsBySale(saleId: number): Promise<Refund[]> {
  const refunds = await knex('refunds').where('saleId', saleId);
  return refunds.map((refund) => ({
    ...refund,
    amount: Number(refund.amount),
    createdAt: new Date(refund.createdAt),
  }));
}

export async function getDailyCashReport(): Promise<{
  totalSales: number;
  cashSales: number;
  cardSales: number;
  refunds: number;
  netTotal: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const salesResult = await knex('sales')
    .where('createdAt', '>=', startOfDay)
    .select(
      knex.raw('SUM(CASE WHEN paymentMethod = ? THEN total ELSE 0 END) as cashSales', ['cash']),
      knex.raw('SUM(CASE WHEN paymentMethod = ? THEN total ELSE 0 END) as cardSales', ['card']),
      knex.raw('SUM(total) as totalSales'),
    )
    .first();

  const refundsResult = await knex('refunds')
    .where('createdAt', '>=', startOfDay)
    .sum('amount as totalRefunds')
    .first();

  const totalSales = Number(salesResult?.totalSales || 0);
  const cashSales = Number(salesResult?.cashSales || 0);
  const cardSales = Number(salesResult?.cardSales || 0);
  const refunds = Number(refundsResult?.totalRefunds || 0);
  const netTotal = totalSales - refunds;

  return {
    totalSales,
    cashSales,
    cardSales,
    refunds,
    netTotal,
  };
}
