import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Select } from './ui/select';
import { Input } from './ui/input';
import { toast } from './ui/toast';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Label } from './ui/label';

const { ipcRenderer } = window.require('electron');

type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual';

interface ReportData {
  totalSales: number;
  totalTax: number;
  netSales: number;
  totalTransactions: number;
  topSellingProducts?: Array<{ name: string; quantity: number; revenue: number }>;
  leastSellingProducts?: Array<{ name: string; quantity: number; revenue: number }>;
}

const ReportSystem: React.FC = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      let result;
      switch (reportType) {
        case 'daily':
        case 'weekly':
          result = await ipcRenderer.invoke(`generate-${reportType}-report`, date);
          break;
        case 'monthly':
          result = await ipcRenderer.invoke(
            'generate-monthly-report',
            parseInt(year),
            parseInt(month),
          );
          break;
        case 'annual':
          result = await ipcRenderer.invoke('generate-annual-report', parseInt(year));
          break;
      }

      if (result.success) {
        setReport(result.report);
        toast.success(t('reports.generated'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(t('errors.generateReport'));
    } finally {
      setIsLoading(false);
    }
  }, [reportType, date, month, year, t]);

  const validateInputs = (): boolean => {
    if ((reportType === 'daily' || reportType === 'weekly') && !date) {
      toast.error(t('reports.errors.noDate'));
      return false;
    }
    if ((reportType === 'monthly' || reportType === 'annual') && !year) {
      toast.error(t('reports.errors.noYear'));
      return false;
    }
    if (reportType === 'monthly' && !month) {
      toast.error(t('reports.errors.noMonth'));
      return false;
    }
    return true;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('reports.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reportType">{t('reports.selectType')}</Label>
          <Select
            id="reportType"
            value={reportType}
            onValueChange={(value: ReportType) => setReportType(value)}
          >
            <Select.Option value="daily">{t('reports.daily')}</Select.Option>
            <Select.Option value="weekly">{t('reports.weekly')}</Select.Option>
            <Select.Option value="monthly">{t('reports.monthly')}</Select.Option>
            <Select.Option value="annual">{t('reports.annual')}</Select.Option>
          </Select>
        </div>

        {(reportType === 'daily' || reportType === 'weekly') && (
          <div className="space-y-2">
            <Label htmlFor="date">{t('reports.date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(value) => setDate(value)}
              aria-label={t('reports.date')}
            />
          </div>
        )}

        {(reportType === 'monthly' || reportType === 'annual') && (
          <div className="space-y-2">
            <Label htmlFor="year">{t('reports.year')}</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(value) => setYear(value)}
              placeholder={t('reports.yearPlaceholder')}
              min="2000"
              max="2099"
              aria-label={t('reports.year')}
            />
          </div>
        )}

        {reportType === 'monthly' && (
          <div className="space-y-2">
            <Label htmlFor="month">{t('reports.month')}</Label>
            <Input
              id="month"
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(value) => setMonth(value)}
              placeholder={t('reports.monthPlaceholder')}
              aria-label={t('reports.month')}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={generateReport} disabled={isLoading}>
          {isLoading ? t('common.loading') : t('reports.generate')}
        </Button>
      </CardFooter>

      {report && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('reports.results')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>{t('reports.totalSales')}:</strong> ${report.totalSales.toFixed(2)}
            </p>
            <p>
              <strong>{t('reports.totalTax')}:</strong> ${report.totalTax.toFixed(2)}
            </p>
            <p>
              <strong>{t('reports.netSales')}:</strong> ${report.netSales.toFixed(2)}
            </p>
            <p>
              <strong>{t('reports.totalTransactions')}:</strong> {report.totalTransactions}
            </p>
            {report.topSellingProducts && (
              <div>
                <h3 className="text-xl font-bold mt-4 mb-2">{t('reports.topSellingProducts')}</h3>
                <ul className="list-disc pl-5">
                  {report.topSellingProducts.map((product, index) => (
                    <li key={index}>
                      {product.name}: {product.quantity} {t('reports.units')}, $
                      {product.revenue.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.leastSellingProducts && (
              <div>
                <h3 className="text-xl font-bold mt-4 mb-2">{t('reports.leastSellingProducts')}</h3>
                <ul className="list-disc pl-5">
                  {report.leastSellingProducts.map((product, index) => (
                    <li key={index}>
                      {product.name}: {product.quantity} {t('reports.units')}, $
                      {product.revenue.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Card>
  );
};

export default ReportSystem;
