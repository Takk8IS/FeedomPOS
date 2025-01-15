import React, { useState, useEffect } from 'react'
import { getTodaySales } from '../../database/salesService'
import { getLowStockProducts } from '../../database/productService'
import { Product } from '../../shared/types/product'

const Reports: React.FC = () => {
  const [todaySales, setTodaySales] = useState({ count: 0, total: 0 })
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    const sales = await getTodaySales()
    setTodaySales(sales)

    const lowStock = await getLowStockProducts(10) // Threshold of 10 for low stock
    setLowStockProducts(lowStock)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Today's Sales</h2>
          <p className="text-3xl font-bold text-primary">${todaySales.total.toFixed(2)}</p>
          <p className="text-gray-600">Number of sales: {todaySales.count}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-600">No low stock products</p>
          ) : (
            <ul className="space-y-2">
              {lowStockProducts.map((product) => (
                <li key={product.id} className="flex justify-between items-center">
                  <span>{product.name}</span>
                  <span className="font-semibold text-danger">{product.stock} in stock</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add more report sections here as needed */}
    </div>
  )
}

export default Reports
