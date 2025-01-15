import knex from './db';
import { Dict } from '../shared/types/common';

// Interfaces remain unchanged

export async function getDailySalesReport(date: Date): Promise<SalesReport> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const salesData = await knex('sales')
    .whereBetween('createdAt', [startOfDay, endOfDay])
    .select(
      knex.raw('SUM(total) as totalSales'),
      knex.raw('SUM(tax) as totalTax'),
      knex.raw('COUNT(*) as totalTransactions'),
    )
    .first();

  const paymentMethodData = await getPaymentMethodBreakdown(startOfDay, endOfDay);
  const hourlyData = await getHourlyBreakdown(startOfDay, endOfDay);

  return {
    date,
    totalSales: Number(salesData?.totalSales) || 0,
    totalTax: Number(salesData?.totalTax) || 0,
    totalTransactions: Number(salesData?.totalTransactions) || 0,
    netSales: Number(salesData?.totalSales || 0) - Number(salesData?.totalTax || 0),
    paymentMethods: paymentMethodData,
    hourlyBreakdown: hourlyData,
  };
}

export async function getWeeklySalesReport(startDate: Date): Promise<SalesReport[]> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const salesData = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .select(
      knex.raw('DATE(createdAt) as date'),
      knex.raw('SUM(total) as totalSales'),
      knex.raw('SUM(tax) as totalTax'),
      knex.raw('COUNT(*) as totalTransactions'),
    )
    .groupBy(knex.raw('DATE(createdAt)'));

  return Promise.all(
    salesData.map(async (data) => ({
      date: new Date(data.date),
      totalSales: Number(data.totalSales) || 0,
      totalTax: Number(data.totalTax) || 0,
      totalTransactions: Number(data.totalTransactions) || 0,
      netSales: Number(data.totalSales || 0) - Number(data.totalTax || 0),
      paymentMethods: await getPaymentMethodBreakdown(new Date(data.date), new Date(data.date)),
      hourlyBreakdown: await getHourlyBreakdown(new Date(data.date), new Date(data.date)),
    })),
  );
}

// Other functions remain largely unchanged, with camelCase adjustments

async function calculateInventoryTurnover(date: Date): Promise<number> {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const costOfGoodsSold = await knex('salesItems')
    .join('products', 'salesItems.productId', 'products.id')
    .whereBetween('salesItems.createdAt', [yearStart, date])
    .sum('products.cost * salesItems.quantity as totalCost')
    .first();

  const averageInventory = await calculateAverageInventoryValue(date);
  return averageInventory > 0 ? Number(costOfGoodsSold?.totalCost || 0) / averageInventory : 0;
}

async function calculateAverageInventoryValue(date: Date): Promise<number> {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const result = await knex('inventorySnapshots')
    .whereBetween('date', [yearStart, date])
    .avg('totalValue as avgValue')
    .first();
  return Number(result?.avgValue || 0);
}

async function getCustomerCount(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('customers')
    .whereBetween('createdAt', [startDate, endDate])
    .count('* as count')
    .first();
  return Number(result?.count || 0);
}

async function calculateCustomerRetention(startDate: Date, endDate: Date): Promise<number> {
  const previousPeriod = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));

  const previousCustomers = await knex('sales')
    .distinct('customerId')
    .whereBetween('createdAt', [previousPeriod, startDate]);

  const returnedCustomers = await knex('sales')
    .distinct('customerId')
    .whereIn(
      'customerId',
      previousCustomers.map((c) => c.customerId),
    )
    .whereBetween('createdAt', [startDate, endDate]);

  return previousCustomers.length > 0
    ? (returnedCustomers.length / previousCustomers.length) * 100
    : 0;
}

async function calculateAverageOrderValue(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .avg('total as avgValue')
    .first();
  return Number(result?.avgValue || 0);
}

async function getPeakHours(
  startDate: Date,
  endDate: Date,
): Promise<Array<{ hour: number; sales: number }>> {
  const results = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .select(knex.raw('EXTRACT(HOUR FROM createdAt) as hour'))
    .count('* as sales')
    .groupBy('hour')
    .orderBy('sales', 'desc');

  return results.map((row) => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
  }));
}

async function getPaymentMethodBreakdown(
  startDate: Date,
  endDate: Date,
): Promise<Record<string, number>> {
  const results = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .select('paymentMethod')
    .sum('total as amount')
    .groupBy('paymentMethod');

  return results.reduce(
    (acc, { paymentMethod, amount }) => ({
      ...acc,
      [paymentMethod]: Number(amount),
    }),
    {} as Record<string, number>,
  );
}

async function getHourlyBreakdown(
  startDate: Date,
  endDate: Date,
): Promise<Array<{ hour: number; sales: number }>> {
  const results = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .select(knex.raw('EXTRACT(HOUR FROM createdAt) as hour'))
    .sum('total as sales')
    .groupBy('hour')
    .orderBy('hour');

  return results.map((row) => ({
    hour: Number(row.hour),
    sales: Number(row.sales),
  }));
}

async function calculateTotalTax(startDate: Date, endDate: Date): Promise<number> {
  const result = await knex('sales')
    .whereBetween('createdAt', [startDate, endDate])
    .sum('tax as totalTax')
    .first();
  return Number(result?.totalTax || 0);
}

async function calculateCashFlow(
  startDate: Date,
  endDate: Date,
): Promise<{ opening: number; closing: number; netChange: number }> {
  const openingBalance = await getOpeningBalance(startDate);
  const closingBalance = await getClosingBalance(endDate);
  const netChange = closingBalance - openingBalance;

  return {
    opening: openingBalance,
    closing: closingBalance,
    netChange,
  };
}

async function getOpeningBalance(date: Date): Promise<number> {
  const result = await knex('cashRegisterSessions')
    .where('createdAt', '<', date)
    .orderBy('createdAt', 'desc')
    .select('closingBalance')
    .first();
  return Number(result?.closingBalance || 0);
}

async function getClosingBalance(date: Date): Promise<number> {
  const result = await knex('cashRegisterSessions')
    .where('createdAt', '<=', date)
    .orderBy('createdAt', 'desc')
    .select('closingBalance')
    .first();
  return Number(result?.closingBalance || 0);
}

async function calculateEmployeePerformance(
  startDate: Date,
  endDate: Date,
): Promise<EmployeePerformance[]> {
  const results = await knex('sales')
    .join('employees', 'sales.employeeId', 'employees.id')
    .whereBetween('sales.createdAt', [startDate, endDate])
    .select(
      'employees.id as employeeId',
      'employees.name',
      knex.raw('SUM(sales.total) as totalSales'),
      knex.raw('COUNT(*) as transactionCount'),
      knex.raw('SUM(sales.total) / COUNT(*) as averageTransactionValue'),
    )
    .groupBy('employees.id', 'employees.name');

  const hoursWorked = await getEmployeeHoursWorked(startDate, endDate);

  return results.map((employee) => ({
    employeeId: employee.employeeId,
    name: employee.name,
    totalSales: Number(employee.totalSales),
    transactionCount: Number(employee.transactionCount),
    averageTransactionValue: Number(employee.averageTransactionValue),
    hoursWorked: hoursWorked[employee.employeeId] || 0,
  }));
}

async function getEmployeeHoursWorked(
  startDate: Date,
  endDate: Date,
): Promise<Record<number, number>> {
  const shifts = await knex('employeeShifts')
    .whereBetween('date', [startDate, endDate])
    .select('employeeId', knex.raw('SUM(hoursWorked) as totalHours'))
    .groupBy('employeeId');

  return shifts.reduce(
    (acc, { employeeId, totalHours }) => ({
      ...acc,
      [employeeId]: Number(totalHours),
    }),
    {} as Record<number, number>,
  );
}
