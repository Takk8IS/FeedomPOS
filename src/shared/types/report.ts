export interface HourlySales {
  hour: number;
  sales: number;
  transactions: number;
}

export interface PaymentMethodBreakdown {
  cash: number;
  card: number;
  other: number;
}

export interface SalesReport {
  date: Date;
  totalSales: number;
  totalTax: number;
  totalTransactions: number;
  netSales: number;
  paymentMethods: PaymentMethodBreakdown;
  hourlyBreakdown: HourlySales[];
}

export interface ProductReport {
  productId: number;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  stock: number;
  category: string;
  profitMargin: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
}

export interface TaxBreakdown {
  salesTax: number;
  otherTaxes: number;
}

export interface FinancialReport {
  period: {
    start: Date;
    end: Date;
  };
  revenue: number;
  costs: number;
  grossProfit: number;
  netProfit: number;
  expenses: ExpenseCategory[];
  taxes: TaxBreakdown;
}

export interface InventoryProduct {
  id: number;
  name: string;
  currentStock: number;
  reorderPoint: number;
  lastRestockDate: Date;
  valueOnHand: number;
}

export interface InventoryReport {
  date: Date;
  products: InventoryProduct[];
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}
