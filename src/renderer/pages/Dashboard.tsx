import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface DashboardSummary {
  totalSales: number
  todaySales: number
  lowStockItems: number
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalSales: 0,
    todaySales: 0,
    lowStockItems: 0,
  })

  useEffect(() => {
    // Fetch dashboard summary data
    const fetchSummary = async () => {
      // TODO: Implement API call to fetch summary data
      // For now, we'll use mock data
      setSummary({
        totalSales: 15000,
        todaySales: 1200,
        lowStockItems: 5,
      })
    }

    fetchSummary()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total Sales</h2>
          <p className="text-3xl font-bold text-primary">${summary.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Today's Sales</h2>
          <p className="text-3xl font-bold text-secondary">${summary.todaySales.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Low Stock Items</h2>
          <p className="text-3xl font-bold text-danger">{summary.lowStockItems}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              to="/sales"
              className="block w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition duration-200"
            >
              New Sale
            </Link>
            <Link
              to="/inventory"
              className="block w-full bg-secondary text-white py-2 px-4 rounded hover:bg-secondary-dark transition duration-200"
            >
              Manage Inventory
            </Link>
            <Link
              to="/reports"
              className="block w-full bg-accent text-white py-2 px-4 rounded hover:bg-accent-dark transition duration-200"
            >
              View Reports
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {/* TODO: Implement recent activity list */}
          <p className="text-gray-500">No recent activity to display.</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
