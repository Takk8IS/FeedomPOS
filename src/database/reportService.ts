import knex from './db'
import { Dict } from '../shared/types/common'

export interface SalesReport {
  date: Date
  totalSales: number
  totalTax: number
  totalTransactions: number
  netSales: number
  paymentMethods: Record<string, number>
  hourlyBreakdown: Array<{ hour: number; sales: number }>
}

export interface FinancialReport {
  startDate: Date
  endDate: Date
  generatedAt: Date
  revenue: number
  expenses: number
  grossProfit: number
  netProfit: number
  operatingExpenses: {
    labor: number
    rent: number
    utilities: number
    supplies: number
    other: number
  }
  taxLiability: number
  cashFlow: {
    opening: number
    closing: number
    netChange: number
  }
}

export interface ProductReport {
  productId: number
  name: string
  totalQuantity: number
  totalRevenue: number
}

export interface InventoryReport {
  startDate: Date
  endDate: Date
  generatedAt: Date
  totalItems: number
  totalValue: number
  lowStockItems: InventoryItem[]
  outOfStockItems: InventoryItem[]
  inventoryTurnover: number
  averageInventoryValue: number
}

export interface PerformanceReport {
  startDate: Date
  endDate: Date
  generatedAt: Date
  salesGrowth: number
  customerCount: number
  customerRetentionRate: number
  averageOrderValue: number
  peakHours: Array<{ hour: number; sales: number }>
  employeePerformance: EmployeePerformance[]
}

export interface InventoryItem {
  id: number
  name: string
  sku: string
  currentStock: number
  reorderPoint: number
  value: number
  lastRestockDate: Date
}

export interface EmployeePerformance {
  employeeId: number
  name: string
  totalSales: number
  transactionCount: number
  averageTransactionValue: number
  hoursWorked: number
}

export async function getDailySalesReport(date: Date): Promise<SalesReport> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const salesData = await knex('sales')
    .whereBetween('created_at', [startOfDay, endOfDay])
    .select(
      knex.raw('SUM(total) as total_sales'),
      knex.raw('SUM(tax) as total_tax'),
      knex.raw('COUNT(*) as total_transactions')
    )
    .first()

  const paymentMethodData = await getPaymentMethodBreakdown(startOfDay, endOfDay)
  const hourlyData = await getHourlyBreakdown(startOfDay, endOfDay)

  return {
    date,
    totalSales: Number(salesData?.total_sales) || 0,
    totalTax: Number(salesData?.total_tax) || 0,
    totalTransactions: Number(salesData?.total_transactions) || 0,
    netSales: Number(salesData?.total_sales || 0) - Number(salesData?.total_tax || 0),
    paymentMethods: paymentMethodData,
    hourlyBreakdown: hourlyData,
  }
}

export async function getWeeklySalesReport(startDate: Date): Promise<SalesReport[]> {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const salesData = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select(
      knex.raw('DATE(created_at) as date'),
      knex.raw('SUM(total) as total_sales'),
      knex.raw('SUM(tax) as total_tax'),
      knex.raw('COUNT(*) as total_transactions')
    )
    .groupBy(knex.raw('DATE(created_at)'))

  return Promise.all(
    salesData.map(async (data) => ({
      date: new Date(data.date),
      totalSales: Number(data.total_sales) || 0,
      totalTax: Number(data.total_tax) || 0,
      totalTransactions: Number(data.total_transactions) || 0,
      netSales: Number(data.total_sales || 0) - Number(data.total_tax || 0),
      paymentMethods: await getPaymentMethodBreakdown(new Date(data.date), new Date(data.date)),
      hourlyBreakdown: await getHourlyBreakdown(new Date(data.date), new Date(data.date)),
    }))
  )
}

export async function getMonthlySalesReport(year: number, month: number): Promise<SalesReport> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const salesData = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select(
      knex.raw('SUM(total) as total_sales'),
      knex.raw('SUM(tax) as total_tax'),
      knex.raw('COUNT(*) as total_transactions')
    )
    .first()

  const paymentMethodData = await getPaymentMethodBreakdown(startDate, endDate)
  const hourlyData = await getHourlyBreakdown(startDate, endDate)

  return {
    date: startDate,
    totalSales: Number(salesData?.total_sales) || 0,
    totalTax: Number(salesData?.total_tax) || 0,
    totalTransactions: Number(salesData?.total_transactions) || 0,
    netSales: Number(salesData?.total_sales || 0) - Number(salesData?.total_tax || 0),
    paymentMethods: paymentMethodData,
    hourlyBreakdown: hourlyData,
  }
}

export async function getYearlySalesReport(year: number): Promise<SalesReport> {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const salesData = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select(
      knex.raw('SUM(total) as total_sales'),
      knex.raw('SUM(tax) as total_tax'),
      knex.raw('COUNT(*) as total_transactions')
    )
    .first()

  const paymentMethodData = await getPaymentMethodBreakdown(startDate, endDate)
  const hourlyData = await getHourlyBreakdown(startDate, endDate)

  return {
    date: startDate,
    totalSales: Number(salesData?.total_sales) || 0,
    totalTax: Number(salesData?.total_tax) || 0,
    totalTransactions: Number(salesData?.total_transactions) || 0,
    netSales: Number(salesData?.total_sales || 0) - Number(salesData?.total_tax || 0),
    paymentMethods: paymentMethodData,
    hourlyBreakdown: hourlyData,
  }
}

export async function generateFinancialReport(
  startDate: Date,
  endDate: Date
): Promise<FinancialReport> {
  const revenue = await calculateTotalRevenue(startDate, endDate)
  const expenses = await calculateTotalExpenses(startDate, endDate)
  const operatingExpenses = await getOperatingExpenses(startDate, endDate)
  const taxLiability = await calculateTotalTax(startDate, endDate)
  const cashFlow = await calculateCashFlow(startDate, endDate)

  return {
    startDate,
    endDate,
    generatedAt: new Date(),
    revenue,
    expenses,
    grossProfit: revenue - expenses,
    netProfit:
      revenue -
      expenses -
      operatingExpenses.labor -
      operatingExpenses.rent -
      operatingExpenses.utilities -
      operatingExpenses.supplies -
      operatingExpenses.other,
    operatingExpenses,
    taxLiability,
    cashFlow,
  }
}

export async function generateInventoryReport(date: Date): Promise<InventoryReport> {
  const inventoryItems = await knex('inventory')
    .select('*')
    .whereRaw('current_stock <= reorder_point')

  const totalValue = await knex('inventory').sum('current_stock * unit_cost as total_value').first()

  const totalItemsResult = await knex('inventory').count('* as count').first()
  const totalItems = Number(totalItemsResult?.count || 0)
  const inventoryTurnover = await calculateInventoryTurnover(date)
  const averageInventoryValue = await calculateAverageInventoryValue(date)

  return {
    startDate: date,
    endDate: date,
    generatedAt: new Date(),
    totalItems,
    totalValue: Number(totalValue?.total_value || 0),
    lowStockItems: inventoryItems.filter((item) => item.current_stock > 0),
    outOfStockItems: inventoryItems.filter((item) => item.current_stock === 0),
    inventoryTurnover,
    averageInventoryValue,
  }
}

export async function generatePerformanceReport(
  startDate: Date,
  endDate: Date
): Promise<PerformanceReport> {
  const previousPeriodStart = new Date(
    startDate.getTime() - (endDate.getTime() - startDate.getTime())
  )

  const currentPeriodSales = await calculateTotalRevenue(startDate, endDate)
  const previousPeriodSales = await calculateTotalRevenue(previousPeriodStart, startDate)
  const salesGrowth =
    previousPeriodSales !== 0
      ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100
      : 0

  const [customerCount, customerRetentionRate, averageOrderValue, peakHours, employeePerformance] =
    await Promise.all([
      getCustomerCount(startDate, endDate),
      calculateCustomerRetention(startDate, endDate),
      calculateAverageOrderValue(startDate, endDate),
      getPeakHours(startDate, endDate),
      calculateEmployeePerformance(startDate, endDate),
    ])

  return {
    startDate,
    endDate,
    generatedAt: new Date(),
    salesGrowth,
    customerCount,
    customerRetentionRate,
    averageOrderValue,
    peakHours,
    employeePerformance,
  }
}

async function calculateTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .sum('total as total_revenue')
    .first()

  return Number(result?.total_revenue || 0)
}

async function calculateTotalExpenses(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('expenses')
    .whereBetween('date', [startDate, endDate])
    .sum('amount as total_expenses')
    .first()
  return Number(result?.total_expenses || 0)
}

async function getOperatingExpenses(startDate: Date, endDate: Date) {
  const expenses = await knex('expenses')
    .whereBetween('date', [startDate, endDate])
    .select('category')
    .sum('amount as total')
    .groupBy('category')

  return {
    labor: Number(expenses.find((e) => e.category === 'labor')?.total || 0),
    rent: Number(expenses.find((e) => e.category === 'rent')?.total || 0),
    utilities: Number(expenses.find((e) => e.category === 'utilities')?.total || 0),
    supplies: Number(expenses.find((e) => e.category === 'supplies')?.total || 0),
    other: Number(expenses.find((e) => e.category === 'other')?.total || 0),
  }
}

export async function getTopSellingProducts(
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<ProductReport[]> {
  const results = await knex('sale_items')
    .join('products', 'sale_items.product_id', 'products.id')
    .join('sales', 'sale_items.sale_id', 'sales.id')
    .whereBetween('sales.created_at', [startDate, endDate])
    .select(
      'products.id as productId',
      'products.name',
      knex.raw('SUM(sale_items.quantity) as totalQuantity'),
      knex.raw('SUM(sale_items.price * sale_items.quantity) as totalRevenue')
    )
    .groupBy('products.id', 'products.name')
    .orderBy('totalQuantity', 'desc')
    .limit(limit)

  return results.map((item) => ({
    productId: item.productId,
    name: item.name,
    totalQuantity: Number(item.totalQuantity),
    totalRevenue: Number(item.totalRevenue),
  }))
}

export async function getLeastSellingProducts(
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<ProductReport[]> {
  const results = await knex('sale_items')
    .join('products', 'sale_items.product_id', 'products.id')
    .join('sales', 'sale_items.sale_id', 'sales.id')
    .whereBetween('sales.created_at', [startDate, endDate])
    .select(
      'products.id as productId',
      'products.name',
      knex.raw('SUM(sale_items.quantity) as totalQuantity'),
      knex.raw('SUM(sale_items.price * sale_items.quantity) as totalRevenue')
    )
    .groupBy('products.id', 'products.name')
    .orderBy('totalQuantity', 'asc')
    .limit(limit)

  return results.map((item) => ({
    productId: item.productId,
    name: item.name,
    totalQuantity: Number(item.totalQuantity),
    totalRevenue: Number(item.totalRevenue),
  }))
}

async function calculateInventoryTurnover(date: Date): Promise<number> {
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const costOfGoodsSold = await knex('sales_items')
    .join('products', 'sales_items.product_id', 'products.id')
    .whereBetween('sales_items.created_at', [yearStart, date])
    .sum('products.cost * sales_items.quantity as total_cost')
    .first()

  const averageInventory = await calculateAverageInventoryValue(date)
  return averageInventory > 0 ? Number(costOfGoodsSold?.total_cost || 0) / averageInventory : 0
}

async function calculateAverageInventoryValue(date: Date): Promise<number> {
  const yearStart = new Date(date.getFullYear(), 0, 1)
  const result = await knex('inventory_snapshots')
    .whereBetween('date', [yearStart, date])
    .avg('total_value as avg_value')
    .first()
  return Number(result?.avg_value || 0)
}

async function getCustomerCount(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('customers')
    .whereBetween('created_at', [startDate, endDate])
    .count('* as count')
    .first()
  return Number(result?.count || 0)
}

async function calculateCustomerRetention(startDate: Date, endDate: Date): Promise<number> {
  const previousPeriod = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))

  const previousCustomers = await knex('sales')
    .distinct('customer_id')
    .whereBetween('created_at', [previousPeriod, startDate])

  const returnedCustomers = await knex('sales')
    .distinct('customer_id')
    .whereIn(
      'customer_id',
      previousCustomers.map((c) => c.customer_id)
    )
    .whereBetween('created_at', [startDate, endDate])

  return previousCustomers.length > 0
    ? (returnedCustomers.length / previousCustomers.length) * 100
    : 0
}

async function calculateAverageOrderValue(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .avg('total as avg_value')
    .first()
  return Number(result?.avg_value || 0)
}

async function getPeakHours(
  startDate: Date,
  endDate: Date
): Promise<Array<{ hour: number; sales: number }>> {
  const results = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select(knex.raw('EXTRACT(HOUR FROM created_at) as hour'))
    .count('* as sales')
    .groupBy('hour')
    .orderBy('sales', 'desc')

  return results.map((row) => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
  }))
}

async function getPaymentMethodBreakdown(
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const results = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select('payment_method')
    .sum('total as amount')
    .groupBy('payment_method')

  return results.reduce(
    (acc, { payment_method, amount }) => ({
      ...acc,
      [payment_method]: Number(amount),
    }),
    {} as Record<string, number>
  )
}

async function getHourlyBreakdown(
  startDate: Date,
  endDate: Date
): Promise<Array<{ hour: number; sales: number }>> {
  const results = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .select(knex.raw('EXTRACT(HOUR FROM created_at) as hour'))
    .sum('total as sales')
    .groupBy('hour')
    .orderBy('hour')

  return results.map((row) => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
  }))
}

async function calculateTotalTax(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('sales')
    .whereBetween('created_at', [startDate, endDate])
    .sum('tax as total_tax')
    .first()
  return Number(result?.total_tax || 0)
}

async function calculateCashFlow(
  startDate: Date,
  endDate: Date
): Promise<{ opening: number; closing: number; netChange: number }> {
  const openingBalance = await getOpeningBalance(startDate)
  const closingBalance = await getClosingBalance(endDate)
  const netChange = closingBalance - openingBalance

  return {
    opening: openingBalance,
    closing: closingBalance,
    netChange,
  }
}

async function getOpeningBalance(date: Date): Promise<number> {
  const result = await knex('cash_register_sessions')
    .where('created_at', '<', date)
    .orderBy('created_at', 'desc')
    .select('closing_balance')
    .first()
  return Number(result?.closing_balance || 0)
}

async function getClosingBalance(date: Date): Promise<number> {
  const result = await knex('cash_register_sessions')
    .where('created_at', '<=', date)
    .orderBy('created_at', 'desc')
    .select('closing_balance')
    .first()
  return Number(result?.closing_balance || 0)
}

async function calculateEmployeePerformance(
  startDate: Date,
  endDate: Date
): Promise<EmployeePerformance[]> {
  const results = await knex('sales')
    .join('employees', 'sales.employee_id', 'employees.id')
    .whereBetween('sales.created_at', [startDate, endDate])
    .select(
      'employees.id as employeeId',
      'employees.name',
      knex.raw('SUM(sales.total) as totalSales'),
      knex.raw('COUNT(*) as transactionCount'),
      knex.raw('SUM(sales.total) / COUNT(*) as averageTransactionValue')
    )
    .groupBy('employees.id', 'employees.name')

  const hoursWorked = await getEmployeeHoursWorked(startDate, endDate)

  return results.map((employee) => ({
    employeeId: employee.employeeId,
    name: employee.name,
    totalSales: Number(employee.totalSales),
    transactionCount: Number(employee.transactionCount),
    averageTransactionValue: Number(employee.averageTransactionValue),
    hoursWorked: hoursWorked[employee.employeeId] || 0,
  }))
}

async function getEmployeeHoursWorked(
  startDate: Date,
  endDate: Date
): Promise<Record<number, number>> {
  const shifts = await knex('employee_shifts')
    .whereBetween('date', [startDate, endDate])
    .select('employee_id', knex.raw('SUM(hours_worked) as total_hours'))
    .groupBy('employee_id')

  return shifts.reduce(
    (acc, { employee_id, total_hours }) => ({
      ...acc,
      [employee_id]: Number(total_hours),
    }),
    {} as Record<number, number>
  )
}
