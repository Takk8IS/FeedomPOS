import { Sale, Invoice, SaleItem } from '../shared/types/sale'
import { Quote, QuoteItem } from '../shared/types/quote'
import { Refund } from '../shared/types/refund'
import knex from './db'
import { getSettings } from './settingsService'
import { updateProductStock } from './inventoryService'
import { Customer } from '../shared/types/customer'
import { Knex } from 'knex'

export async function createSale(sale: Omit<Sale, 'id'>): Promise<number> {
  const [saleId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('sales').insert({
      total: sale.total,
      subtotal: sale.subtotal,
      tax: sale.tax,
      payment_method: sale.paymentMethod,
      created_at: new Date(),
      customer_id: sale.customerId,
    })

    await trx('sale_items').insert(
      sale.items.map((item) => ({
        sale_id: id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
        tax_amount: item.tax,
        subtotal: item.subtotal,
        total: item.total,
      }))
    )

    for (const item of sale.items) {
      await updateProductStock(item.productId, -item.quantity, trx)
    }

    return [id]
  })

  return saleId
}

export async function getSaleById(saleId: number): Promise<Sale | null> {
  const saleData = await knex('sales').where('id', saleId).first()

  if (!saleData) return null

  const saleItems = await knex('sale_items')
    .join('products', 'sale_items.product_id', 'products.id')
    .where('sale_id', saleId)
    .select('sale_items.*', 'products.name')

  const sale: Sale = {
    id: saleData.id,
    total: Number(saleData.total),
    subtotal: Number(saleData.subtotal),
    tax: Number(saleData.tax),
    paymentMethod: saleData.payment_method,
    customerId: saleData.customer_id,
    createdAt: new Date(saleData.created_at),
    items: saleItems.map(
      (item): SaleItem => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        discount: Number(item.discount),
        tax: Number(item.tax_amount),
        subtotal: Number(item.subtotal),
        total: Number(item.total),
      })
    ),
  }

  return sale
}

export async function getTodaySales(): Promise<{ count: number; total: number }> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const result = await knex('sales')
    .where('created_at', '>=', startOfDay)
    .count('* as count')
    .sum('total as total')
    .first()

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  }
}

export async function getWeeklySales(): Promise<{ count: number; total: number }> {
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  const result = await knex('sales')
    .where('created_at', '>=', startOfWeek)
    .count('* as count')
    .sum('total as total')
    .first()

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  }
}

export async function getMonthlySales(): Promise<{ count: number; total: number }> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const result = await knex('sales')
    .where('created_at', '>=', startOfMonth)
    .count('* as count')
    .sum('total as total')
    .first()

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  }
}

export async function getYearlySales(): Promise<{ count: number; total: number }> {
  const startOfYear = new Date()
  startOfYear.setMonth(0, 1)
  startOfYear.setHours(0, 0, 0, 0)

  const result = await knex('sales')
    .where('created_at', '>=', startOfYear)
    .count('* as count')
    .sum('total as total')
    .first()

  return {
    count: Number(result?.count || 0),
    total: Number(result?.total || 0),
  }
}

export async function generateInvoice(saleId: number): Promise<Invoice> {
  const sale = await getSaleById(saleId)
  if (!sale) {
    throw new Error('Sale not found')
  }

  const settings = await getSettings()
  let customer: Customer | null = null

  if (sale.customerId) {
    customer = await knex('customers').where('id', sale.customerId).first()
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
  }
}

export async function getTopSellingProducts(
  limit = 10
): Promise<Array<{ productId: number; name: string; totalSold: number }>> {
  const topProducts = await knex('sale_items')
    .join('products', 'sale_items.product_id', 'products.id')
    .select('sale_items.product_id', 'products.name')
    .sum('sale_items.quantity as totalSold')
    .groupBy('sale_items.product_id', 'products.name')
    .orderBy('totalSold', 'desc')
    .limit(limit)

  return topProducts.map((p) => ({
    productId: p.product_id,
    name: p.name,
    totalSold: Number(p.totalSold),
  }))
}

export async function getLeastSellingProducts(
  limit = 10
): Promise<Array<{ productId: number; name: string; totalSold: number }>> {
  const leastProducts = await knex('sale_items')
    .join('products', 'sale_items.product_id', 'products.id')
    .select('sale_items.product_id', 'products.name')
    .sum('sale_items.quantity as totalSold')
    .groupBy('sale_items.product_id', 'products.name')
    .orderBy('totalSold', 'asc')
    .limit(limit)

  return leastProducts.map((p) => ({
    productId: p.product_id,
    name: p.name,
    totalSold: Number(p.totalSold),
  }))
}

export async function createQuote(quote: Omit<Quote, 'id'>): Promise<number> {
  const [quoteId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('quotes').insert({
      customer_id: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      created_at: quote.createdAt,
      expires_at: quote.expiresAt,
      notes: quote.notes,
    })

    await trx('quote_items').insert(
      quote.items.map((item: QuoteItem) => ({
        quote_id: id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      }))
    )

    return [id]
  })

  return quoteId
}

export async function getQuoteById(quoteId: number): Promise<Quote | null> {
  const quoteData = await knex('quotes').where('id', quoteId).first()

  if (!quoteData) {
    return null
  }

  const quoteItems = await knex('quote_items')
    .join('products', 'quote_items.product_id', 'products.id')
    .where('quote_id', quoteId)
    .select('quote_items.*', 'products.name')

  return {
    id: quoteData.id,
    customerId: quoteData.customer_id,
    subtotal: Number(quoteData.subtotal),
    tax: Number(quoteData.tax),
    total: Number(quoteData.total),
    createdAt: new Date(quoteData.created_at),
    expiresAt: new Date(quoteData.expires_at),
    notes: quoteData.notes,
    items: quoteItems.map(
      (item): QuoteItem => ({
        productId: item.product_id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        discount: Number(item.discount || 0),
        subtotal: Number(item.price) * Number(item.quantity),
        total: Number(item.price) * Number(item.quantity) - Number(item.discount || 0),
      })
    ),
  }
}

export async function updateQuote(quote: Quote): Promise<void> {
  await knex.transaction(async (trx: Knex.Transaction) => {
    await trx('quotes').where('id', quote.id).update({
      customer_id: quote.customerId,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      expires_at: quote.expiresAt,
      notes: quote.notes,
    })

    await trx('quote_items').where('quote_id', quote.id).delete()

    await trx('quote_items').insert(
      quote.items.map((item) => ({
        quote_id: quote.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0,
      }))
    )
  })
}

export async function deleteQuote(quoteId: number): Promise<void> {
  await knex.transaction(async (trx: Knex.Transaction) => {
    await trx('quote_items').where('quote_id', quoteId).delete()
    await trx('quotes').where('id', quoteId).delete()
  })
}

export async function createRefund(refund: Omit<Refund, 'id'>): Promise<number> {
  const [refundId] = await knex.transaction(async (trx: Knex.Transaction) => {
    const [id] = await trx('refunds').insert({
      sale_id: refund.saleId,
      amount: refund.amount,
      reason: refund.reason,
      created_at: refund.createdAt,
    })

    await trx('sales').where('id', refund.saleId).decrement('total', refund.amount)

    const sale = await getSaleById(refund.saleId)
    if (sale) {
      for (const item of sale.items) {
        await updateProductStock(item.productId, item.quantity, trx)
      }
    }

    return [id]
  })

  return refundId
}

export async function getRefundById(refundId: number): Promise<Refund | null> {
  const refund = await knex('refunds').where('id', refundId).first()
  return refund
    ? {
        ...refund,
        amount: Number(refund.amount),
        createdAt: new Date(refund.created_at),
      }
    : null
}

export async function getRefundsBySale(saleId: number): Promise<Refund[]> {
  const refunds = await knex('refunds').where('sale_id', saleId)
  return refunds.map((refund) => ({
    ...refund,
    amount: Number(refund.amount),
    createdAt: new Date(refund.created_at),
  }))
}

export async function getDailyCashReport(): Promise<{
  totalSales: number
  cashSales: number
  cardSales: number
  refunds: number
  netTotal: number
}> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const salesResult = await knex('sales')
    .where('created_at', '>=', startOfDay)
    .select(
      knex.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as cash_sales', ['cash']),
      knex.raw('SUM(CASE WHEN payment_method = ? THEN total ELSE 0 END) as card_sales', ['card']),
      knex.raw('SUM(total) as total_sales')
    )
    .first()

  const refundsResult = await knex('refunds')
    .where('created_at', '>=', startOfDay)
    .sum('amount as total_refunds')
    .first()

  const totalSales = Number(salesResult?.total_sales || 0)
  const cashSales = Number(salesResult?.cash_sales || 0)
  const cardSales = Number(salesResult?.card_sales || 0)
  const refunds = Number(refundsResult?.total_refunds || 0)
  const netTotal = totalSales - refunds

  return {
    totalSales,
    cashSales,
    cardSales,
    refunds,
    netTotal,
  }
}
