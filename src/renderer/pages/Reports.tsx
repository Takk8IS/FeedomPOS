import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getTodaySales,
  getWeeklySales,
  getMonthlySales,
  getYearlySales,
} from '../../database/salesService';
import { getLowStockProducts, getTopSellingProducts } from '../../database/productService';
import { Product } from '../../shared/types/product';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from '../components/ui/toast';
import { Select } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesData {
  count: number;
  total: number;
}

interface TopSellingProduct {
  id: number;
  name: string;
  totalSold: number;
}

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const [todaySales, setTodaySales] = useState<SalesData | null>(null);
  const [weeklySales, setWeeklySales] = useState<SalesData | null>(null);
  const [monthlySales, setMonthlySales] = useState<SalesData | null>(null);
  const [yearlySales, setYearlySales] = useState<SalesData | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'sales' | 'inventory'>('sales');

  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [today, weekly, monthly, yearly, lowStock, topSelling] = await Promise.all([
        getTodaySales(),
        getWeeklySales(),
        getMonthlySales(),
        getYearlySales(),
        getLowStockProducts(10), // Threshold of 10 for low stock
        getTopSellingProducts(5), // Top 5 selling products
      ]);
      setTodaySales(today);
      setWeeklySales(weekly);
      setMonthlySales(monthly);
      setYearlySales(yearly);
      setLowStockProducts(lowStock);
      setTopSellingProducts(topSelling);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error(t('reports.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const renderSalesReport = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SalesCard title={t('reports.todaySales')} data={todaySales} />
        <SalesCard title={t('reports.weeklySales')} data={weeklySales} />
        <SalesCard title={t('reports.monthlySales')} data={monthlySales} />
        <SalesCard title={t('reports.yearlySales')} data={yearlySales} />
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('reports.salesTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: t('reports.today'), sales: todaySales?.total || 0 },
                { name: t('reports.weekly'), sales: weeklySales?.total || 0 },
                { name: t('reports.monthly'), sales: monthlySales?.total || 0 },
                { name: t('reports.yearly'), sales: yearlySales?.total || 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.lowStockProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length === 0 ? (
            <p className="text-muted-foreground">{t('reports.noLowStockProducts')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.productName')}</TableHead>
                  <TableHead>{t('reports.currentStock')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="font-semibold text-danger">{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('reports.topSellingProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.productName')}</TableHead>
                <TableHead>{t('reports.totalSold')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSellingProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.totalSold}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
        <Select
          value={selectedReport}
          onValueChange={(value: 'sales' | 'inventory') => setSelectedReport(value)}
        >
          <Select.Option value="sales">{t('reports.salesReport')}</Select.Option>
          <Select.Option value="inventory">{t('reports.inventoryReport')}</Select.Option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : selectedReport === 'sales' ? (
        renderSalesReport()
      ) : (
        renderInventoryReport()
      )}
    </div>
  );
};

const SalesCard: React.FC<{ title: string; data: SalesData | null }> = ({ title, data }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <>
            <p className="text-3xl font-bold text-primary">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                data.total,
              )}
            </p>
            <p className="text-muted-foreground">
              {t('reports.numberOfSales', { count: data.count })}
            </p>
          </>
        ) : (
          <Skeleton className="h-[60px] w-full" />
        )}
      </CardContent>
    </Card>
  );
};

export default Reports;
