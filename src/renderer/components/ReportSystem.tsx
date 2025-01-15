import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Select } from './ui/select'
import { Input } from './ui/input'
import { toast } from './ui/toast'

const { ipcRenderer } = window.require('electron')

const ReportSystem: React.FC = () => {
  const { t } = useTranslation()
  const [reportType, setReportType] = useState('daily')
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [report, setReport] = useState<any>(null)

  const generateReport = async () => {
    try {
      let result
      switch (reportType) {
        case 'daily':
          result = await ipcRenderer.invoke('generate-daily-report', date)
          break
        case 'weekly':
          result = await ipcRenderer.invoke('generate-weekly-report', date)
          break
        case 'monthly':
          result = await ipcRenderer.invoke('generate-monthly-report', parseInt(year), parseInt(month))
          break
        case 'annual':
          result = await ipcRenderer.invoke('generate-annual-report', parseInt(year))
          break
        default:
          throw new Error('Invalid report type')
      }

      if (result.success) {
        setReport(result.report)
        toast.success(t('reports.generated'))
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error(t('errors.generateReport'))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('reports.title')}</h1>

      <div className="space-y-4">
        <Select
          value={reportType}
          onValueChange={(value) => setReportType(value)}
        >
          <Select.Option value="daily">{t('reports.daily')}</Select.Option>
          <Select.Option value="weekly">{t('reports.weekly')}</Select.Option>
          <Select.Option value="monthly">{t('reports.monthly')}</Select.Option>
          <Select.Option value="annual">{t('reports.annual')}</Select.Option>
        </Select>

        {(reportType === 'daily' || reportType === 'weekly') && (
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}

        {(reportType === 'monthly' || reportType === 'annual') && (
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={t('reports.year')}
          />
        )}

        {reportType === 'monthly' && (
          <Input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder={t('reports.month')}
          />
        )}

        <Button onClick={generateReport}>
          {t('reports.generate')}
        </Button>
      </div>

      {report && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t('reports.results')}</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <p><strong>{t('reports.totalSales')}:</strong> ${report.totalSales.toFixed(2)}</p>
            <p><strong>{t('reports.totalTax')}:</strong> ${report.totalTax.toFixed(2)}</p>
            <p><strong>{t('reports.netSales')}:</strong> ${report.netSales.toFixed(2)}</p>
            <p><strong>{report.netSales.toFixed(2)}</strong></p>
            <p><strong>{t('reports.totalTransactions')}:</strong> {report.totalTransactions}</p>
            {report.topSellingProducts && (
              <div>
                <h3 className="text-xl font-bold mt-4 mb-2">{t('reports.topSellingProducts')}</h3>
                <ul>
                  {report.topSellingProducts.map((product: any, index: number) => (
                    <li key={index}>
                      {product.name}: {product.quantity} units, ${product.revenue.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.leastSellingProducts && (
              <div>
                <h3 className="text-xl font-bold mt-4 mb-2">{t('reports.leastSellingProducts')}</h3>
                <ul>
                  {report.leastSellingProducts.map((product: any, index: number) => (
                    <li key={index}>
                      {product.name}: {product.quantity} units, ${product.revenue.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportSystem
