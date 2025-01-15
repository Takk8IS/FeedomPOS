export interface SalesReport {
date: Date
totalSales: number
totalTax: number
totalTransactions: number
netSales: number
paymentMethods: {
    cash: number
    card: number
    other: number
}
hourlyBreakdown: {
    hour: number
    sales: number
    transactions: number
}[]
}

export interface ProductReport {
productId: number
name: string
totalQuantity: number
totalRevenue: number
averagePrice: number
stock: number
category: string
profitMargin: number
}

export interface FinancialReport {
period: {
    start: Date
    end: Date
}
revenue: number
costs: number
grossProfit: number
netProfit: number
expenses: {
    category: string
    amount: number
}[]
taxes: {
    salesTax: number
    otherTaxes: number
}
}

export interface InventoryReport {
date: Date
products: {
    id: number
    name: string
    currentStock: number
    reorderPoint: number
    lastRestockDate: Date
    valueOnHand: number
}[]
totalValue: number
lowStockItems: number
outOfStockItems: number
}
